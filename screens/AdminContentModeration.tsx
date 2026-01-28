
import React, { useState } from 'react';
import {
    ChevronLeft, ShieldAlert, CheckCircle, XCircle,
    User as UserIcon, MessageSquare, Flag, Trash2, Eye, X, FileText, DollarSign, Tag, AlertTriangle
} from 'lucide-react';
import { ReportItem, AdItem, AdStatus } from '../types';

interface AdminContentModerationProps {
    onBack: () => void;
    onBlockUser: (userId: string, userName: string) => void;
    onDeleteAd: (adId: string, adTitle: string) => void;
    reports: ReportItem[];
    onUpdateReport?: (reportId: string, action: 'resolved' | 'dismissed') => void;
    onDeleteReport?: (reportId: string) => void;
    onViewProfile?: (userId: string) => void;
    ads?: AdItem[]; // Lista de todos os anúncios para busca
    onSaveAd?: (updatedAd: AdItem) => void;
}

export const AdminContentModeration: React.FC<AdminContentModerationProps> = ({
    onBack, onBlockUser, onDeleteAd, reports, onUpdateReport, onDeleteReport, onViewProfile, ads = []
}) => {
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
    const [viewingReport, setViewingReport] = useState<ReportItem | null>(null);
    const [viewingAd, setViewingAd] = useState<AdItem | null>(null);

    const handleAction = (report: ReportItem, action: 'dismiss' | 'ban' | 'delete' | 'delete_report') => {
        if (action === 'dismiss') {
            // Ação imediata para melhor fluxo de trabalho
            if (onUpdateReport) onUpdateReport(report.id, 'dismissed');
        } else if (action === 'ban') {
            if (!confirm(`Tem certeza que deseja BANIR o usuário "${report.targetName}"? Ele perderá o acesso à conta.`)) return;
            onBlockUser(report.targetId, report.targetName);
            if (onUpdateReport) onUpdateReport(report.id, 'resolved');
        } else if (action === 'delete') {
            if (!confirm(`Tem certeza que deseja EXCLUIR o anúncio "${report.targetName}"?`)) return;
            onDeleteAd(report.targetId, report.targetName);
            if (onUpdateReport) onUpdateReport(report.id, 'resolved');
        } else if (action === 'delete_report') {
            if (onDeleteReport) onDeleteReport(report.id);
        }
    };

    const openViewModal = (report: ReportItem) => {
        if (report.targetType === 'ad') {
            // Tenta encontrar o anúncio na lista completa
            const ad = ads.find(a => a.id === report.targetId);

            if (ad) {
                setViewingAd(ad);
            } else {
                // FALLBACK: Se não encontrar o anúncio (ex: erro de ID ou não carregado), 
                // cria um objeto visual provisório com os dados da denúncia para não falhar a abertura.
                setViewingAd({
                    id: report.targetId,
                    title: report.targetName,
                    price: 0,
                    location: 'Localização desconhecida',
                    image: report.targetImage || 'https://placehold.co/400?text=Imagem+Nao+Disponivel',
                    status: AdStatus.INACTIVE,
                    description: 'Dados detalhados do anúncio não encontrados no cache atual. Baseando-se nas informações da denúncia.',
                    category: 'autos'
                });
            }
            setViewingReport(report);
        } else {
            alert('Visualização de perfil de usuário não suportada nesta tela.');
        }
    };

    const closeViewModal = () => {
        setViewingAd(null);
        setViewingReport(null);
    };

    const filteredReports = reports.filter(rep => {
        if (activeTab === 'pending') return rep.status === 'pending';
        return rep.status !== 'pending';
    });

    return (
        <div className="min-h-screen bg-gray-50 pb-20 animate-in slide-in-from-right duration-300">

            {/* Header */}
            <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3 shadow-sm">
                <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                    <ChevronLeft className="w-6 h-6 text-gray-700" />
                </button>
                <h1 className="text-xl font-bold text-gray-900">Moderação de Conteúdo</h1>
            </div>

            <div className="p-4">

                {/* Tabs */}
                <div className="flex bg-white p-1 rounded-xl border border-gray-200 mb-6">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'pending' ? 'bg-red-50 text-red-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        Pendentes ({reports.filter(r => r.status === 'pending').length})
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'history' ? 'bg-gray-100 text-gray-800 shadow-sm' : 'text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        Histórico
                    </button>
                </div>

                {/* List */}
                <div className="flex flex-col gap-4">
                    {filteredReports.length === 0 && (
                        <div className="text-center py-12 text-gray-400">
                            <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Nenhuma denúncia encontrada.</p>
                        </div>
                    )}

                    {filteredReports.map(report => (
                        <div key={report.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* Header Card */}
                            <div className="p-4 border-b border-gray-50 flex justify-between items-start bg-gray-50/50">
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${report.severity === 'high' ? 'bg-red-100 text-red-700' :
                                        report.severity === 'medium' ? 'bg-orange-100 text-orange-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {report.severity === 'high' ? 'Alta Prioridade' : report.severity === 'medium' ? 'Média' : 'Baixa'}
                                    </span>
                                    <span className="text-xs text-gray-400 font-medium">{report.date}</span>
                                </div>
                                <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                                    <Flag className="w-3 h-3" /> {report.reason}
                                </span>
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <div className="flex gap-4 mb-4">
                                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                                        {report.targetImage ? (
                                            <img src={report.targetImage} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <UserIcon className="w-8 h-8" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-bold uppercase mb-0.5">
                                            Denúncia contra {report.targetType === 'ad' ? 'Anúncio' : 'Usuário'}
                                        </p>
                                        <h3 className="font-bold text-gray-900 text-base leading-tight mb-1">
                                            {report.targetName}
                                        </h3>
                                        <p className="text-xs text-gray-500">ID Alvo: {report.targetId}</p>
                                    </div>
                                </div>

                                <div className="bg-red-50 p-3 rounded-xl border border-red-100 mb-4">
                                    <p className="text-xs font-bold text-red-800 mb-1 flex items-center gap-1">
                                        <MessageSquare className="w-3 h-3" /> Motivo do Reporte:
                                    </p>
                                    <p className="text-sm text-red-900 italic">"{report.description}"</p>
                                    <p className="text-[10px] text-red-400 mt-2 text-right">Reportado por: {report.reporterName}</p>
                                </div>

                                {/* Actions */}
                                {report.status === 'pending' && (
                                    <div className="grid grid-cols-2 gap-2">
                                        {/* Botão Ver Anúncio - Full Width no Topo */}
                                        {report.targetType === 'ad' && (
                                            <button
                                                onClick={() => openViewModal(report)}
                                                className="col-span-2 py-3 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center gap-2 mb-1"
                                            >
                                                <Eye className="w-4 h-4" /> Ver Anúncio
                                            </button>
                                        )}

                                        {report.reportedUserId && (
                                            <button
                                                onClick={() => onViewProfile && onViewProfile(report.reportedUserId!)}
                                                className="col-span-2 py-3 bg-indigo-600 text-white font-bold text-xs rounded-lg hover:bg-indigo-700 transition-colors shadow-md flex items-center justify-center gap-2 mb-1"
                                            >
                                                <UserIcon className="w-4 h-4" /> Ver Perfil do Denunciado
                                            </button>
                                        )}

                                        <button
                                            onClick={() => handleAction(report, 'dismiss')}
                                            className="py-2.5 bg-gray-100 text-gray-600 font-bold text-xs rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle className="w-4 h-4" /> Ignorar
                                        </button>

                                        {report.targetType === 'ad' ? (
                                            <button
                                                onClick={() => handleAction(report, 'delete')}
                                                className="py-2.5 bg-red-50 text-red-600 font-bold text-xs rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Trash2 className="w-4 h-4" /> Excluir
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleAction(report, 'ban')}
                                                className="py-2.5 bg-red-600 text-white font-bold text-xs rounded-lg hover:bg-red-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                                            >
                                                <XCircle className="w-4 h-4" /> Banir
                                            </button>
                                        )}
                                    </div>
                                )}

                                {report.status !== 'pending' && (
                                    <div className="flex flex-col gap-2">
                                        <div className="text-center py-2 bg-gray-50 rounded-lg text-xs font-bold text-gray-500 uppercase tracking-wide">
                                            {report.status === 'resolved' ? 'Ação Tomada (Resolvido)' : 'Denúncia Ignorada'}
                                        </div>
                                        <button
                                            onClick={() => handleAction(report, 'delete_report')}
                                            className="py-2 text-red-400 hover:text-red-600 font-bold text-[10px] uppercase flex items-center justify-center gap-1 transition-colors"
                                        >
                                            <Trash2 className="w-3 h-3" /> Excluir Registro da Denúncia
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* MODAL DE VISUALIZAÇÃO (READ ONLY) */}
                {viewingAd && viewingReport && (
                    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in" onClick={closeViewModal}></div>
                        <div className="bg-gray-100 w-full max-w-lg h-[90vh] sm:h-auto sm:max-h-[90vh] sm:rounded-2xl rounded-t-[30px] shadow-2xl relative animate-in slide-in-from-bottom flex flex-col overflow-hidden">

                            {/* Header: Contexto da Denúncia */}
                            <div className="bg-red-600 text-white p-6 pb-8 relative shrink-0">
                                <button onClick={closeViewModal} className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/30 text-white">
                                    <X className="w-5 h-5" />
                                </button>
                                <h3 className="font-bold text-lg flex items-center gap-2 mb-2">
                                    <ShieldAlert className="w-6 h-6" /> Detalhes da Denúncia
                                </h3>
                                <div className="bg-white/10 rounded-xl p-3 border border-white/20">
                                    <p className="text-xs font-bold uppercase opacity-80 mb-1">Motivo: {viewingReport.reason}</p>
                                    <p className="text-sm italic">"{viewingReport.description}"</p>
                                </div>
                            </div>

                            {/* Corpo: Visualização do Anúncio */}
                            <div className="flex-1 bg-white -mt-4 rounded-t-[30px] p-6 overflow-y-auto space-y-6">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-lg">Visualizar Anúncio</h4>
                                        <p className="text-xs text-gray-500">Análise de Moderação</p>
                                    </div>
                                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded font-bold uppercase">ID: {viewingAd.id}</span>
                                </div>

                                {/* Imagem do Anúncio */}
                                <div className="w-full h-48 bg-gray-100 rounded-2xl overflow-hidden relative">
                                    <img src={viewingAd.image} className="w-full h-full object-cover" alt="Ad Cover" />
                                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                        Imagem Principal
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                                        <Tag className="w-3 h-3" /> Título
                                    </label>
                                    <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 font-medium">
                                        {viewingAd.title}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                                            <DollarSign className="w-3 h-3" /> Preço
                                        </label>
                                        <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 font-bold">
                                            R$ {viewingAd.price ? viewingAd.price.toLocaleString('pt-BR') : '0,00'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" /> Status
                                        </label>
                                        <div className={`w-full border rounded-xl p-3 font-bold text-center uppercase text-xs ${viewingAd.status === AdStatus.ACTIVE ? 'bg-green-50 text-green-700 border-green-200' :
                                            viewingAd.status === AdStatus.PENDING ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                'bg-red-50 text-red-700 border-red-200'
                                            }`}>
                                            {viewingAd.status}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                                        <FileText className="w-3 h-3" /> Descrição
                                    </label>
                                    <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-700 text-sm leading-relaxed whitespace-pre-wrap min-h-[100px]">
                                        {viewingAd.description || 'Sem descrição.'}
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 bg-white border-t border-gray-100 flex gap-3 shrink-0">
                                <button
                                    onClick={closeViewModal}
                                    className="w-full py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Fechar Visualização
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
