
import React from 'react';
import { Header } from '../components/Shared';
import { Shield, Database, Layout, MapPin, Share2, Lock, Fingerprint, Trash2, RefreshCw, Mail, MessageCircle } from 'lucide-react';

interface PrivacyPolicyProps {
    onBack: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
    return (
        <div className="min-h-screen h-screen overflow-y-auto bg-gray-50 flex flex-col">
            <Header title="Política de Privacidade" onBack={onBack} />

            <div className="flex-1 px-4 pt-6 pb-32">

                {/* Intro */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-primary">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Política de Privacidade</h2>
                            <p className="text-sm text-gray-500">Última atualização: Março de 2026</p>
                        </div>
                    </div>
                    <p className="text-gray-600 leading-relaxed border-l-4 border-primary pl-4 bg-gray-50/50 py-3 rounded-r-lg text-sm">
                        Esta Política de Privacidade explica como coletamos, usamos e protegemos os dados dos usuários do aplicativo Feirão da Orca.
                    </p>
                </div>

                {/* Content Sections */}
                <div className="space-y-6">

                    {/* 2. Dados Coletados */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs">2</span>
                            Dados Coletados
                        </h3>
                        <p className="text-gray-600 mb-4 text-sm">Podemos coletar:</p>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { text: 'Nome', icon: <Database className="w-4 h-4 text-blue-500" /> },
                                { text: 'E-mail', icon: <Mail className="w-4 h-4 text-blue-500" /> },
                                { text: 'Anúncios', icon: <Layout className="w-4 h-4 text-blue-500" /> },
                                { text: 'Interações', icon: <RefreshCw className="w-4 h-4 text-blue-500" /> }
                            ].map((item, idx) => (
                                <div key={idx} className="bg-gray-50 p-3 rounded-xl flex items-center gap-3">
                                    {item.icon}
                                    <span className="text-sm font-medium text-gray-700">{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 3. Uso das Informações */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs">3</span>
                            Uso das Informações
                        </h3>
                        <div className="space-y-3">
                            {[
                                'Permitir o funcionamento do aplicativo',
                                'Exibir anúncios',
                                'Melhorar a experiência do usuário',
                                'Garantir segurança e prevenção de fraudes'
                            ].map((text, idx) => (
                                <div key={idx} className="flex items-center gap-3 text-sm text-gray-600">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                    {text}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 4. Estou na Feira Agora */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-green-50">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">4</span>
                            Funcionalidade “Estou na Feira Agora”
                        </h3>
                        <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                            O aplicativo oferece a funcionalidade “Estou na Feira Agora”, que permite ao usuário indicar sua presença em eventos físicos. Ao ativar essa função:
                        </p>
                        <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 space-y-3 mb-4">
                            {[
                                { text: 'O usuário fornece voluntariamente sua condição de presença', icon: <Fingerprint className="w-4 h-4" /> },
                                { text: 'A informação é exibida publicamente no anúncio', icon: <RefreshCw className="w-4 h-4" /> },
                                { text: 'O status é temporário e expira automaticamente', icon: <Lock className="w-4 h-4" /> },
                                { text: 'Não utilizamos geolocalização por GPS, salvo informado explicitamente', icon: <MapPin className="w-4 h-4" /> }
                            ].map((item, idx) => (
                                <div key={idx} className="flex gap-3 items-start">
                                    <div className="text-green-600 mt-1">{item.icon}</div>
                                    <span className="text-sm text-green-800 font-medium">{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 5. Compartilhamento */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs">5</span>
                            Compartilhamento de Dados
                        </h3>
                        <div className="flex gap-3 items-center p-3 bg-blue-50 rounded-xl text-blue-800 text-sm font-medium border border-blue-100">
                            <Share2 className="w-5 h-5 flex-shrink-0" />
                            Não vendemos dados pessoais.
                        </div>
                        <p className="mt-3 text-gray-600 text-sm">
                            As informações podem ser exibidas publicamente dentro do app conforme necessário para funcionamento (ex: anúncios).
                        </p>
                    </section>

                    {/* 7. Direitos do Usuário */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs">7</span>
                            Direitos do Usuário (LGPD)
                        </h3>
                        <p className="text-gray-600 text-sm mb-4">Nos termos da Lei Geral de Proteção de Dados, o usuário pode:</p>
                        <div className="flex flex-wrap gap-2">
                            {['Solicitar acesso aos dados', 'Corrigir informações', 'Solicitar exclusão da conta'].map((tag, idx) => (
                                <span key={idx} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </section>

                    {/* 8. Exclusão de Dados */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs">8</span>
                            Exclusão de Dados
                        </h3>
                        <div className="flex gap-3 items-center text-gray-600 text-sm">
                            <Trash2 className="w-5 h-5 text-red-400" />
                            <p>A exclusão da conta remove os dados associados, salvo obrigações legais.</p>
                        </div>
                    </section>

                    {/* 10. Contato */}
                    <section className="bg-gray-900 rounded-3xl p-8 text-center text-white">
                        <h3 className="text-xl font-bold mb-2">Canal de Contato</h3>
                        <p className="text-gray-400 text-[13px] mb-8">Dúvidas sobre sua Privacidade?</p>
                        
                        <div className="flex flex-col gap-4">
                            <a 
                                href="mailto:feiraodaorcadf@gmail.com" 
                                className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 px-6 py-4 rounded-2xl font-bold transition-all border border-white/10 active:scale-[0.98]"
                            >
                                <Mail className="w-5 h-5 text-accent" />
                                <span className="text-[14px]">feiraodaorcadf@gmail.com</span>
                            </a>
                            
                            <a 
                                href="https://wa.me/5561999992842"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 px-6 py-4 rounded-2xl font-bold transition-all border border-[#25D366]/20 active:scale-[0.98] text-[#25D366]"
                            >
                                <MessageCircle className="w-5 h-5" />
                                <span className="text-[14px]">(61) 99999-2842</span>
                            </a>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
};
