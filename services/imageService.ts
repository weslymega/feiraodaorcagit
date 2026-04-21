import { supabase } from './api';

// --- NATIVE CANVAS COMPRESSION (BROWSER-IMAGE-COMPRESSION ALTERNATIVE) ---
/**
 * Image Service
 * Handles compression and upload to Supabase Storage
 */
export const imageService = {
    /**
     * Compresses an image based on the target type using native Canvas
     * @param file The original File object
     * @param type 'optimized' (1280px, 75%) or 'thumb' (300px, 70% 4:3)
     */
    async compress(file: File, type: 'optimized' | 'thumb'): Promise<File> {
        return new Promise((resolve) => {
            // Use setTimeout to ensure we don't block the UI thread immediately
            setTimeout(() => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = (event) => {
                    const img = new Image();
                    img.src = event.target?.result as string;
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        let targetWidth: number;
                        let targetHeight: number;
                        let quality: number;
                        let cropArea = { offsetX: 0, offsetY: 0, width: img.width, height: img.height };

                        if (type === 'thumb') {
                            // 4:3 Crop
                            targetWidth = 300;
                            targetHeight = 225;
                            quality = 0.7;

                            const targetRatio = 4 / 3;
                            const currentRatio = img.width / img.height;

                            if (currentRatio > targetRatio) {
                                cropArea.width = img.height * targetRatio;
                                cropArea.offsetX = (img.width - cropArea.width) / 2;
                            } else if (currentRatio < targetRatio) {
                                cropArea.height = img.width / targetRatio;
                                cropArea.offsetY = (img.height - cropArea.height) / 2;
                            }
                        } else {
                            // Optimized (Standard)
                            const maxSide = 1280;
                            quality = 0.75;
                            
                            if (img.width > img.height) {
                                targetWidth = Math.min(img.width, maxSide);
                                targetHeight = (img.height * targetWidth) / img.width;
                            } else {
                                targetHeight = Math.min(img.height, maxSide);
                                targetWidth = (img.width * targetHeight) / img.height;
                            }
                        }

                        canvas.width = targetWidth;
                        canvas.height = targetHeight;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            ctx.imageSmoothingEnabled = true;
                            ctx.imageSmoothingQuality = 'high';
                            ctx.drawImage(
                                img, 
                                cropArea.offsetX, cropArea.offsetY, cropArea.width, cropArea.height, 
                                0, 0, targetWidth, targetHeight
                            );
                        }

                        // Try WebP, fallback to JPEG
                        const tryCompression = (format: 'image/webp' | 'image/jpeg') => {
                            canvas.toBlob((blob) => {
                                if (blob) {
                                    const ext = format === 'image/webp' ? '.webp' : '.jpg';
                                    const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + `_${type}${ext}`, {
                                        type: format,
                                        lastModified: Date.now(),
                                    });
                                    resolve(compressedFile);
                                } else if (format === 'image/webp') {
                                    // If webp fails, try jpeg
                                    tryCompression('image/jpeg');
                                } else {
                                    resolve(file); // Final fallback
                                }
                            }, format, quality);
                        };

                        tryCompression('image/webp');
                    };
                    img.onerror = () => resolve(file);
                };
                reader.onerror = () => resolve(file);
            }, 0);
        });
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
