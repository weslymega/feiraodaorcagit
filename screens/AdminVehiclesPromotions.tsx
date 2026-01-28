
import React, { useState } from 'react';
import { ArrowLeft, Plus, Megaphone, Calendar, ExternalLink, Edit2, Trash2, ToggleLeft, ToggleRight, X, Image as ImageIcon } from 'lucide-react';
import { VehiclesPromotion } from '../types';

interface AdminVehiclesPromotionsProps {
    onBack: () => void;
    promotions: VehiclesPromotion[];
    onSave: (promo: Partial<VehiclesPromotion>) => void;
    onDelete: (id: string) => void;
    onToggleActive: (id: string) => void;
}

export const AdminVehiclesPromotions: React.FC<AdminVehiclesPromotionsProps> = ({
    onBack, promotions, onSave, onDelete, onToggleActive
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPromo, setEditingPromo] = useState<Partial<VehiclesPromotion> | null>(null);

    const handleOpenModal = (promo?: VehiclesPromotion) => {
        if (promo) {
            setEditingPromo(promo);
        } else {
            setEditingPromo({
                title: '',
                subtitle: '',
                image: '',
                link: '',
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().split('T')[0],
                active: true,
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingPromo(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingPromo) {
            onSave(editingPromo);
            handleCloseModal();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && editingPromo) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditingPromo({ ...editingPromo, image: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white sticky top-0 z-50 px-6 py-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                        <ArrowLeft className="w-6 h-6 text-gray-800" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Gerenciar Propagandas – Veículos</h1>
                        <p className="text-xs text-gray-500">Admin / Veículos</p>
                    </div>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-primary text-white p-2.5 rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            <div className="p-6">
                {/* Banner List */}
                <div className="space-y-4">
                    {promotions.map((banner) => (
                        <div key={banner.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 group">
                            {/* Banner Preview */}
                            <div className="relative aspect-[21/9] md:aspect-[25/9]">
                                <img
                                    src={banner.image}
                                    alt={banner.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 flex flex-col justify-center px-6">
                                    {banner.subtitle && <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest mb-1">{banner.subtitle}</span>}
                                    <h3 className="text-white font-black text-lg leading-tight">{banner.title}</h3>
                                </div>
                                <div className={`absolute top-4 right-4 text-white text-[10px] font-bold px-2 py-1 rounded-full border-2 border-white ${banner.active ? 'bg-green-500' : 'bg-gray-400'}`}>
                                    {banner.active ? 'ATIVO' : 'INATIVO'}
                                </div>
                            </div>

                            {/* Banner Info & Actions */}
                            <div className="p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                                        <Calendar className="w-4 h-4" />
                                        <span>{new Date(banner.startDate).toLocaleDateString()} - {new Date(banner.endDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className={`flex items-center gap-1 text-sm font-bold ${banner.link ? 'text-primary' : 'text-gray-300'}`}>
                                        <ExternalLink className="w-4 h-4" />
                                        <span>{banner.link ? 'Link Ativo' : 'Sem Link'}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                                    <button
                                        onClick={() => handleOpenModal(banner)}
                                        className="flex-1 py-2.5 bg-gray-50 text-gray-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" /> Editar
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (window.confirm("Deseja realmente excluir esta propaganda?")) {
                                                onDelete(banner.id);
                                            }
                                        }}
                                        className="flex-1 py-2.5 bg-gray-50 text-red-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" /> Excluir
                                    </button>
                                    <button
                                        onClick={() => onToggleActive(banner.id)}
                                        className={`p-2.5 rounded-xl transition-colors ${banner.active ? 'bg-blue-50 text-primary hover:bg-blue-100' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                                    >
                                        {banner.active ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {promotions.length === 0 && (
                        <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-100">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Megaphone className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="font-bold text-gray-900 mb-2">Nenhuma propaganda</h3>
                            <p className="text-sm text-gray-500">Comece adicionando seu primeiro banner promocional para Veículos.</p>
                        </div>
                    )}
                </div>

                {/* Info Box */}
                <div className="mt-8 bg-blue-50 rounded-3xl p-6 border border-blue-100">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Megaphone className="w-5 h-5 text-blue-600" />
                        </div>
                        <h4 className="font-bold text-blue-900">Sobre os Banners de Veículos</h4>
                    </div>
                    <p className="text-sm text-blue-800/80 leading-relaxed">
                        Estes banners aparecem no carrossel do topo da página de veículos. Você pode configurar até 5 banners ativos simultaneamente.
                    </p>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && editingPromo && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">
                                {editingPromo.id ? 'Editar Propaganda' : 'Nova Propaganda'}
                            </h3>
                            <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                            {/* Image Preview / Input */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Imagem do Banner</label>
                                <div className="space-y-3">
                                    <div
                                        onClick={() => document.getElementById('promo-image-upload')?.click()}
                                        className="relative aspect-[21/9] bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 group cursor-pointer hover:border-primary/50 transition-colors"
                                    >
                                        {editingPromo.image ? (
                                            <>
                                                <img src={editingPromo.image} className="w-full h-full object-cover" alt="Preview" />
                                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 border-2 border-transparent group-hover:border-primary">
                                                    <div className="bg-white/90 p-2 rounded-lg shadow-xl">
                                                        <ImageIcon className="w-5 h-5 text-primary" />
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                                                <div className="p-3 bg-gray-100 rounded-full">
                                                    <ImageIcon className="w-6 h-6" />
                                                </div>
                                                <span className="text-[10px] font-bold">CLIQUE PARA UPLOAD</span>
                                            </div>
                                        )}
                                    </div>

                                    <input
                                        id="promo-image-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />

                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                            <ExternalLink className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="url"
                                            placeholder="Ou cole a URL da imagem aqui..."
                                            className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                            value={editingPromo.image || ''}
                                            onChange={e => setEditingPromo({ ...editingPromo, image: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Title & Subtitle */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Título</label>
                                    <input
                                        type="text"
                                        placeholder="Opcional"
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        value={editingPromo.title || ''}
                                        onChange={e => setEditingPromo({ ...editingPromo, title: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Subtítulo</label>
                                    <input
                                        type="text"
                                        placeholder="Opcional"
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        value={editingPromo.subtitle || ''}
                                        onChange={e => setEditingPromo({ ...editingPromo, subtitle: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Início</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        value={editingPromo.startDate?.split('T')[0] || ''}
                                        onChange={e => setEditingPromo({ ...editingPromo, startDate: new Date(e.target.value).toISOString() })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Término</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        value={editingPromo.endDate?.split('T')[0] || ''}
                                        onChange={e => setEditingPromo({ ...editingPromo, endDate: new Date(e.target.value).toISOString() })}
                                    />
                                </div>
                            </div>


                            {/* Active Toggle */}
                            <div className="flex items-center justify-between py-2">
                                <span className="text-sm font-bold text-gray-700">Status Ativo</span>
                                <button
                                    type="button"
                                    onClick={() => setEditingPromo({ ...editingPromo, active: !editingPromo.active })}
                                    className={`p-1.5 rounded-lg transition-colors ${editingPromo.active ? 'bg-blue-50 text-primary' : 'bg-gray-50 text-gray-400'}`}
                                >
                                    {editingPromo.active ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                                </button>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                SALVAR ALTERAÇÕES
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
