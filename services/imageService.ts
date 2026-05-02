import { supabase } from './api';
import imageCompression from 'browser-image-compression';
import { captureError } from './sentry';

// --- IMAGE OPTIMIZATION SERVICE (HARDENED) ---
/**
 * Image Service
 * Handles compression and upload to Supabase Storage
 */
export const imageService = {
    /**
     * Compresses an image based on the target type using browser-image-compression
     * @param file The original File object
     * @param type 'optimized' (1200px, 300KB), 'thumb' (300px, 80KB) or 'chat' (800px, 150KB)
     */
    async compress(file: File, type: 'optimized' | 'thumb' | 'chat'): Promise<File> {
        const start = Date.now();
        console.log(`[imageService] Starting compression for ${file.name} (${type})`, { 
            originalSize: `${(file.size / 1024).toFixed(2)}KB`,
            type: file.type 
        });

        try {
            // Configurações baseadas no feedback da auditoria
            let maxSizeMB = 0.3;
            let maxWidthOrHeight = 1200;

            if (type === 'thumb') {
                maxSizeMB = 0.08;
                maxWidthOrHeight = 300;
            } else if (type === 'chat') {
                maxSizeMB = 0.15; // 150KB para chat é suficiente e mais rápido
                maxWidthOrHeight = 800;
            }

            const options = {
                maxSizeMB,
                maxWidthOrHeight,
                useWebWorker: true,
                fileType: 'image/webp' as any,
                initialQuality: 0.75,
                alwaysKeepResolution: false,
            };

            // 1. Processamento principal
            let compressedFile = await imageCompression(file, options);

            // 2. Validação Pós-Compressão (Integridade)
            if (!compressedFile || compressedFile.size === 0) {
                throw new Error("Compresão resultou em arquivo inválido ou vazio.");
            }

            // 3. Fallback Seguro (Se WebP falhar ou for recusado pelo navegador)
            // Nota: browser-image-compression já lida com fallbacks internos, 
            // mas adicionamos uma camada de log estruturado.
            
            const duration = Date.now() - start;
            console.log(`[imageService] Compression success: ${compressedFile.name}`, {
                finalSize: `${(compressedFile.size / 1024).toFixed(2)}KB`,
                reduction: `${((1 - (compressedFile.size / file.size)) * 100).toFixed(2)}%`,
                duration: `${duration}ms`
            });

            return compressedFile;

        } catch (error) {
            console.error(`[imageService] Compression FAILED for ${file.name}:`, error);
            
            // Regra de Trava de 5MB para Fallback Original
            if (file.size > 5 * 1024 * 1024) {
                console.error("[imageService] Fallback blocked: Original file exceeds 5MB limit.");
                throw new Error(`Arquivo original (${(file.size / (1024 * 1024)).toFixed(1)}MB) muito grande para upload sem compressão.`);
            }

            console.warn("[imageService] Returning original file as fallback (Under 5MB safety limit).");
            return file;
        }
    },

    /**
     * Uploads a file to a Supabase bucket
     * @param file Compressed file
     * @param bucket 'ads-images' | 'chat-images'
     * @param folder Optional folder name (e.g. userId or adId)
     */
    async upload(file: File, bucket: 'ads-images' | 'chat-images', folder?: string): Promise<string> {
        const startTimestamp = Date.now();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('[UPLOAD_ERROR] Usuário não autenticado');
            throw new Error('User not authenticated');
        }

        const timestamp = new Date().getTime();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${folder ? `${folder}/` : ''}${user.id}_${timestamp}_${randomStr}_${cleanFileName}`;

        // [ETAPA 3] Log de início
        console.log(`[UPLOAD_START] ${fileName}`, {
            size: `${(file.size / 1024).toFixed(2)}KB`,
            mimeType: file.type || 'unknown'
        });

        let lastError: any = null;
        const maxRetries = 2; // [ETAPA 4] Máximo de 2 retentativas (Total 3)
        const fileSizeKB = file.size / 1024;
        let timeoutMs = 20000;

        // [ESTRATÉGIA ADAPTATIVA] Ajusta timeout conforme o peso do arquivo
        if (fileSizeKB > 100 && fileSizeKB <= 500) {
            timeoutMs = 35000; // 35s para imagens médias (otimizadas)
        } else if (fileSizeKB > 500) {
            timeoutMs = 45000; // 45s para arquivos grandes (fallbacks)
        }

        console.log(`[UPLOAD_DEBUG] Timeout configurado: ${timeoutMs}ms para ${fileSizeKB.toFixed(2)}KB`);

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    const delay = attempt * 1000;
                    console.log(`[UPLOAD_DEBUG] Retentativa ${attempt}/${maxRetries} em ${delay}ms...`);
                    await new Promise(res => setTimeout(res, delay));
                }

                // [ETAPA 5] Implementação do Timeout via Promise.race
                const uploadPromise = supabase.storage
                    .from(bucket)
                    .upload(fileName, file, {
                        cacheControl: '3600',
                        upsert: false
                    });

                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Upload timeout')), timeoutMs)
                );

                // @ts-ignore - Supabase storage returns { data, error }
                const result = await Promise.race([uploadPromise, timeoutPromise]) as any;
                
                if (result.error) throw result.error;

                const duration = Date.now() - startTimestamp;
                
                // [ETAPA 3] Log de sucesso
                console.log(`[UPLOAD_SUCCESS] ${fileName}`, {
                    duration: `${duration}ms`,
                    attempts: attempt + 1,
                    timeoutApplied: timeoutMs
                });

                const { data: urlData } = supabase.storage
                    .from(bucket)
                    .getPublicUrl(fileName);

                return urlData?.publicUrl;

            } catch (error: any) {
                lastError = error;
                const isNetworkError = error.message?.toLowerCase().includes('fetch') || 
                                     error.message?.toLowerCase().includes('network');
                const isTimeout = error.message?.toLowerCase().includes('timeout');

                // [ETAPA 3] Log de erro
                console.error(`[UPLOAD_ERROR] Tentativa ${attempt} falhou:`, {
                    message: error.message,
                    type: isNetworkError ? 'network' : (isTimeout ? 'timeout' : 'unknown'),
                    timeoutConfigured: timeoutMs
                });

                // [ETAPA 2 & 6] Registro no Sentry
                captureError(error, {
                    tags: {
                        module: 'upload',
                        feature: 'image_upload',
                        attempt: String(attempt),
                        type: isTimeout ? 'timeout' : (isNetworkError ? 'network' : 'unknown')
                    },
                    extra: {
                        fileName: file.name,
                        fileSize: file.size,
                        fileSizeKB: fileSizeKB.toFixed(2),
                        mimeType: file.type,
                        userAgent: navigator.userAgent,
                        timestamp: new Date().toISOString(),
                        bucket,
                        folder,
                        configuredTimeout: timeoutMs,
                        attemptNumber: attempt
                    },
                    level: isTimeout || isNetworkError ? 'warning' : 'error'
                });

                // [ETAPA 4] Regras de interrupção de retry
                const status = error.status || error.status_code;
                if (status === 401 || status === 403 || status === 413) {
                    console.warn(`[UPLOAD_DEBUG] Erro fatal ${status}. Abortando retries.`);
                    break;
                }

                // Se for a última tentativa, o loop acaba e lança o erro abaixo
            }
        }

        throw lastError;
    }
};
