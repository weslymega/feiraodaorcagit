import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Save, CheckCircle } from 'lucide-react';
import { Header } from '../components/Shared';

interface ChangePasswordProps {
  onBack: () => void;
  onChangePassword: (newPassword: string) => Promise<void>;
}

const PasswordInput: React.FC<{
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}> = ({ label, value, onChange, placeholder }) => {
  const [show, setShow] = useState(false);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Lock className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-12 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-800 transition-all"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
};

export const ChangePassword: React.FC<ChangePasswordProps> = ({ onBack, onChangePassword }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validação básica
    if (!newPassword || !confirmPassword) {
      setError("Por favor, preencha a nova senha e a confirmação.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (newPassword.length < 6) {
      setError("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setIsLoading(true);

    try {
      await onChangePassword(newPassword);
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || "Erro ao atualizar senha.");
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 animate-in zoom-in duration-300">
        <div className="bg-white p-8 rounded-2xl shadow-lg flex flex-col items-center text-center max-w-sm w-full">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Senha Alterada!</h2>
          <p className="text-gray-500">Sua senha foi atualizada com sucesso. Você será redirecionado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      <Header title="Alterar Senha" onBack={onBack} />

      <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6 animate-in slide-in-from-right duration-300">

        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
          <p className="text-sm text-blue-800">
            Para sua segurança, escolha uma senha forte que você não use em outros sites.
          </p>
        </div>

        <div className="space-y-4">
          <PasswordInput
            label="Nova Senha"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="Mínimo 6 caracteres"
          />

          <PasswordInput
            label="Confirmar Nova Senha"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Repita a nova senha"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm font-medium animate-in fade-in">
            {error}
          </div>
        )}

        <div className="mt-auto pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all ${isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-primary text-white shadow-purple-200 active:scale-[0.98]'
              }`}
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Atualizar Senha
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};