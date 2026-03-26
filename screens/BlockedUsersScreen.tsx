
import React, { useEffect, useState } from 'react';
import { UserX, Unlock, Loader2, User as UserIcon } from 'lucide-react';
import { Header } from '../components/Shared';
import { BlockedUser } from '../types';
import { api } from '../services/api';

interface BlockedUsersScreenProps {
  onBack: () => void;
  onUnblock: (id: string) => Promise<void>;
}

export const BlockedUsersScreen: React.FC<BlockedUsersScreenProps> = ({ onBack, onUnblock }) => {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  useEffect(() => {
    loadBlockedUsers();
  }, []);

  const loadBlockedUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getBlockedUsersFull();
      setBlockedUsers(data);
    } catch (error) {
      console.error("Erro ao carregar bloqueados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (id: string) => {
    try {
      setUnblockingId(id);
      await onUnblock(id);
      setBlockedUsers(prev => prev.filter(u => u.id !== id));
    } catch (error) {
      console.error("Erro ao desbloquear:", error);
    } finally {
      setUnblockingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 animate-in slide-in-from-right duration-300">
      <Header title="Usuários Bloqueados" onBack={onBack} />

      <div className="p-4">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-gray-500 text-sm">Carregando lista...</p>
            </div>
          ) : blockedUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-10 text-center gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <UserX className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Ninguém bloqueado</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Usuários que você bloquear aparecerão aqui. Você não verá anúncios nem mensagens deles.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {blockedUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border border-gray-100">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <UserIcon className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{user.name}</h4>
                      <p className="text-xs text-gray-500">Usuário Bloqueado</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleUnblock(user.id)}
                    disabled={unblockingId === user.id}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {unblockingId === user.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Unlock className="w-4 h-4" />
                    )}
                    Desbloquear
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 px-4">
          <div className="bg-red-50 rounded-xl p-4 border border-red-100">
            <h4 className="text-xs font-bold text-red-800 uppercase tracking-wider mb-1">Nota sobre Bloqueio</h4>
            <p className="text-xs text-red-600 leading-relaxed">
              O bloqueio é mútuo. Ao bloquear alguém, nem você nem a outra pessoa poderão ver anúncios ou enviar mensagens um para o outro.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
