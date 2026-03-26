
import React from 'react';
import { Header } from '../components/Shared';
import { FileText, Shield, AlertTriangle, MapPin, Users, Ban, Trash2, Mail, MessageCircle } from 'lucide-react';

interface TermsOfUseProps {
    onBack: () => void;
}

export const TermsOfUse: React.FC<TermsOfUseProps> = ({ onBack }) => {
    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <Header title="Termos de Uso" onBack={onBack} />

            <div className="max-w-4xl mx-auto px-4 pt-6">

                {/* Intro */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-primary">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Termos de Uso – Feirão da Orca</h2>
                            <p className="text-sm text-gray-500">Última atualização: Março de 2026</p>
                        </div>
                    </div>
                    <p className="text-gray-600 leading-relaxed border-l-4 border-primary pl-4 bg-gray-50/50 py-3 rounded-r-lg text-sm">
                        Ao utilizar o aplicativo Feirão da Orca, o usuário declara que leu, compreendeu e concorda com estes Termos de Uso e com a Política de Privacidade.
                    </p>
                </div>

                {/* Content Sections */}
                <div className="space-y-6">

                    {/* 2. Sobre o Aplicativo */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs">2</span>
                            Sobre o Aplicativo
                        </h3>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            O Feirão da Orca é uma plataforma digital que permite a publicação e visualização de anúncios nas seguintes categorias:
                        </p>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            {['Veículos', 'Imóveis', 'Peças', 'Serviços'].map((item) => (
                                <div key={item} className="bg-gray-50 p-2 rounded-lg text-sm text-gray-700 font-medium flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    {item}
                                </div>
                            ))}
                        </div>
                        <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm flex gap-2 items-start">
                            <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            A plataforma atua apenas como intermediadora, não participando diretamente das negociações.
                        </div>
                    </section>

                    {/* 3. Cadastro e Responsabilidade */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs">3</span>
                            Cadastro e Responsabilidade do Usuário
                        </h3>
                        <p className="text-gray-600 mb-3">O usuário é responsável por:</p>
                        <ul className="space-y-2 mb-4">
                            {['Fornecer informações verdadeiras', 'Manter a segurança de sua conta', 'Atualizar seus dados quando necessário'].map((item, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                                    <div className="w-1 h-1 rounded-full bg-gray-400" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <p className="text-xs text-red-500 font-bold bg-red-50 p-2 rounded-lg">
                            O uso de informações falsas poderá resultar em suspensão ou exclusão da conta.
                        </p>
                    </section>

                    {/* 4. Publicação de Anúncios */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs">4</span>
                            Publicação de Anúncios
                        </h3>
                        <p className="text-gray-600 mb-3">Ao publicar um anúncio, o usuário declara que:</p>
                        <ul className="space-y-2">
                            {['Possui direito sobre o item anunciado', 'As informações são verídicas', 'O conteúdo não viola leis ou direitos de terceiros'].map((item, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                                    <div className="w-1 h-1 rounded-full bg-blue-400" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* 5. Estou na Feira Agora */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-green-50">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">5</span>
                            Funcionalidade “Estou na Feira Agora”
                        </h3>
                        <p className="text-gray-600 mb-4">
                            O aplicativo oferece a funcionalidade “Estou na Feira Agora”, que permite ao usuário indicar sua presença em eventos físicos. Ao utilizar esta função, o usuário concorda que:
                        </p>
                        <div className="space-y-3 mb-4">
                            {[
                                { text: 'Está fisicamente presente no local do evento', icon: <MapPin className="w-4 h-4" /> },
                                { text: 'A informação será exibida publicamente no anúncio', icon: <Users className="w-4 h-4" /> },
                                { text: 'O status tem duração temporária (ex: 6 horas)', icon: <AlertTriangle className="w-4 h-4" /> },
                                { text: 'O uso indevido pode resultar em penalidades', icon: <Ban className="w-4 h-4" /> }
                            ].map((item, idx) => (
                                <div key={idx} className="flex gap-3 items-center bg-green-50/50 p-3 rounded-xl border border-green-100">
                                    <div className="text-green-600">{item.icon}</div>
                                    <span className="text-sm text-green-800 font-medium">{item.text}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 italic">
                            O Feirão da Orca não garante a presença contínua do usuário nem a disponibilidade do item no local.
                        </p>
                    </section>

                    {/* 6. Negociações */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs">6</span>
                            Negociações entre Usuários
                        </h3>
                        <p className="text-gray-600 mb-3">O Feirão da Orca não participa das transações realizadas entre usuários e não se responsabiliza por:</p>
                        <div className="grid grid-cols-2 gap-2">
                            {['Pagamentos', 'Entregas', 'Qualidade', 'Acordos externos'].map((item) => (
                                <div key={item} className="bg-red-50/50 p-2 rounded-lg text-xs font-bold text-red-700 border border-red-100">
                                    ⚠️ {item}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 7. Conduta */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs">7</span>
                            Conteúdo e Conduta
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            É proibido: Publicar conteúdo ilegal ou enganoso, utilizar o app para fraudes ou praticar qualquer atividade abusiva.
                        </p>
                    </section>

                    {/* 8. Exclusão de Conta */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs">8</span>
                            Exclusão de Conta
                        </h3>
                        <div className="flex gap-3 items-center text-gray-600 text-sm">
                            <Trash2 className="w-5 h-5 text-gray-400" />
                            <p>O usuário pode excluir sua conta a qualquer momento pelo aplicativo. O Feirão da Orca também pode suspender ou excluir contas que violem estes termos.</p>
                        </div>
                    </section>

                    {/* 11. Contato */}
                    <section className="bg-gray-900 rounded-3xl p-8 text-center text-white">
                        <h3 className="text-xl font-bold mb-4">Contato</h3>
                        <p className="text-gray-400 text-sm mb-6">Dúvidas sobre estes Termos de Uso?</p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                            <a 
                                href="mailto:feiraodaorcadf@gmail.com" 
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-2xl font-bold transition-colors border border-white/10"
                            >
                                <Mail className="w-5 h-5" />
                                feiraodaorcadf@gmail.com
                            </a>
                            <a 
                                href="https://wa.me/5561983227344"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] px-6 py-3 rounded-2xl font-bold transition-colors shadow-lg shadow-green-500/20"
                            >
                                <MessageCircle className="w-5 h-5" />
                                (61) 98322-7344
                            </a>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
};
