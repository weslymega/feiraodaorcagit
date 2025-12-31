
import React, { useState } from 'react';
import { Trash2, Heart } from 'lucide-react';
import { Header, PriceTag } from '../components/Shared';
import { AdItem } from '../types';

interface FavoritesProps {
  favorites: AdItem[];
  onBack: () => void;
  onRemove: (id: string) => void;
  onAdClick?: (ad: AdItem) => void;
}

export const Favorites: React.FC<FavoritesProps> = ({ favorites, onBack, onRemove, onAdClick }) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const confirmDelete = () => {
    if (deleteId) {
      onRemove(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="Favoritos" onBack={onBack} />

      <div className="p-4 flex flex-col gap-4">
        {favorites.map((item) => (
          <div 
            key={item.id} 
            onClick={() => onAdClick && onAdClick(item)}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group cursor-pointer active:scale-[0.99] transition-transform"
          >
            <div className="relative h-48 w-full">
              <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
              
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"></div>
              
              {item.category === 'autos' && (
                 <span className="absolute top-2 left-2 bg-blue-500/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded">Veículo</span>
              )}
            </div>
            
            <div className="p-4">
              <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">{item.title}</h3>
              <div className="flex justify-between items-end">
                <div>
                  <PriceTag value={item.price} />
                  <p className="text-gray-400 text-xs mt-1">{item.location}</p>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteId(item.id);
                  }}
                  className="p-2 bg-red-50 rounded-full hover:bg-red-100 transition-colors group/btn"
                  title="Remover dos favoritos"
                >
                  <Trash2 className="w-5 h-5 text-red-500 group-hover/btn:scale-110 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {favorites.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 border border-gray-200">
              <Heart className="w-8 h-8 text-gray-300" />
            </div>
            <p className="font-medium text-center px-6">Você ainda não tem nenhum favorito selecionado.</p>
          </div>
        )}
      </div>

      {/* --- MODAL DE CONFIRMAÇÃO --- */}
      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl scale-100 animate-in zoom-in-95 duration-200 border border-gray-100">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 mx-auto">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Remover dos Favoritos?</h3>
            <p className="text-gray-500 text-center mb-8 text-sm leading-relaxed">
              Você tem certeza que deseja remover este item da sua lista de favoritos?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteId(null)} 
                className="flex-1 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete} 
                className="flex-1 py-3.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-200 transition-colors"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
