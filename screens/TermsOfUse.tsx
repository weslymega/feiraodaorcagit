
import React from 'react';
import { Header } from '../components/Shared';
import { FileText, Shield, AlertTriangle, MapPin, Users, Ban, Trash2, Mail, MessageCircle, Clock, QrCode, MessageSquare, Flag, ExternalLink } from 'lucide-react';
import { openWhatsApp } from '../utils/mobileActions';
import { openExternalLink } from '../utils/openExternalLink';

interface TermsOfUseProps {
    onBack: () => void;
}

export const TermsOfUse: React.FC<TermsOfUseProps> = ({ onBack }) => {
    return (
        <div className="min-h-screen h-screen overflow-y-auto bg-gray-50 flex flex-col">
            <Header title="Termos de Uso" onBack={onBack} />

            <div className="flex-1 px-4 pt-6 pb-32">

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

                    {/* 1. Aceitação - Included in Intro but could be explicit if needed */}

                    {/* 2. Sobre o Aplicativo */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold">2</span>
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
                            A plataforma atua exclusivamente como intermediadora, não participando diretamente das negociações entre usuários.
                        </div>
                    </section>

                    {/* 3. Cadastro e Responsabilidade */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold">3</span>
                            Cadastro e Responsabilidade do Usuário
                        </h3>
                        <p className="text-gray-600 mb-3">O usuário é responsável por:</p>
                        <ul className="space-y-2 mb-4">
                            {['Fornecer informações verdadeiras e atualizadas', 'Manter a segurança de sua conta', 'Não compartilhar seus dados de acesso'].map((item, idx) => (
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
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold">4</span>
                            Publicação de Anúncios
                        </h3>
                        <p className="text-gray-600 mb-3">Ao publicar um anúncio, o usuário declara que:</p>
                        <ul className="space-y-2 mb-4">
                            {['Possui direito sobre o item anunciado', 'As informações são verídicas', 'O conteúdo não viola leis ou direitos de terceiros'].map((item, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                                    <div className="w-1 h-1 rounded-full bg-blue-400" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <p className="text-sm text-gray-600 italic">
                            O usuário é integralmente responsável pelo conteúdo publicado.
                        </p>
                    </section>

                    {/* 5. Estou na Feira Agora */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-green-50">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">5</span>
                            Funcionalidade “Estou na Feira Agora”
                        </h3>
                        <p className="text-gray-600 mb-4 text-sm">
                            O aplicativo oferece a funcionalidade “Estou na Feira Agora”, que permite ao usuário indicar sua presença em eventos físicos. Ao utilizar essa função, o usuário declara que:
                        </p>
                        <div className="space-y-3 mb-4">
                            {[
                                { text: 'Está fisicamente presente no local do evento', icon: <MapPin className="w-4 h-4" /> },
                                { text: 'A informação poderá ser exibida publicamente no anúncio', icon: <Users className="w-4 h-4" /> },
                                { text: 'O status é temporário (ex: até 6 horas)', icon: <Clock className="w-4 h-4" /> }
                            ].map((item, idx) => (
                                <div key={idx} className="flex gap-3 items-center bg-green-50/50 p-3 rounded-xl border border-green-100">
                                    <div className="text-green-600">{item.icon}</div>
                                    <span className="text-sm text-green-800 font-medium">{item.text}</span>
                                </div>
                            ))}
                        </div>
                        <div className="bg-red-50 text-red-800 p-3 rounded-lg text-xs mb-3 flex gap-2 items-center">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            O uso indevido pode resultar em penalidades.
                        </div>
                        <p className="text-xs text-gray-500 italic">
                            O Feirão da Orca não garante a presença contínua do usuário nem a disponibilidade do item no local.
                        </p>
                    </section>

                    {/* 6. QR Code */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold">6</span>
                            QR Code dos Anúncios
                        </h3>
                        <div className="flex items-start gap-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                            <QrCode className="w-5 h-5 text-blue-600 mt-1" />
                            <div>
                                <p className="text-sm text-blue-900 leading-relaxed">
                                    O aplicativo permite a geração de QR Codes vinculados aos anúncios, facilitando o acesso às informações.
                                </p>
                                <p className="text-xs text-blue-800 mt-2 font-medium">
                                    O uso dessa funcionalidade é de responsabilidade do usuário, não garantindo a concretização de negociações.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* 7. Chat */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold">7</span>
                            Interação entre Usuários (Chat)
                        </h3>
                        <p className="text-gray-600 text-sm mb-3">O aplicativo pode disponibilizar ferramentas de comunicação entre usuários, como chat.</p>
                        <p className="text-gray-600 text-sm mb-3">O Feirão da Orca não se responsabiliza pelo conteúdo das mensagens trocadas, podendo aplicar medidas como:</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {['Advertência', 'Bloqueio', 'Suspensão', 'Exclusão de conta'].map(tag => (
                                <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500">em caso de violação destes Termos.</p>
                    </section>

                    {/* 8. Denúncia */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold">8</span>
                            Denúncia de Conteúdo
                        </h3>
                        <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                            <Flag className="w-5 h-5 text-red-500" />
                            <p className="text-sm text-red-900">
                                Os usuários podem denunciar conteúdos ou outros usuários que violem estes Termos.
                            </p>
                        </div>
                        <p className="text-xs text-gray-500 mt-3">
                            O Feirão da Orca poderá analisar e tomar as medidas cabíveis, sem obrigação de remoção imediata.
                        </p>
                    </section>

                    {/* 9. Negociações */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold">9</span>
                            Negociações entre Usuários
                        </h3>
                        <p className="text-gray-600 mb-3 text-sm">O Feirão da Orca não participa das transações realizadas entre usuários e não se responsabiliza por:</p>
                        <div className="grid grid-cols-2 gap-2">
                            {['Pagamentos', 'Entregas', 'Qualidade dos produtos/serviços', 'Acordos externos'].map((item) => (
                                <div key={item} className="bg-orange-50 p-2 rounded-lg text-xs font-bold text-orange-700 border border-orange-100">
                                    ⚠️ {item}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 10. Conduta */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold">10</span>
                            Conteúdo e Conduta
                        </h3>
                        <p className="text-gray-600 text-sm mb-2">É proibido:</p>
                        <ul className="space-y-2">
                            {['Publicar conteúdo ilegal, enganoso ou fraudulento', 'Utilizar o app para golpes ou atividades ilícitas', 'Praticar qualquer comportamento abusivo'].map((item, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                                    <div className="w-1 h-1 rounded-full bg-red-400" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* 11. Exclusão de Conta */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold">11</span>
                            Exclusão de Conta
                        </h3>
                        <p className="text-gray-600 text-sm mb-4">O usuário pode solicitar a exclusão da conta a qualquer momento:</p>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                Pelo aplicativo
                            </div>
                            <button 
                                onClick={() => openExternalLink('https://feiraodaorca.com/excluir-conta')}
                                className="w-full flex items-center justify-between bg-gray-50 hover:bg-gray-100 p-4 rounded-xl border border-gray-200 transition-all"
                            >
                                <span className="text-sm font-bold text-gray-800">Pela página de exclusão</span>
                                <ExternalLink className="w-4 h-4 text-primary" />
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-4 italic">
                            O Feirão da Orca também poderá suspender ou excluir contas que violem estes Termos.
                        </p>
                    </section>

                    {/* 12. Limitação de Responsabilidade */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold">12</span>
                            Limitação de Responsabilidade
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            O aplicativo é fornecido “como está”, sem garantias de funcionamento contínuo, disponibilidade ou ausência de erros.
                        </p>
                    </section>

                    {/* 13. Alterações */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold">13</span>
                            Alterações dos Termos
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Estes Termos podem ser atualizados a qualquer momento. O uso contínuo do aplicativo implica concordância com as alterações.
                        </p>
                    </section>

                    {/* Footer / Contato */}
                    <section className="bg-gray-900 rounded-3xl p-8 text-center text-white">
                        <h3 className="text-xl font-bold mb-2">Canal de Contato</h3>
                        <p className="text-gray-400 text-[13px] mb-8">Dúvidas sobre estes Termos de Uso?</p>
                        
                        <div className="flex flex-col gap-4">
                            <a 
                                href="mailto:feiraodaorcadf@gmail.com" 
                                className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 px-6 py-4 rounded-2xl font-bold transition-all border border-white/10 active:scale-[0.98]"
                            >
                                <Mail className="w-5 h-5 text-accent" />
                                <span className="text-[14px]">feiraodaorcadf@gmail.com</span>
                            </a>
                            
                            <button 
                                onClick={() => openWhatsApp('5561999992842')}
                                className="w-full flex items-center justify-center gap-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 px-6 py-4 rounded-2xl font-bold transition-all border border-[#25D366]/20 active:scale-[0.98] text-[#25D366]"
                            >
                                <MessageCircle className="w-5 h-5" />
                                <span className="text-[14px]">(61) 99999-2842</span>
                            </button>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
};
