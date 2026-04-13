import React from 'react';
import { Rocket, Star, Zap, Flame, Check, Info, MoreVertical, PlayCircle, Layers, ArrowRight } from 'lucide-react';
import { Screen } from '../../types';

interface HowBoostWorksSectionProps {
    onNavigate?: (screen: Screen) => void;
}

export const HowBoostWorksSection: React.FC<HowBoostWorksSectionProps> = ({ onNavigate }) => {
    const steps = [
        {
            icon: <PlayCircle className="w-5 h-5 text-blue-500" />,
            title: "1. Publique seu anúncio*",
            desc: "Seu veículo fica pronto para receber destaques."
        },
        {
            icon: <Rocket className="w-5 h-5 text-blue-600" />,
            title: "2. Ative o Turbo 🚀",
            desc: "Entre no seu anúncio e toque em \"Destacar / Turbo\""
        },
        {
            icon: <Layers className="w-5 h-5 text-indigo-500" />,
            title: "3. Assista vídeos curtos 🎬",
            desc: "Cada vídeo aumenta o nível de destaque."
        },
        {
            icon: <Flame className="w-5 h-5 text-orange-500" />,
            title: "4. Suba de nível 🔥",
            desc: "Quanto mais você assiste, mais seu anúncio aparece!"
        }
    ];

    const levels = [
        { icon: <Zap className="w-4 h-4 text-blue-500" />, name: "Premium", desc: "Mais visibilidade", color: "bg-blue-50 text-blue-700 border-blue-100" },
        { icon: <Rocket className="w-4 h-4 text-indigo-500" />, name: "Pro", desc: "Muito mais destaque", color: "bg-indigo-50 text-indigo-700 border-indigo-100" },
        { icon: <Flame className="w-4 h-4 text-orange-500" />, name: "Turbo Máximo", desc: "Topo do app", color: "bg-orange-50 text-orange-700 border-orange-100" }
    ];

    const benefits = [
        "Mais visualizações",
        "Mais contatos",
        "Mais chances de vender rápido"
    ];

    return (
        <div className="px-4 mb-10">
            <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-blue-500/5 border border-gray-100 relative overflow-hidden group">
                
                {/* Background Decor */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-50 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>

                {/* Cabeçalho */}
                <div className="relative z-10 mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full mb-3">
                        <Rocket className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Acelerador</span>
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 leading-tight mb-2 italic">
                        Como destacar seu <span className="text-blue-600">anúncio 🚀</span>
                    </h2>
                    <p className="text-sm text-gray-500 font-bold">
                        Dê mais visibilidade ao seu anúncio em poucos passos:
                    </p>
                </div>

                {/* Passo a Passo Visual */}
                <div className="space-y-6 mb-10 relative">
                    <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-gray-100 italic"></div>
                    {steps.map((step, index) => (
                        <div key={index} className="flex gap-4 relative z-10 transition-transform hover:translate-x-1 duration-300">
                            <div className="w-10 h-10 bg-white rounded-2xl shadow-md border border-gray-50 flex items-center justify-center flex-shrink-0">
                                {step.icon}
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-gray-900 leading-none mb-1">{step.title}</h3>
                                <p className="text-[11px] text-gray-500 font-medium leading-relaxed">{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Níveis de Destaque - O ESSENCIAL */}
                <div className="mb-10 animate-in fade-in zoom-in duration-1000">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Níveis de Destaque</p>
                    <div className="grid grid-cols-1 gap-3">
                        {levels.map((level, index) => (
                            <div key={index} className={`${level.color} rounded-2xl p-4 border flex items-center justify-between group/level transition-all hover:scale-[1.02]`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-white/80 flex items-center justify-center shadow-sm">
                                        {level.icon}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black italic leading-none mb-1">{level.name}</h4>
                                        <p className="text-[10px] opacity-70 font-bold uppercase tracking-tighter">{level.desc}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Benefícios */}
                <div className="grid grid-cols-1 gap-2 mb-8 bg-gray-50/50 p-4 rounded-3xl border border-gray-50">
                    {benefits.map((benefit, index) => (
                        <div key={index} className="flex items-center gap-2 text-[11px] text-gray-600 font-bold italic">
                            <Check className="w-3.5 h-3.5 text-blue-500" />
                            <span>{benefit}</span>
                        </div>
                    ))}
                </div>

                {/* Onde ativar? */}
                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex gap-4 items-start mb-8 transition-colors hover:bg-indigo-50">
                    <div className="p-1.5 bg-indigo-600 rounded-lg shadow-sm mt-0.5">
                        <Info className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <p className="text-[11px] font-black text-indigo-900 uppercase tracking-tighter mb-1 select-none">Onde ativar?</p>
                        <p className="text-[11px] text-indigo-800 leading-snug font-medium">
                            Vá em <span className="font-black italic underline decoration-indigo-300">Meus Anúncios</span> <ArrowRight className="w-3 h-3 inline" /> toque nos <span className="font-black flex inline-flex items-center gap-0.5 bg-white px-1.5 rounded-md shadow-sm border border-indigo-100">3 pontos <MoreVertical className="w-3 h-3 text-indigo-600" /></span> <ArrowRight className="w-3 h-3 inline" /> <span className="text-indigo-900 font-black italic">"Destacar / Turbo"</span>
                        </p>
                    </div>
                </div>

                {/* CTA BUTTON */}
                {onNavigate && (
                    <button 
                        onClick={() => onNavigate(Screen.MY_ADS)}
                        className="w-full bg-gray-900 text-white rounded-[1.5rem] py-5 font-black flex items-center justify-center gap-3 shadow-2xl shadow-gray-900/20 active:scale-95 transition-all group"
                    >
                        <Zap className="w-5 h-5 fill-yellow-400 text-yellow-400 group-hover:animate-pulse" />
                        Destacar meu anúncio agora
                    </button>
                )}

                <p className="text-[9px] text-gray-300 italic text-center mt-6 uppercase tracking-widest font-bold">
                    *Anúncios passam por moderação antes de ficarem visíveis • Mais contatos • Mais conversões
                </p>
            </div>
        </div>
    );
};
