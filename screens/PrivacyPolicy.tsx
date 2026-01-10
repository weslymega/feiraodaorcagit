
import React from 'react';
import { Header } from '../components/Shared';
import { Shield, Eye, Database, Lock, UserCheck, Cookie } from 'lucide-react';

interface PrivacyPolicyProps {
    onBack: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <Header title="Política de Privacidade" onBack={onBack} />

            <div className="max-w-4xl mx-auto px-4 pt-6">

                {/* Intro */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-primary">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Política de Privacidade</h2>
                            <p className="text-sm text-gray-500">Conformidade com a LGPD</p>
                        </div>
                    </div>
                    <p className="text-gray-600 leading-relaxed border-l-4 border-primary pl-4 bg-gray-50/50 py-3 rounded-r-lg">
                        O Feirão da Orca respeita a privacidade dos seus usuários e se compromete a proteger os dados coletados, em conformidade com a legislação vigente (LGPD).
                    </p>
                </div>

                {/* Content Sections */}
                <div className="space-y-6">

                    {/* 1. Dados Coletados */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs">1</span>
                            Dados Coletados
                        </h3>
                        <p className="text-gray-600 mb-3">Podemos coletar:</p>
                        <div className="grid sm:grid-cols-2 gap-3">
                            {[
                                "Nome, e-mail e dados básicos de cadastro",
                                "Informações fornecidas nos anúncios",
                                "Dados de uso do aplicativo"
                            ].map((item, index) => (
                                <div key={index} className="flex items-center gap-2 bg-blue-50/50 p-3 rounded-lg text-sm text-gray-700">
                                    <Database className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 2. Uso das Informações */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs">2</span>
                            Uso das Informações
                        </h3>
                        <p className="text-gray-600 mb-3">Os dados são utilizados para:</p>
                        <ul className="grid sm:grid-cols-2 gap-2 text-gray-600 text-sm">
                            {['Funcionamento da plataforma', 'Publicação e gerenciamento de anúncios', 'Comunicação com o usuário', 'Melhoria da experiência e segurança'].map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* 3. Compartilhamento */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs">3</span>
                            Compartilhamento de Dados
                        </h3>
                        <div className="space-y-3">
                            <div className="flex gap-3 items-start p-3 bg-red-50 rounded-lg text-red-800 text-sm">
                                <Lock className="w-4 h-4 mt-0.5" />
                                Não vendemos ou compartilhamos dados pessoais com terceiros, exceto quando exigido por lei.
                            </div>
                            <div className="flex gap-3 items-start p-3 bg-yellow-50 rounded-lg text-yellow-800 text-sm">
                                <Eye className="w-4 h-4 mt-0.5" />
                                Informações públicas do anúncio ficam visíveis aos demais usuários.
                            </div>
                        </div>
                    </section>

                    {/* 4. Armazenamento */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs">4</span>
                            Armazenamento e Segurança
                        </h3>
                        <p className="text-gray-600 leading-relaxed text-sm">
                            Adotamos medidas técnicas e organizacionais para proteger os dados contra acessos não autorizados, perdas ou alterações.
                        </p>
                    </section>

                    {/* 5. Direitos do Usuário */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs">5</span>
                            Direitos do Usuário
                        </h3>
                        <p className="text-gray-600 mb-3 text-sm">O usuário pode:</p>
                        <div className="flex flex-wrap gap-2">
                            {['Solicitar correção ou exclusão', 'Encerrar conta a qualquer momento', 'Informações sobre uso de dados'].map((tag, idx) => (
                                <span key={idx} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium border border-gray-200">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </section>

                    {/* 6. Cookies */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs">6</span>
                            Cookies e Tecnologias
                        </h3>
                        <div className="flex items-center gap-3 text-gray-600 text-sm">
                            <Cookie className="w-5 h-5 text-orange-400" />
                            O aplicativo pode utilizar tecnologias similares para melhorar desempenho e usabilidade.
                        </div>
                    </section>

                    <div className="text-center text-xs text-gray-400 pt-4 pb-8">
                        Ao utilizar o Feirão da Orca, você concorda com esta Política de Privacidade e os Termos de Uso.
                    </div>

                </div>
            </div>
        </div>
    );
};
