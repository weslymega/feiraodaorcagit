
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface PromoData {
    id: string;
    title: string;
    subtitle?: string;
    image: string;
    description?: string;
}

interface PromoModalProps {
    promo: PromoData;
    onClose: () => void;
}

export const PromoModal: React.FC<PromoModalProps> = ({ promo, onClose }) => {
    // Lock scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
            {/* Backdrop with extreme blur */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-xl transition-opacity"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-lg bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/50 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 flex flex-col max-h-[90vh]">

                {/* Header/Image Area */}
                <div className="relative h-64 sm:h-80 w-full flex-shrink-0">
                    <img
                        src={promo.image}
                        alt={promo.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-transparent" />

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-black/20 backdrop-blur-md hover:bg-black/30 text-white rounded-full transition-all border border-white/10 active:scale-95 z-20"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content Area */}
                <div className="p-8 sm:p-10 flex flex-col flex-1 overflow-y-auto no-scrollbar">
                    <div className="mb-6">
                        {promo.subtitle && (
                            <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase mb-3 border border-primary/20">
                                {promo.subtitle}
                            </span>
                        )}
                        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight mb-4">
                            {promo.title}
                        </h2>
                        <div className="w-12 h-1 bg-primary rounded-full mb-6" />

                        <p className="text-gray-600 font-medium leading-relaxed text-base sm:text-lg">
                            {promo.description || 'Confira esta oportunidade exclusiva no Feirão da Orca. Aproveite as melhores condições para o que você procura!'}
                        </p>
                    </div>

                    {/* Action Area */}
                    <div className="mt-auto space-y-3 pt-6">

                        <button
                            onClick={onClose}
                            className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-[0.98]"
                        >
                            Fechar Visualização
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
