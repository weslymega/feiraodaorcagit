import React from 'react';
import { Smartphone, QrCode, MapPin, Check } from 'lucide-react';

export const HowAppWorksSection: React.FC = () => {
    return (
        <div className="mb-8 animate-in slide-in-from-right duration-500">

            {/* Cabeçalho da Seção */}
            <div className="px-5 mb-4 flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 rounded-xl border border-blue-200">
                    <Smartphone className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <h2 className="font-bold text-gray-900 text-lg leading-tight">
                        Como funciona o app
                    </h2>
                    <p className="text-[10px] text-gray-500 font-medium">Entenda os diferenciais do Feirão</p>
                </div>
            </div>

            {/* Carrossel Horizontal */}
            <div className="flex gap-4 overflow-x-auto px-5 pb-6 no-scrollbar snap-x snap-mandatory">

                {/* CARD 1: Funcionamento Básico */}
                <div className="min-w-[280px] w-[280px] bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-sm border border-blue-100 p-5 snap-start shrink-0 relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Smartphone className="w-5 h-5 text-blue-600" />
                        </div>
                        <h3 className="font-bold text-gray-900 text-base">O básico</h3>
                    </div>

                    <ul className="space-y-2 mt-4">
                        <li className="flex items-start gap-2 text-sm text-gray-700">
                            <Check className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span>Crie seu anúncio</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm text-gray-700">
                            <Check className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span>Compartilhe com interessados</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm text-gray-700">
                            <Check className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span>Receba contatos diretamente no app</span>
                        </li>
                    </ul>
                </div>

                {/* CARD 2: QR Code (Diferencial) */}
                <div className="min-w-[280px] w-[280px] bg-gradient-to-br from-purple-50 to-white rounded-2xl shadow-sm border border-purple-100 p-5 snap-start shrink-0 relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <QrCode className="w-5 h-5 text-purple-600" />
                        </div>
                        <h3 className="font-bold text-gray-900 text-base leading-tight">Compartilhe com QR Code</h3>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">
                        Cada anúncio gera um QR Code exclusivo que pode ser compartilhado fora do app.
                    </p>

                    <ul className="space-y-1 mb-3">
                        <li className="flex items-start gap-2 text-xs text-gray-700 font-medium">
                            <Check className="w-3.5 h-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
                            <span>Mais visibilidade fora do app</span>
                        </li>
                        <li className="flex items-start gap-2 text-xs text-gray-700 font-medium">
                            <Check className="w-3.5 h-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
                            <span>Acesso rápido ao anúncio</span>
                        </li>
                    </ul>

                    <div className="bg-purple-100/50 p-2 rounded-lg border border-purple-100">
                        <p className="text-[10px] text-purple-800 italic">
                            Exemplo: Você pode colocar o QR Code no vidro do veículo para facilitar o acesso ao anúncio.
                        </p>
                    </div>
                </div>

                {/* CARD 3: Feira de Domingo */}
                <div className="min-w-[280px] w-[280px] bg-gradient-to-br from-green-50 to-white rounded-2xl shadow-sm border border-green-100 p-5 snap-start shrink-0 relative overflow-hidden">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <MapPin className="w-5 h-5 text-green-600" />
                            </div>
                            <h3 className="font-bold text-gray-900 text-base">Estou na Feira</h3>
                        </div>
                        <span className="bg-green-100 text-green-700 text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                            Domingos
                        </span>
                    </div>

                    <p className="text-sm text-gray-700 mb-2">
                        Aos domingos, usuários podem indicar que estão presentes no feirão da orca.
                    </p>
                    <p className="text-xs text-gray-500">
                        Isso ajuda outros usuários a identificar anúncios disponíveis para negociação presencial.
                    </p>
                </div>

            </div>

            {/* Aviso de Confiança Play Store */}
            <div className="px-6">
                <p className="text-[10px] text-gray-400 italic text-center">
                    Algumas funcionalidades podem variar conforme o uso do aplicativo.
                </p>
            </div>

            {/* espaço para futuras melhorias (CTA / preview QR) */}
        </div>
    );
};
