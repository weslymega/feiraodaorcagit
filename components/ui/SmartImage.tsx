import React, { useState, useEffect } from 'react';
import { Skeleton } from './Skeleton';

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    skeletonClassName?: string;
}

export const SmartImage: React.FC<SmartImageProps> = ({
    src,
    alt,
    className,
    skeletonClassName,
    ...props
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!src) return;
        setIsLoaded(false);
        setError(false);

        const img = new Image();
        img.src = src;
        img.onload = () => setIsLoaded(true);
        img.onerror = () => setError(true);
    }, [src]);

    return (
        <div className={`relative overflow-hidden ${className || ''}`}>
            {!isLoaded && !error && (
                <Skeleton className={`absolute inset-0 w-full h-full ${skeletonClassName || ''}`} />
            )}

            {src && (
                <img
                    src={src}
                    alt={alt}
                    className={`${className || ''} transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                    {...props}
                />
            )}

            {error && (
                <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
                    <span className="text-gray-400 text-[10px]">Erro</span>
                </div>
            )}
        </div>
    );
};
