import React from 'react';
import { Rocket, PlusCircle, Star, ArrowUpRight, Users, Check } from 'lucide-react';

export const HowBoostWorksSection: React.FC = () => {
    const steps = [
        {
            icon: <PlusCircle className="w-5 h-5 text-blue-500" />,
            text: "Você cria um anúncio"
        },
        {
            icon: <Star className="w-5 h-5 text-yellow-500" />,
            text: "O anúncio pode receber destaque"
        },
        {
            icon: <ArrowUpRight className="w-5 h-5 text-green-500" />,
            text: "Ele aparece com mais prioridade"
        },
        {
            icon: <Users className="w-5 h-5 text-purple-500" />,
            text: "Mais pessoas visualizam e entram em contato"
        }
    ];

    const benefits = [
        "Mais visibilidade",
        "Mais chances de contato",
        "Maior destaque dentro do app"
    ];

    return (
        <div className="px-4 mb-8">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-5 shadow-sm border border-gray-100">

                {/* Cabeçalho */}
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-indigo-100 rounded-xl">
                        <Rocket className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-900 text-lg leading-tight">
                            Como funcionam os destaques
                        </h2>
                        <p className="text-xs text-gray-500 font-medium">Entenda como os destaques funcionam</p>
                    </div>
                </div>

                <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                    Anúncios destacados ganham mais visibilidade dentro do app.
                </p>

                {/* Passo a Passo */}
                <div className="space-y-3 mb-6 relative before:content-[''] before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-blue-200 before:via-yellow-200 before:to-purple-200">
                    {steps.map((step, index) => (
                        <div key={index} className="flex items-center gap-3 relative z-10">
                            <div className="w-10 h-10 bg-white rounded-full shadow-sm border border-gray-100 flex items-center justify-center flex-shrink-0">
                                {step.icon}
                            </div>
                            <p className="text-sm text-gray-700 font-medium">{step.text}</p>
                        </div>
                    ))}
                </div>

                {/* Benefícios */}
                <div className="bg-white rounded-xl p-4 border border-gray-50 shadow-sm mb-4">
                    <ul className="space-y-2">
                        {benefits.map((benefit, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                                <span>{benefit}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Aviso Play Store */}
                <p className="text-[10px] text-gray-400 italic text-center">
                    *O desempenho pode variar de acordo com o tipo de anúncio.
                </p>

                {/* espaço reservado para CTA futuro */}
            </div>
        </div>
    );
};
