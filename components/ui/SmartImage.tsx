import React, { useState, useEffect } from 'react';
import { Skeleton } from './Skeleton';

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    skeletonClassName?: string;
    thumbnailSrc?: string | null;
}

export const SmartImage: React.FC<SmartImageProps> = ({
    src,
    alt,
    className,
    skeletonClassName,
    thumbnailSrc,
    ...props
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isThumbLoaded, setIsThumbLoaded] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!src) return;
        setIsLoaded(false);
        setError(false);

        const img = new Image();
        img.src = src;
        img.onload = () => setIsLoaded(true);
        img.onerror = (err) => {
            console.error('❌ [SmartImage] Error loading main image:', src, {
                error: err,
                timestamp: new Date().toISOString(),
                ua: navigator.userAgent
            });
            setError(true);
        };
        
        if (thumbnailSrc) {
            const thumb = new Image();
            thumb.src = thumbnailSrc;
            thumb.onload = () => setIsThumbLoaded(true);
            thumb.onerror = (err) => {
                console.warn('⚠️ [SmartImage] Error loading thumbnail:', thumbnailSrc, err);
            };
        }
    }, [src, thumbnailSrc]);

    return (
        <div className={`relative overflow-hidden ${className || ''}`}>
            {/* 1. Skeleton (Apenas se nada carregou) */}
            {!isLoaded && !isThumbLoaded && !error && (
                <Skeleton className={`absolute inset-0 w-full h-full ${skeletonClassName || ''}`} />
            )}

            {/* 2. Thumbnail (Fundo desfocado enquanto carrega a original) */}
            {thumbnailSrc && !isLoaded && (
                <img
                    src={thumbnailSrc}
                    alt={alt}
                    className={`${className || ''} blur-sm scale-110 transition-opacity duration-300 ${isThumbLoaded ? 'opacity-100' : 'opacity-0'}`}
                    {...props}
                />
            )}

            {/* 3. Imagem Principal */}
            {src && (
                <img
                    src={src}
                    alt={alt}
                    loading="lazy"
                    className={`${className || ''} transition-opacity duration-500 absolute inset-0 w-full h-full ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                    {...props}
                />
            )}

            {error && (
                <div className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center p-4 text-center">
                    <img 
                        src="https://placehold.co/600x400?text=Sua+Internet+Falhou+ou+Imagem+Inexistente" 
                        alt="Erro"
                        className="w-12 h-12 opacity-20 mb-2 object-contain"
                    />
                    <span className="text-gray-400 text-[10px] font-medium leading-tight">Erro ao carregar imagem</span>
                </div>
            )}
        </div>
    );
};

