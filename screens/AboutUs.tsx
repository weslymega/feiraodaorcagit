
import React from 'react';
import { Header } from '../components/Shared';
import { Target, Shield, Zap, Users, Mail, MessageCircle } from 'lucide-react';

interface AboutUsProps {
    onBack: () => void;
}

export const AboutUs: React.FC<AboutUsProps> = ({ onBack }) => {
    return (
        <div className="min-h-screen bg-gray-50 pb-32">
            <Header title="Sobre Nós" onBack={onBack} />

            <div className="max-w-4xl mx-auto px-4 pt-6">

                {/* Banner / Intro */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 mb-6 text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
                        <Users className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Bem-vindo ao Feirão da Orca</h2>
                    <p className="text-gray-600 leading-relaxed text-lg">
                        O Feirão da Orca é um marketplace digital criado para conectar pessoas que desejam comprar, vender ou anunciar veículos, imóveis, peças, serviços e outros produtos, de forma simples, rápida e segura.
                    </p>
                </div>

                {/* Missão e Transparência */}
                <div className="flex flex-col gap-6 mb-6">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
                        <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center mb-4 text-yellow-600">
                            <Target className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Nossa Missão</h3>
                        <p className="text-gray-600 leading-relaxed">
                            Facilitar negociações, oferecendo uma plataforma moderna, intuitiva e acessível, onde anunciantes têm visibilidade real e usuários encontram oportunidades confiáveis.
                        </p>
                    </div>

                    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
                        <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4 text-green-600">
                            <Shield className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Transparência</h3>
                        <p className="text-gray-600 leading-relaxed">
                            O Feirão da Orca não participa das negociações, mas atua como um ambiente de divulgação e conexão, prezando sempre pela transparência, segurança e respeito entre os usuários.
                        </p>
                    </div>
                </div>

                {/* Recursos */}
                <div className="bg-primary/5 rounded-3xl p-6 sm:p-8 border border-primary/10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                            <Zap className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Evolução Contínua</h3>
                    </div>

                    <p className="text-gray-700 mb-6">
                        Trabalhamos continuamente para evoluir a experiência do aplicativo, trazendo recursos como:
                    </p>

                    <div className="grid sm:grid-cols-2 gap-4">
                        {[
                            "Anúncios organizados por categoria",
                            "Destaques promocionais",
                            "Avaliação e moderação de anúncios",
                            "Ferramentas para facilitar o contato"
                        ].map((item, index) => (
                            <div key={index} className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100/50">
                                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                                <span className="font-medium text-gray-800">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Patrocinadores e Contato */}
                <div className="mt-6 bg-white rounded-3xl p-5 sm:p-8 shadow-sm border border-gray-100 text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Patrocínios e Contato</h3>
                    <p className="text-gray-600 mb-6 font-medium">Anuncie sua marca no maior portal de classificados do DF</p>
                    
                    <div className="flex flex-col gap-4 items-center">
                        <a 
                            href="https://wa.me/5561999992842" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-3 bg-green-500 text-white px-6 py-4 rounded-2xl font-bold hover:bg-green-600 transition-colors shadow-lg shadow-green-100 w-full max-w-sm"
                        >
                            <MessageCircle className="w-5 h-5 flex-shrink-0" />
                            <span>61 99999-2842</span>
                        </a>
                        
                        <a 
                            href="mailto:feiraodaorcadf@gmail.com" 
                            className="flex items-center justify-center gap-3 bg-primary text-white px-6 py-4 rounded-2xl font-bold hover:bg-primary-dark transition-colors shadow-lg shadow-blue-100 w-full max-w-sm"
                        >
                            <Mail className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm sm:text-base">feiraodaorcadf@gmail.com</span>
                        </a>
                    </div>
                </div>

            </div>
        </div>
    );
};
