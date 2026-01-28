
import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, Loader2, Key, ChevronLeft } from 'lucide-react';
import { Header } from '../components/Shared';

interface ResetPasswordProps {
    onBack: () => void;
    onUpdatePassword: (password: string) => Promise<void>;
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
            <label className="block text-sm font-bold text-gray-700 ml-1 mb-1">{label}</label>
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                    type={show ? "text" : "password"}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full pl-11 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900 transition-all outline-none font-medium"
                    placeholder={placeholder}
                />
                <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                >
                    {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
            </div>
        </div>
    );
};

export const ResetPassword: React.FC<ResetPasswordProps> = ({ onBack, onUpdatePassword }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (newPassword.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        setIsLoading(true);
        try {
            await onUpdatePassword(newPassword);
            setIsLoading(false);
            setIsSuccess(true);
        } catch (err: any) {
            setIsLoading(false);
            setError(err.message || "Erro ao redefinir senha. O link pode ter expirado.");
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 animate-in zoom-in duration-300">
                <div className="bg-white p-8 rounded-[2rem] shadow-xl flex flex-col items-center text-center max-w-sm w-full border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-green-500"></div>
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-sm animate-bounce">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Senha Redefinida!</h2>
                    <p className="text-gray-500 mb-8 leading-relaxed text-sm">
                        Sua senha foi alterada com sucesso. Agora você pode fazer login normalmente.
                    </p>

                    <button
                        onClick={onBack}
                        className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-blue-200 active:scale-[0.98] transition-all hover:bg-primary-dark"
                    >
                        Fazer Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-white">
            <div className="px-6 pt-8 pb-4">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-700 transition-colors w-fit"
                >
                    <ChevronLeft className="w-8 h-8" />
                </button>
            </div>

            <div className="flex-1 px-8 flex flex-col animate-in slide-in-from-right duration-300">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
                        Criar Nova Senha
                    </h1>
                    <p className="text-gray-500 leading-relaxed">
                        Sua nova senha deve ser diferente das anteriores para sua segurança.
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold mb-6 flex items-center gap-2 border border-red-100 animate-in fade-in">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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

                    <button
                        type="submit"
                        disabled={isLoading || !newPassword || !confirmPassword}
                        className={`w-full py-4 mt-2 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all ${isLoading || !newPassword || !confirmPassword
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                                : 'bg-primary text-white shadow-blue-200 hover:bg-primary-dark active:scale-[0.98]'
                            }`}
                    >
                        {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                            <><span>Redefinir Senha</span><Key className="w-5 h-5" /></>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
