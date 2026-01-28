
import React, { useState } from 'react';
import { Mail, ArrowRight, CheckCircle, ChevronLeft, Loader2 } from 'lucide-react';

interface ForgotPasswordProps {
  onBack: () => void;
  onSendResetEmail: (email: string) => Promise<void>;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack, onSendResetEmail }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setError('Digite um e-mail válido.');
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      await onSendResetEmail(email);
      setIsLoading(false);
      setIsSent(true);
    } catch (err: any) {
      setIsLoading(false);
      setError("Ocorreu um erro ao enviar o e-mail. Tente novamente.");
    }
  };

  if (isSent) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 animate-in zoom-in duration-300">
        <div className="bg-white p-8 rounded-[2rem] shadow-xl flex flex-col items-center text-center max-w-sm w-full border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-green-500"></div>
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">E-mail Enviado!</h2>
          <p className="text-gray-500 mb-8 leading-relaxed text-sm">
            Se este e-mail estiver cadastrado, você receberá um link de recuperação em breve. Verifique também sua caixa de spam.
          </p>

          <button
            onClick={onBack}
            className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-blue-200 active:scale-[0.98] transition-all hover:bg-primary-dark"
          >
            Voltar para Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
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
            Recuperar Senha
          </h1>
          <p className="text-gray-500 leading-relaxed">
            Digite seu e-mail abaixo. Se você tiver uma conta, enviaremos um link de recuperação para você.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold mb-6 flex items-center gap-2 border border-red-100 animate-in fade-in">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Seu E-mail</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900 placeholder-gray-400 transition-all outline-none font-medium"
                placeholder="exemplo@email.com"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email}
            className={`w-full py-4 mt-2 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all ${isLoading || !email
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
              : 'bg-primary text-white shadow-blue-200 hover:bg-primary-dark active:scale-[0.98]'
              }`}
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
              <><span>Enviar Link</span><ArrowRight className="w-5 h-5" /></>
            )}
          </button>
        </form>

        <div className="mt-auto pb-10 text-center">
          <p className="text-sm text-gray-400">
            Lembrou a senha? <button onClick={onBack} className="font-bold text-primary hover:underline">Fazer Login</button>
          </p>
        </div>
      </div>
    </div>
  );
};
