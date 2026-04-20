
import React, { useState } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import { AVATAR_LIBRARY } from '../constants/avatars';
import { AnimatedAvatar } from './AnimatedAvatar';
import { api } from '../services/api';
import { User } from '../types';

interface AvatarPickerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onAvatarUpdated: (newAvatarId: string) => void;
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAvatarUpdated
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(currentUser.avatar_id || null);
  const [loading, setLoading] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setPreviewId(id);
    // Reset preview after 1.5s (animation 'once' would be better if we had a state for it)
    setTimeout(() => setPreviewId(null), 1500);
  };

  const handleSave = async () => {
    if (!selectedId || selectedId === currentUser.avatar_id) {
      onClose();
      return;
    }

    setLoading(true);
    try {
      await api.updateProfile({ avatar_id: selectedId });
      onAvatarUpdated(selectedId);
      onClose();
    } catch (error) {
      console.error("Erro ao salvar avatar:", error);
      alert("Erro ao salvar avatar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-xl font-black text-gray-900 leading-none">Escolha seu Avatar</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-wider">Biblioteca Oficial Orca</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Grid Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-3 gap-4">
            {AVATAR_LIBRARY.map((avatar) => {
              const isSelected = selectedId === avatar.id;
              const isPreviewing = previewId === avatar.id;

              return (
                <button
                  key={avatar.id}
                  onClick={() => handleSelect(avatar.id)}
                  className={`relative flex flex-col items-center gap-2 p-2 rounded-2xl transition-all ${
                    isSelected 
                      ? 'bg-primary/5 ring-2 ring-primary shadow-md scale-105' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <AnimatedAvatar 
                    avatarId={avatar.id} 
                    mode={isPreviewing ? 'once' : 'hover'} 
                    size={64}
                  />
                  <span className={`text-[10px] font-bold text-center leading-tight ${
                    isSelected ? 'text-primary' : 'text-gray-500'
                  }`}>
                    {avatar.name}
                  </span>
                  
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 bg-primary text-white p-1 rounded-full shadow-sm border-2 border-white">
                      <Check className="w-2.5 h-2.5 stroke-[4]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl text-gray-500 font-bold text-sm hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !selectedId || selectedId === currentUser.avatar_id}
            className="flex-[2] py-3.5 rounded-2xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Seleção'}
          </button>
        </div>
      </div>
    </div>
  );
};
