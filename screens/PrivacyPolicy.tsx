
import React from 'react';
import { Header } from '../components/Shared';
import { Shield, Database, Layout, MapPin, Share2, Lock, Fingerprint, Trash2, RefreshCw, Mail, MessageCircle, Info, ExternalLink, CheckCircle2 } from 'lucide-react';
import { openWhatsApp } from '../utils/mobileActions';
import { openExternalLink } from '../utils/openExternalLink';

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
                        Esta Política de Privacidade descreve como coletamos, utilizamos e protegemos os dados dos usuários do aplicativo Feirão da Orca, em conformidade com a legislação aplicável, incluindo a LGPD.
                    </p>
                </div>

                {/* Content Sections */}
                <div className="space-y-6">

                    {/* 2. Dados Coletados */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold">2</span>
                            Dados Coletados
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Database className="w-3 h-3" /> Informações Pessoais
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {['Nome', 'E-mail', 'Telefone', 'Localização (CEP)'].map((tag) => (
                                        <span key={tag} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-[11px] font-bold border border-blue-100">{tag}</span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Fingerprint className="w-3 h-3" /> Identificadores Técnicos
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {['Device IDs', 'Session IDs', 'Advertising IDs'].map((tag) => (
                                        <span key={tag} className="bg-gray-50 text-gray-700 px-3 py-1 rounded-lg text-[11px] font-bold border border-gray-200">{tag}</span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Layout className="w-3 h-3" /> Conteúdo e Uso
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {['Fotos', 'Descrições', 'Interações', 'Diagnósticos'].map((tag) => (
                                        <span key={tag} className="bg-green-50 text-green-700 px-3 py-1 rounded-lg text-[11px] font-bold border border-green-100">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 3. Uso das Informações */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold">3</span>
                            Uso das Informações
                        </h3>
                        <div className="space-y-3">
                            {[
                                'Autenticação e gerenciamento de contas',
                                'Exibição e gerenciamento de anúncios',
                                'Comunicação entre usuários',
                                'Melhoria da experiência do app',
                                'Segurança e prevenção de fraudes',
                                'Exibição de anúncios via AdMob'
                            ].map((text, idx) => (
                                <div key={idx} className="flex items-start gap-3 text-sm text-gray-600 bg-gray-50/50 p-2 rounded-lg">
                                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                    <span>{text}</span>
                                </div>
                            ))}
                        </div>
                        <p className="mt-4 text-xs text-gray-500 italic">
                            O tratamento é baseado no consentimento e na execução dos serviços.
                        </p>
                    </section>

                    {/* 4. Estou na Feira Agora */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-green-50">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">4</span>
                            Funcionalidade “Estou na Feira Agora”
                        </h3>
                        <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                            Ao ativar essa função, o usuário declara e concorda que:
                        </p>
                        <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 space-y-4 mb-4">
                            <div className="flex gap-3 items-start">
                                <Fingerprint className="w-4 h-4 text-green-600 mt-1" />
                                <span className="text-sm text-green-800 font-medium">O usuário informa voluntariamente sua presença em um evento</span>
                            </div>
                            <div className="flex gap-3 items-start">
                                <RefreshCw className="w-4 h-4 text-green-600 mt-1" />
                                <span className="text-sm text-green-800 font-medium">A informação pode ser exibida publicamente no anúncio</span>
                            </div>
                            <div className="flex gap-3 items-start">
                                <Lock className="w-4 h-4 text-green-600 mt-1" />
                                <span className="text-sm text-green-800 font-medium">O status é temporário</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                            <Info className="w-4 h-4 text-blue-500 shrink-0" />
                            <p className="text-xs text-blue-800 font-bold">
                                O app não coleta geolocalização em tempo real em segundo plano.
                            </p>
                        </div>
                    </section>

                    {/* 5. Compartilhamento */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold">5</span>
                            Compartilhamento de Dados
                        </h3>
                        <p className="text-gray-600 text-sm mb-4 leading-relaxed font-bold">
                            Não vendemos dados pessoais.
                        </p>
                        <p className="text-gray-500 text-xs mb-4 leading-relaxed">
                            Compartilhamos apenas com serviços essenciais para o funcionamento:
                        </p>
                        <div className="space-y-3">
                            <div className="flex flex-col gap-1 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <span className="text-sm font-bold text-gray-800">Google AdMob</span>
                                <span className="text-[11px] text-gray-500">Exibição de anúncios e medição de desempenho.</span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <span className="text-sm font-bold text-gray-800">Supabase</span>
                                <span className="text-[11px] text-gray-500">Autenticação segura e armazenamento de banco de dados.</span>
                            </div>
                        </div>
                    </section>

                    {/* 6. Armazenamento */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold">6</span>
                            Armazenamento e Segurança
                        </h3>
                        <div className="flex gap-3 items-center p-4 bg-blue-50 rounded-2xl border border-blue-100">
                            <Lock className="w-5 h-5 text-blue-600" />
                            <p className="text-sm text-blue-900 leading-relaxed font-medium">
                                Os dados são armazenados em ambientes seguros com criptografia e boas práticas de proteção.
                            </p>
                        </div>
                    </section>

                    {/* 7. Direitos do Usuário */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold">7</span>
                            Direitos do Usuário (LGPD)
                        </h3>
                        <p className="text-gray-600 text-sm mb-4">O usuário pode:</p>
                        <div className="grid grid-cols-2 gap-2">
                            {['Acessar dados', 'Corrigir informações', 'Solicitar exclusão', 'Revogar consentimento'].map((item, idx) => (
                                <div key={idx} className="bg-gray-50 p-2 rounded-lg text-xs font-bold text-gray-700 border border-gray-100 flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-primary" />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 8. Exclusão de Dados */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold">8</span>
                            Exclusão de Dados
                        </h3>
                        <p className="text-gray-600 text-sm mb-4">O usuário pode solicitar a exclusão da conta e dos dados:</p>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-gray-700 font-medium p-2 bg-gray-50 rounded-lg">
                                <Trash2 className="w-4 h-4 text-red-500" />
                                Pelo aplicativo
                            </div>
                            <button 
                                onClick={() => openExternalLink('https://feiraodaorca.com/excluir-conta')}
                                className="w-full flex items-center justify-between bg-red-50 hover:bg-red-100 p-4 rounded-xl border border-red-100 transition-all group"
                            >
                                <span className="text-sm font-bold text-red-900">Pela página de exclusão</span>
                                <ExternalLink className="w-4 h-4 text-red-600 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-4 italic">
                            Alguns dados podem ser mantidos por obrigações legais.
                        </p>
                    </section>

                    {/* 9. Alterações */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold">9</span>
                            Alterações na Política
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Esta política pode ser atualizada a qualquer momento. O uso contínuo do app indica concordância.
                        </p>
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
