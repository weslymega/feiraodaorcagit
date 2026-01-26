
import React, { useState } from 'react';
import { ArrowRight, Mail, Lock, User, ChevronLeft, Loader2 } from 'lucide-react';
import { User as UserType } from '../types';

interface RegisterScreenProps {
  onBack: () => void;
  onRegister: (user: any) => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onBack, onRegister }) => {
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

    // Call registration immediately (Supabase handles async)
    onRegister({
      name: formData.name,
      email: formData.email,
      password: formData.password
    });

    // Reset loading state is handled by effect or parent, but for now we keep it true until unmount or rely on parent
    // actually, parent calls navigate, so this component will unmount.
    // But if error, parent should probably stop loading?
    // Since onRegister is async in parent but here it returns void, we can't await it easily unless we change props.
    // For now, let's just set timeout to false after a bit or hope for unmount.
    // Better: make onRegister async in props?
    // Let's keep it simple: fire and forget, parent handles toast/nav.
    // If we want to stop loading on error, we need a way to know.
    // But for this task, let's just remove the timeout and call it.
    setTimeout(() => setIsLoading(false), 2000); // Failsafe to stop spinner if something hangs
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen relative flex flex-col overflow-hidden">

      {/* --- BACKGROUND IMAGE SECTION (Igual ao Login para consistência) --- */}
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
      <div className="absolute top-0 left-0 right-0 z-50 p-6">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full bg-black/20 text-white backdrop-blur-md hover:bg-black/30 transition-colors w-fit border border-white/10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>

      {/* Top Spacer */}
      <div className="flex-1"></div>

      {/* Bottom Section: Form */}
      <div className="relative bg-white/10 backdrop-blur-xl pt-10 pb-8 px-8 rounded-t-[3.5rem] shadow-[0_-20px_60px_rgba(0,0,0,0.4)] z-20 animate-slide-in-from-bottom duration-500 border-t border-white/20">

        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-1.5 bg-white/30 rounded-full"></div>

        <h2 className="text-2xl font-bold text-white mb-6 text-center tracking-tight text-shadow-sm">Crie sua conta</h2>

        {error && (
          <div className="bg-red-500/80 backdrop-blur-md text-white text-xs font-bold p-3 rounded-xl mb-4 text-center border border-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Nome */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-white/80 group-focus-within:text-white transition-colors" />
            </div>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full pl-11 pr-5 py-3.5 bg-black/40 border border-white/10 rounded-2xl focus:ring-2 focus:ring-accent focus:bg-black/60 focus:border-transparent text-white placeholder-white/60 backdrop-blur-md transition-all outline-none font-medium"
              placeholder="Nome completo"
            />
          </div>

          {/* Email */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-white/80 group-focus-within:text-white transition-colors" />
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full pl-11 pr-5 py-3.5 bg-black/40 border border-white/10 rounded-2xl focus:ring-2 focus:ring-accent focus:bg-black/60 focus:border-transparent text-white placeholder-white/60 backdrop-blur-md transition-all outline-none font-medium"
              placeholder="Seu e-mail"
            />
          </div>

          {/* Password */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-white/80 group-focus-within:text-white transition-colors" />
            </div>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full pl-11 pr-5 py-3.5 bg-black/40 border border-white/10 rounded-2xl focus:ring-2 focus:ring-accent focus:bg-black/60 focus:border-transparent text-white placeholder-white/60 backdrop-blur-md transition-all outline-none font-medium"
              placeholder="Senha (min. 6 caracteres)"
            />
          </div>

          {/* Confirm Password */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-white/80 group-focus-within:text-white transition-colors" />
            </div>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full pl-11 pr-5 py-3.5 bg-black/40 border border-white/10 rounded-2xl focus:ring-2 focus:ring-accent focus:bg-black/60 focus:border-transparent text-white placeholder-white/60 backdrop-blur-md transition-all outline-none font-medium"
              placeholder="Confirme a senha"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 bg-accent hover:bg-yellow-400 text-blue-900 rounded-2xl font-bold text-lg shadow-lg shadow-black/20 mt-2 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group ${isLoading ? 'opacity-80 cursor-wait' : ''}`}
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

        <div className="mt-6 text-center">
          <p className="text-white/80 text-xs">
            Ao criar uma conta, você concorda com nossos <br /> <span className="font-bold underline cursor-pointer">Termos de Serviço</span> e <span className="font-bold underline cursor-pointer">Política de Privacidade</span>.
          </p>
        </div>
      </div>
    </div>
  );
};
