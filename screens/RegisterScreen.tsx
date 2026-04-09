import React, { useState } from 'react';
import { ArrowRight, Mail, Lock, User, ChevronLeft, Loader2, AlertCircle } from 'lucide-react';
import { User as UserType } from '../types';

interface RegisterScreenProps {
  onBack: () => void;
  onRegister: (user: any) => void;
  onViewTerms: () => void;
  onViewPrivacy: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ 
  onBack, 
  onRegister,
  onViewTerms,
  onViewPrivacy
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validações
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setIsLoading(true);

    // Call registration
    onRegister({
      name: formData.name,
      email: formData.email,
      password: formData.password
    });

    // Failsafe to stop spinner if something hangs
    setTimeout(() => setIsLoading(false), 5000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen relative flex flex-col overflow-hidden bg-primary-950">

      {/* --- BACKGROUND IMAGE SECTION --- */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://revistacontinente.com.br/image/view/news/image/544"
          alt="Athos Bulcão Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-primary/40 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/60"></div>
      </div>

      {/* Header Back Button */}
      <div className="absolute top-0 left-0 right-0 z-[100] p-6">
        <button
          onClick={onBack}
          className="p-3 -ml-2 rounded-2xl bg-black/20 text-white backdrop-blur-md hover:bg-black/30 transition-all w-fit border border-white/10 active:scale-95"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>

      {/* Top Spacer */}
      <div className="flex-1"></div>

      {/* Bottom Section: Form */}
      <div className="relative bg-white/10 backdrop-blur-3xl pt-12 pb-10 px-8 rounded-t-[3.5rem] shadow-[0_-20px_60px_rgba(0,0,0,0.4)] z-20 animate-slide-in-from-bottom duration-500 border-t border-white/20">

        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-1.5 bg-white/30 rounded-full"></div>

        <h2 className="text-2xl font-bold text-white mb-8 text-center tracking-tight text-shadow-sm">Crie sua conta</h2>

        {error && (
          <div className="bg-red-500/90 backdrop-blur-md text-white p-4 rounded-2xl mb-6 shadow-lg animate-in shake duration-500 border border-red-400/50 flex gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-[13px] font-medium leading-tight">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          <div className="space-y-4">
            {/* Nome */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className={`h-5 w-5 transition-colors ${formData.name ? 'text-accent' : 'text-white/70'} group-focus-within:text-accent`} />
              </div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-11 pr-5 py-4 bg-black/40 border border-white/10 rounded-2xl focus:ring-2 focus:ring-accent focus:bg-black/60 focus:border-transparent text-white placeholder-white/40 backdrop-blur-md transition-all outline-none font-medium"
                placeholder="Nome completo"
                maxLength={100}
              />
            </div>

            {/* Email */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className={`h-5 w-5 transition-colors ${formData.email ? 'text-accent' : 'text-white/70'} group-focus-within:text-accent`} />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-11 pr-5 py-4 bg-black/40 border border-white/10 rounded-2xl focus:ring-2 focus:ring-accent focus:bg-black/60 focus:border-transparent text-white placeholder-white/40 backdrop-blur-md transition-all outline-none font-medium"
                placeholder="Seu e-mail"
                maxLength={254}
              />
            </div>

            {/* Password */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className={`h-5 w-5 transition-colors ${formData.password ? 'text-accent' : 'text-white/70'} group-focus-within:text-accent`} />
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-11 pr-5 py-4 bg-black/40 border border-white/10 rounded-2xl focus:ring-2 focus:ring-accent focus:bg-black/60 focus:border-transparent text-white placeholder-white/40 backdrop-blur-md transition-all outline-none font-medium"
                placeholder="Senha (min. 6 caracteres)"
                maxLength={100}
              />
            </div>

            {/* Confirm Password */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className={`h-5 w-5 transition-colors ${formData.confirmPassword ? 'text-accent' : 'text-white/70'} group-focus-within:text-accent`} />
              </div>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full pl-11 pr-5 py-4 bg-black/40 border border-white/10 rounded-2xl focus:ring-2 focus:ring-accent focus:bg-black/60 focus:border-transparent text-white placeholder-white/40 backdrop-blur-md transition-all outline-none font-medium"
                placeholder="Confirme a senha"
                maxLength={100}
              />
            </div>
          </div>

          <div className="pt-2">
            {/* O checkbox de termos agora é exibido apenas após o login/cadastro inicial */}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4.5 rounded-2xl font-bold text-lg shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-2 ${
              isLoading
              ? 'bg-white/10 text-white/40 cursor-not-allowed shadow-none'
              : 'bg-accent hover:bg-yellow-400 text-primary-950 shadow-accent/10'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <span>Criar Conta</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
            <button
              onClick={onBack}
              className="text-white/60 text-[14px] hover:text-white transition-all underline-offset-4 hover:underline"
            >
              Já possui uma conta? <span className="font-bold text-white">Fazer login</span>
            </button>
        </div>

        {/* --- RODAPÉ DISCRETO --- */}
        <div className="mt-8 flex justify-center gap-6 border-t border-white/5 pt-8 opacity-40">
           <button onClick={onViewPrivacy} className="text-[11px] text-white font-bold uppercase tracking-widest hover:opacity-80 transition-opacity">Privacidade</button>
           <div className="w-[1px] h-3 bg-white/20"></div>
           <button onClick={onViewTerms} className="text-[11px] text-white font-bold uppercase tracking-widest hover:opacity-80 transition-opacity">Termos</button>
        </div>
      </div>
    </div>
  );
};
