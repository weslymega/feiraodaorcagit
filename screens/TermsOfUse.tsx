
import React from 'react';
import { Header } from '../components/Shared';
import { FileText, Shield, AlertTriangle, Scale } from 'lucide-react';

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
                            <h2 className="text-xl font-bold text-gray-900">Termos e Condições</h2>
                            <p className="text-sm text-gray-500">Última atualização: Janeiro 2026</p>
                        </div>
                    </div>
                    <p className="text-gray-600 leading-relaxed border-l-4 border-primary pl-4 bg-gray-50/50 py-3 rounded-r-lg">
                        Ao acessar ou utilizar o aplicativo Feirão da Orca, o usuário declara que leu, compreendeu e concorda com os termos abaixo.
                    </p>
                </div>

                {/* Content Sections */}
                <div className="space-y-6">

                    {/* 1. Objetivo */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs">1</span>
                            Objetivo da Plataforma
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                            O Feirão da Orca é uma plataforma de divulgação de anúncios, não sendo responsável por negociações, pagamentos, entregas ou garantias entre usuários.
                        </p>
                    </section>

                    {/* 2. Responsabilidade */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs">2</span>
                            Responsabilidade dos Usuários
                        </h3>
                        <div className="space-y-3 text-gray-600 leading-relaxed">
                            <p>O usuário é totalmente responsável pelas informações publicadas em seus anúncios.</p>
                            <ul className="list-disc pl-5 space-y-1 text-gray-500">
                                <li>É proibida a publicação de conteúdos falsos, ilegais, ofensivos ou que infrinjam direitos de terceiros.</li>
                                <li>O anunciante declara possuir autorização ou propriedade sobre o item anunciado.</li>
                            </ul>
                        </div>
                    </section>

                    {/* 3. Análise */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs">3</span>
                            Análise e Moderação
                        </h3>
                        <p className="text-gray-600 leading-relaxed mb-2">
                            Todos os anúncios podem passar por análise administrativa antes da publicação.
                        </p>
                        <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm flex gap-2 items-start">
                            <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            O Feirão da Orca se reserva o direito de recusar, suspender ou remover anúncios que violem estes termos, sem aviso prévio.
                        </div>
                    </section>

                    {/* 4. Anúncios Pagos */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs">4</span>
                            Anúncios Pagos e Destaques
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                            Anúncios pagos oferecem maior visibilidade, mas não garantem venda ou retorno financeiro. O período de exibição segue as regras definidas no momento da contratação.
                        </p>
                    </section>

                    {/* 5. Limitação */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs">5</span>
                            Limitação de Responsabilidade
                        </h3>
                        <p className="text-gray-600 mb-3">O Feirão da Orca não se responsabiliza por:</p>
                        <div className="grid sm:grid-cols-2 gap-3">
                            {['Golpes, fraudes ou prejuízos entre usuários', 'Qualidade, legalidade ou veracidade dos anúncios', 'Problemas decorrentes de negociações externas'].map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-2 rounded-lg">
                                    <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 6. Alterações */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs">6</span>
                            Alterações
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                            Os termos podem ser alterados a qualquer momento. O uso contínuo da plataforma implica aceitação das novas condições.
                        </p>
                    </section>

                    {/* 7. Reembolso (Novo) */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-red-50">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs">7</span>
                            Política de Reembolso / Cancelamento
                        </h3>
                        <div className="bg-red-50 text-red-800 p-4 rounded-xl text-sm leading-relaxed flex gap-3 items-start">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <p>
                                Após a ativação do destaque, <span className="font-bold">você não tem direito a reembolso ou cancelamento</span> do valor pago, mesmo que você decida não usar o destaque. Essa regra está prevista nos Termos e Condições Gerais de Uso do aplicativo Feirão da Orca!
                            </p>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
};
