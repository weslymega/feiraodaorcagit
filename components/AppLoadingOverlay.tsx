import React from 'react';
import { APP_LOGOS } from '../constants';

interface AppLoadingOverlayProps {
    isActive: boolean;
    message?: string;
}

export const AppLoadingOverlay: React.FC<AppLoadingOverlayProps> = ({ isActive, message }) => {
    if (!isActive) return null;

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xl z-70 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500"
            style={{ pointerEvents: 'all' }}
        >
            <div className="relative flex items-center justify-center animate-pulse-group">
                {/* 1. Halo de fundo (Camada de Suporte Premium - Sutil) */}
                <div
                    className="absolute inset-0 bg-gradient-to-tr from-primary/15 via-transparent to-white/5 rounded-full blur-2xl"
                    style={{ transform: 'scale(1.6)' }}
                />

                {/* 2. Base circular translúcida para contraste (Orbital Core) */}
                <div className="absolute w-20 h-20 bg-white/5 backdrop-blur-sm rounded-full border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.03)]" />

                {/* 3. Spinner Maestro - Concentric Integrated Design */}
                <div className="w-24 h-24 border-[3px] border-white/5 border-t-primary rounded-full animate-spin relative z-10" />

                {/* 4. Ícone Centralizado (OFFICIAL CORRECT ASSET) */}
                <div className="absolute inset-0 flex items-center justify-center z-20">
                    <img
                        src={APP_LOGOS.ICON}
                        alt="Orca Logo"
                        className="w-12 h-12 object-contain"
                        style={{
                            filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.2))'
                        }}
                    />
                </div>
            </div>

            {(message || true) && (
                <div className="mt-10 space-y-4 animate-in slide-in-from-bottom-4 duration-700">
                    <p className="text-white/70 text-[10px] font-semibold tracking-[0.3em] uppercase">
                        {message || "Iniciando Experiência"}
                    </p>
                    <div className="flex justify-center gap-2">
                        <div className="w-1 h-1 bg-primary/30 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1 h-1 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1 h-1 bg-primary rounded-full animate-bounce" />
                    </div>
                </div>
            )}

            <style>{`
                @keyframes pulse-group {
                    0%, 100% { transform: scale(1); opacity: 0.95; }
                    50% { transform: scale(1.03); opacity: 1; }
                }
                .animate-pulse-group {
                    animation: pulse-group 3s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
};
