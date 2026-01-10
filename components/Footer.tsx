
import React from 'react';
import athosBg from '../assets/athos_bg_v3.jpg';
import logoFull from '../assets/logo_full.png';
import { Screen } from '../types';

interface FooterProps {
    onNavigate?: (screen: Screen) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
    const currentYear = new Date().getFullYear();

    const handleAboutClick = (e: React.MouseEvent) => {
        e.preventDefault();
        onNavigate?.(Screen.ABOUT_US);
    };

    return (
        <footer className="relative mt-16 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] text-gray-700">
            {/* Background com padrão e overlay refinado */}
            <div className="absolute inset-0 z-0 bg-gray-50">
                <div
                    className="absolute inset-0 opacity-[0.15]"
                    style={{
                        backgroundImage: `url(${athosBg})`,
                        backgroundSize: '250px',
                        backgroundRepeat: 'repeat',
                        backgroundPosition: 'center',
                    }}
                />
            </div>

            {/* Borda superior colorida (Identidade Brasília) */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-yellow-400 to-blue-600 z-10" />

            {/* Conteúdo Centralizado */}
            <div className="relative z-10 container mx-auto px-6 py-12 md:py-16 flex flex-col items-center text-center">

                {/* Logo */}
                <div className="mb-6 bg-white/80 p-4 rounded-2xl shadow-sm backdrop-blur-sm border border-white/50">
                    <img
                        src={logoFull}
                        alt="Feirão da Orca"
                        className="h-10 md:h-12 w-auto object-contain"
                    />
                </div>

                {/* Frase Principal */}
                <p className="max-w-2xl text-base md:text-lg font-medium leading-relaxed mb-10 text-gray-600">
                    A plataforma que conecta Brasília. Encontre veículos, imóveis, peças e serviços com a segurança e a confiança que você merece. Valorizando o que é nosso.
                </p>

                {/* Links em Linha */}
                <div className="flex flex-wrap justify-center gap-6 mb-12">
                    <button
                        onClick={handleAboutClick}
                        className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-wide bg-transparent border-none cursor-pointer"
                    >
                        Sobre nós
                    </button>
                    <span className="text-gray-300 hidden md:inline">|</span>
                    <button
                        onClick={() => onNavigate?.(Screen.TERMS_OF_USE)}
                        className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-wide bg-transparent border-none cursor-pointer"
                    >
                        Termos de uso
                    </button>
                    <span className="text-gray-300 hidden md:inline">|</span>
                    <button
                        onClick={() => onNavigate?.(Screen.PRIVACY_POLICY)}
                        className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-wide bg-transparent border-none cursor-pointer"
                    >
                        Política de Privacidade
                    </button>
                </div>

                {/* Copyright */}
                <div className="text-xs text-gray-400 font-medium pt-8 border-t border-gray-200/50 w-full text-center">
                    © {currentYear} Feirão da Orca - Todos os direitos reservados.
                </div>
            </div>
        </footer>
    );
};
