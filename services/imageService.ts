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
     * @param type 'ad' (1280px, 80%) or 'chat' (800px, 70%)
     */
    async compress(file: File, type: 'ad' | 'chat'): Promise<File> {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const maxSide = type === 'ad' ? 1280 : 800;
                    const quality = type === 'ad' ? 0.8 : 0.7;
                    
                    let width = img.width;
                    let height = img.height;
                    let offsetX = 0;
                    let offsetY = 0;

                    // --- 4:3 Center Crop for Ads ---
                    if (type === 'ad') {
                        const targetRatio = 4 / 3;
                        const currentRatio = width / height;

                        if (currentRatio > targetRatio) {
                            // Too wide, crop sides
                            const newWidth = height * targetRatio;
                            offsetX = (width - newWidth) / 2;
                            width = newWidth;
                        } else if (currentRatio < targetRatio) {
                            // Too tall, crop top/bottom
                            const newHeight = width / targetRatio;
                            offsetY = (height - newHeight) / 2;
                            height = newHeight;
                        }

                        // Now scale the cropped area to maxSide
                        const scale = maxSide / Math.max(width, height);
                        canvas.width = width * scale;
                        canvas.height = height * scale;
                        
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            ctx.imageSmoothingEnabled = true;
                            ctx.imageSmoothingQuality = 'high';
                            ctx.drawImage(img, offsetX, offsetY, width, height, 0, 0, canvas.width, canvas.height);
                        }
                    } else {
                        // Fit for Chat (Maintain Aspect Ratio)
                        if (width > height) {
                            if (width > maxSide) {
                                height = height * (maxSide / width);
                                width = maxSide;
                            }
                        } else {
                            if (height > maxSide) {
                                width = width * (maxSide / height);
                                height = maxSide;
                            }
                        }
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx?.drawImage(img, 0, 0, width, height);
                    }

                    canvas.toBlob((blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                                type: 'image/webp',
                                lastModified: Date.now(),
                            });
                            resolve(compressedFile);
                        } else {
                            resolve(file); // Fallback
                        }
                    }, 'image/webp', quality);
                };
                img.onerror = () => resolve(file);
            };
            reader.onerror = () => resolve(file);
        });
    },

    /**
     * Uploads a file to a Supabase bucket
     * @param file Compressed file
     * @param bucket 'ads-images' or 'chat-images'
     * @param folder Optional folder name (e.g. userId or adId)
     */
    async upload(file: File, bucket: 'ads-images' | 'chat-images', folder?: string): Promise<string> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const timestamp = new Date().getTime();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const fileName = `${folder ? `${folder}/` : ''}${user.id}_${timestamp}_${randomStr}.webp`;

        console.log(`[imageService] Uploading to ${bucket}/${fileName}`, {
            size: file.size,
            type: file.type
        });

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('Upload error details:', {
                message: error.message,
                name: error.name,
                status: (error as any).status,
                bucket,
                fileName
            });
            throw error;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(fileName);

        return publicUrl;
    }
};
