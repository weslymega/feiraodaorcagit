import React from 'react';

interface AppLoadingOverlayProps {
    isActive: boolean;
}

export const AppLoadingOverlay: React.FC<AppLoadingOverlayProps> = ({ isActive }) => {
    if (!isActive) return null;

    return (
        <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9999] flex items-center justify-center"
            style={{ pointerEvents: 'all' }}
        >
            {/* Spinner Minimalista */}
            <div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin" />
        </div>
    );
};
