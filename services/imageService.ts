import { supabase } from './api';
import imageCompression from 'browser-image-compression';

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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const timestamp = new Date().getTime();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${folder ? `${folder}/` : ''}${user.id}_${timestamp}_${randomStr}_${cleanFileName}`;

        console.log(`[imageService] Uploading to ${bucket}/${fileName}`, { size: file.size });

        const { error } = await supabase.storage
            .from(bucket)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('[imageService] Upload error:', error);
            throw error;
        }

        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(fileName);

        const publicUrl = data?.publicUrl;
        console.log(`[imageService] Generated Public URL for ${fileName}:`, publicUrl);

        return publicUrl;
    }
};
