
import React, { useState } from 'react';
import {
  Search,
  Filter,
  MoreVertical,
  ChevronLeft,
  Shield,
  ShieldOff,
  Trash2,
  Edit2,
  CheckCircle,
  X,
  User as UserIcon,
  Phone,
  Mail,
  MapPin,
  Lock,
  Unlock,
  Save,
  ChevronRight
} from 'lucide-react';
import { User, AdStatus } from '../types';
import { api, supabase } from '../services/api';
import { Loader2 } from 'lucide-react';

interface AdminUsersProps {
  onBack: () => void;
}

export const AdminUsers: React.FC<AdminUsersProps> = ({ onBack }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<User>>({});

  // Modals
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Fetch users on mount
  React.useEffect(() => {
    loadUsers();
  }, []);

  const handleFixSession = async () => {
    if (confirm('Isso irá desconectar você e limpar o cache para corrigir o erro de JWT. Deseja continuar?')) {
      await supabase.auth.signOut();
      localStorage.clear();
      window.location.reload();
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getAllUsers();
      setUsers(data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load users:', err);
      setError('Erro ao carregar usuários. Verifique suas permissões.');
    } finally {
      setLoading(false);
    }
  };

  // Filtro de busca
  const filteredUsers = users.filter(user =>
    (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setIsEditing(false);
    setShowBlockConfirm(false);
    setShowDeleteConfirm(false);
  };

  const handleEditClick = () => {
    if (selectedUser) {
      setEditForm(selectedUser);
      setIsEditing(true);
    }
  };

  const handleSaveEdit = () => {
    if (selectedUser && editForm) {
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, ...editForm } : u));
      setSelectedUser({ ...selectedUser, ...editForm } as User);
      setIsEditing(false);
    }
  };

  const handleBlockToggle = async () => {
    if (selectedUser) {
      let errorMessage = 'Erro desconhecido';
      try {
        setIsActionLoading(true);
        const newBlockStatus = !selectedUser.isBlocked;

        await api.toggleUserBlock(selectedUser.id!, newBlockStatus);

        const updatedUser = { ...selectedUser, isBlocked: newBlockStatus };
        setUsers(prev => prev.map(u => u.id === selectedUser.id ? updatedUser : u));
        setSelectedUser(updatedUser);
        setShowBlockConfirm(false);
      } catch (err: any) {
        console.error('Full Error Object:', err);
        errorMessage = err.message || 'Erro desconhecido';

        if (err.context && typeof err.context.json === 'function') {
          try {
            const body = await err.context.json();
            errorMessage = body.message || body.error || errorMessage;
          } catch (e) {
            console.error('Fail to parse error body:', e);
          }
        }
        alert('Erro ao alterar status: ' + errorMessage);
      } finally {
        setIsActionLoading(false);
      }
    }
  };

  const handleDeleteUser = async () => {
    if (selectedUser) {
      try {
        setIsActionLoading(true);
        await api.deleteUser(selectedUser.id!);
        setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
        setSelectedUser(null);
        setShowDeleteConfirm(false);
      } catch (err: any) {
        console.error('Full Error Object:', err);
        let errorMessage = err.message || 'Erro desconhecido';

        if (err.context && typeof err.context.json === 'function') {
          try {
            const body = await err.context.json();
            errorMessage = body.error || body.message || errorMessage;
          } catch (e) { }
        }

        alert('Erro ao excluir usuário: ' + errorMessage);
      } finally {
        setIsActionLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-6 animate-in slide-in-from-right duration-300">

      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3 shadow-sm">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Gerenciar Usuários</h1>
        <button
          onClick={handleFixSession}
          className="ml-auto text-[10px] bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-bold hover:bg-orange-200 transition-colors"
        >
          Reparar Sessão
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-4">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="px-4 flex flex-col gap-3">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 flex items-center justify-between">
            {error}
            <button onClick={loadUsers} className="font-bold underline">Tentar novamente</button>
          </div>
        )}

        <p className="text-sm font-bold text-gray-500 mb-1">
          {loading ? 'Carregando...' : `${filteredUsers.length} usuários encontrados`}
        </p>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
            <p className="text-gray-500 font-medium">Buscando usuários reais...</p>
          </div>
        ) : filteredUsers.map((user) => (
          <div
            key={user.id}
            onClick={() => handleSelectUser(user)}
            className={`bg-white p-4 rounded-xl border flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors active:scale-[0.99] ${user.isBlocked ? 'border-red-200 bg-red-50/30' : 'border-gray-100'
              }`}
          >
            <div className="relative">
              <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full object-cover bg-gray-200" />
              {user.isBlocked && (
                <div className="absolute -bottom-1 -right-1 bg-red-500 text-white p-0.5 rounded-full border-2 border-white">
                  <Lock className="w-3 h-3" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <h3 className={`font-bold text-base truncate ${user.isBlocked ? 'text-red-700' : 'text-gray-900'}`}>
                  {user.name}
                </h3>
                <div className="flex gap-1">
                  {user.isAdmin && <Shield className="w-4 h-4 text-primary fill-primary/10" />}
                  {user.verified && <Shield className="w-4 h-4 text-blue-500 fill-blue-100" />}
                </div>
              </div>
              <p className="text-sm text-gray-500 truncate">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${user.isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                  {user.isBlocked ? 'Bloqueado' : 'Ativo'}
                </span>
                <span className="text-[10px] text-gray-400">ID: {user.id?.slice(0, 8)}...</span>
              </div>
            </div>

            <ChevronRight className="w-5 h-5 text-gray-300" />
          </div>
        ))}

        {!loading && filteredUsers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <UserIcon className="w-12 h-12 mb-2 text-gray-300" />
            <p>Nenhum usuário encontrado.</p>
          </div>
        )}
      </div>

      {/* --- USER DETAILS MODAL --- */}
      {selectedUser && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedUser(null)} />

          <div className="bg-white w-full max-w-md h-[90vh] sm:h-auto sm:rounded-2xl rounded-t-[30px] shadow-2xl relative animate-slide-in-from-bottom flex flex-col overflow-hidden">

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">
                {isEditing ? 'Editar Usuário' : 'Detalhes do Usuário'}
              </h2>
              <button onClick={() => setSelectedUser(null)} className="p-2 -mr-2 rounded-full hover:bg-gray-200 transition-colors">
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">

              {/* Profile Summary */}
              {!isEditing && (
                <div className="flex flex-col items-center mb-6">
                  <div className="relative mb-3">
                    <img src={selectedUser.avatarUrl} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" />
                    {selectedUser.isBlocked && (
                      <div className="absolute bottom-0 right-0 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold shadow-sm">
                        Bloqueado
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedUser.name}</h3>
                  <p className="text-gray-500 text-sm">{selectedUser.email}</p>
                </div>
              )}

              {/* Mode: VIEW */}
              {!isEditing && (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                    <div className="flex items-center gap-3">
                      <Shield className={`w-5 h-5 ${selectedUser.isAdmin ? 'text-primary' : 'text-gray-400'}`} />
                      <div>
                        <p className="text-xs text-gray-400 font-bold uppercase">Status Administrativo</p>
                        <p className="text-gray-900 font-medium">{selectedUser.isAdmin ? 'Administrador' : 'Usuário Comum'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400 font-bold uppercase">Telefone</p>
                        <p className="text-gray-900 font-medium">{selectedUser.phone || 'Não informado'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400 font-bold uppercase">Localização</p>
                        <p className="text-gray-900 font-medium">{selectedUser.location || 'Não informado'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <UserIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400 font-bold uppercase">Bio</p>
                        <p className="text-gray-900 font-medium text-sm line-clamp-2">{selectedUser.bio || 'Sem bio'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-center">
                      <p className="text-xs text-blue-600 font-bold uppercase">Anúncios</p>
                      <p className="text-lg font-bold text-blue-900">{selectedUser.adsCount || 0} Ativos</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                      <p className="text-xs text-gray-500 font-bold uppercase">Desde</p>
                      <p className="text-lg font-bold text-gray-700">{selectedUser.joinDate}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Mode: EDIT */}
              {isEditing && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nome Completo</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">E-mail</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm(p => ({ ...p, email: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Telefone</label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm(p => ({ ...p, phone: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Localização</label>
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm(p => ({ ...p, location: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons (Only in View Mode) */}
              {!isEditing && !showBlockConfirm && !showDeleteConfirm && (
                <div className="mt-8 space-y-3">
                  <button
                    onClick={handleEditClick}
                    className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" /> Editar Informações
                  </button>

                  <button
                    onClick={() => setShowBlockConfirm(true)}
                    className={`w-full py-3 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors ${selectedUser.isBlocked
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                      }`}
                  >
                    {selectedUser.isBlocked ? <Unlock className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                    {selectedUser.isBlocked ? 'Desbloquear Usuário' : 'Bloquear Usuário'}
                  </button>

                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full py-3 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Excluir Conta
                  </button>
                </div>
              )}

              {/* Confirmation: Block */}
              {showBlockConfirm && (
                <div className="mt-6 bg-orange-50 p-4 rounded-xl border border-orange-200 text-center animate-in fade-in">
                  <AlertTriangleIcon />
                  <h4 className="font-bold text-orange-800 mb-2">
                    {selectedUser.isBlocked ? 'Desbloquear este usuário?' : 'Bloquear este usuário?'}
                  </h4>
                  <p className="text-xs text-orange-700 mb-4">
                    {selectedUser.isBlocked
                      ? 'O usuário poderá acessar a conta novamente.'
                      : 'O usuário perderá acesso imediato à conta e não poderá realizar ações.'}
                  </p>
                  <div className="flex gap-2">
                    <button
                      disabled={isActionLoading}
                      onClick={() => setShowBlockConfirm(false)}
                      className="flex-1 py-2 bg-white text-gray-600 font-bold rounded-lg border border-gray-200 disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      disabled={isActionLoading}
                      onClick={handleBlockToggle}
                      className="flex-1 py-2 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isActionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      Confirmar
                    </button>
                  </div>
                </div>
              )}

              {/* Confirmation: Delete */}
              {showDeleteConfirm && (
                <div className="mt-6 bg-red-50 p-4 rounded-xl border border-red-200 text-center animate-in fade-in">
                  <TrashIcon />
                  <h4 className="font-bold text-red-800 mb-2">Excluir permanentemente?</h4>
                  <p className="text-xs text-red-700 mb-4">
                    Esta ação não pode ser desfeita. Todos os dados e anúncios deste usuário serão removidos.
                  </p>
                  <div className="flex gap-2">
                    <button
                      disabled={isActionLoading}
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-2 bg-white text-gray-600 font-bold rounded-lg border border-gray-200 disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      disabled={isActionLoading}
                      onClick={handleDeleteUser}
                      className="flex-1 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isActionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      Excluir
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons (Edit Mode) */}
              {isEditing && (
                <div className="mt-8 flex gap-3">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" /> Salvar
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Helper Icons for the file
const AlertTriangleIcon = () => (
  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2 text-orange-500">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
  </div>
);

const TrashIcon = () => (
  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2 text-red-500">
    <Trash2 className="w-5 h-5" />
  </div>
);
