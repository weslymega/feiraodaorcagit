import React from 'react';
import { Skeleton } from '../ui/Skeleton';

interface AdCardSkeletonProps {
    variant?: 'horizontal' | 'vertical';
    className?: string;
}

export const AdCardSkeleton: React.FC<AdCardSkeletonProps> = ({ variant = 'horizontal', className = '' }) => {
    if (variant === 'vertical') {
        return (
            <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
                <Skeleton className="h-48 w-full" />
                <div className="p-4 space-y-3">
                    <Skeleton className="h-6 w-full rounded" />
                    <Skeleton className="h-7 w-1/3 rounded-lg" />
                    <Skeleton className="h-4 w-1/4 rounded mt-3" />
                </div>
            </div>
        );
    }

    return (
        <div className={`min-w-[160px] w-[160px] bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 relative ${className}`}>
            <Skeleton className="h-28 w-full" />
            <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-2/3 rounded" />
                <Skeleton className="h-5 w-1/2 rounded-md mt-1" />
                <Skeleton className="h-3 w-1/3 rounded mt-2" />
            </div>
        </div>
    );
};
