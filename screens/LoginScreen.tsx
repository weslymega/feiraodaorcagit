import React, { useState } from 'react';
import { Mail, Lock, Image as ImageIcon, Shield, Loader2 } from 'lucide-react';
import { APP_LOGOS, ADMIN_USER, REGULAR_USER } from '../constants';
import { User } from '../types';
import { supabase, api } from '../services/api';

interface LoginScreenProps {
  onLogin: (user: User) => void;
  onForgotPassword: () => void;
  onRegister: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onForgotPassword, onRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Preencha todos os campos.");
      return;
    }
    setErrorMsg('');
    setLoading(true);

    try {
      // 1. Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data.user) {
        // 2. Fetch Profile details (Balance, Plan, etc) or use basic user data
        // We use api.getProfile to get extra fields if they exist in 'profiles' table
        let profile = null;
        try {
          profile = await api.getProfile();
        } catch (err) {
          console.warn("Could not fetch extra profile details", err);
        }

        const user: User = {
          id: data.user.id,
          email: data.user.email || email,
          name: profile?.name || data.user.user_metadata?.name || "Usuário",
          avatarUrl: profile?.avatarUrl || data.user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${data.user.email}&background=random`,
          balance: profile?.balance || 0,
          adsCount: 0, // Should fetch real count if needed
          activePlan: profile?.activePlan || 'free',
          isAdmin: profile?.isAdmin || false,
          verified: !!data.user.email_confirmed_at,
          joinDate: profile?.joinDate || new Date(data.user.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
          phone: profile?.phone || "",
          location: profile?.location || "Brasília, DF",
          bio: profile?.bio || ""
        };

        onLogin(user);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setErrorMsg(err.message === "Invalid global credentials" ? "Credenciais inválidas." : "Erro ao entrar. Verifique seus dados.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col overflow-hidden">

      {/* --- BACKGROUND IMAGE SECTION --- */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://revistacontinente.com.br/image/view/news/image/544"
          alt="Athos Bulcão Background"
          className="w-full h-full object-cover"
        />
        {/* Overlay ajustado: Azul suave multiply para harmonizar, mas mantendo a imagem visível */}
        <div className="absolute inset-0 bg-primary/40 mix-blend-multiply"></div>
        {/* Degradê leve na parte inferior para ajudar o formulário a se destacar */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/60"></div>
      </div>

      {/* Top Section: Logo Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10 pb-12">

        <div className="relative animate-in zoom-in duration-700 w-full flex flex-col items-center">

          {/* LOGO CONTAINER - CARD BRANCO */}
          <div className="bg-white/95 backdrop-blur-sm p-8 rounded-[2.5rem] shadow-2xl mb-8 border border-white/50">
            <div className="w-full max-w-[280px] h-[90px] flex items-center justify-center relative">
              {!imageError ? (
                <img
                  src={APP_LOGOS.FULL}
                  alt="Feirão da Orca"
                  className="w-full h-full object-contain hover:scale-105 transition-transform duration-500"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 w-full h-full">
                  <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-gray-400 text-xs font-bold text-center">Logo indisponível</span>
                </div>
              )}
            </div>
          </div>

          {/* Divisor Decorativo */}
          <div className="flex items-center gap-3 opacity-100">
            <div className="h-[1px] w-12 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
            <p className="text-white font-bold text-[10px] tracking-[0.3em] uppercase text-shadow-md drop-shadow-md">O Marketplace do DF</p>
            <div className="h-[1px] w-12 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Form (Glassmorphism Effect) */}
      <div className="relative bg-white/10 backdrop-blur-xl pt-14 pb-10 px-8 rounded-t-[3.5rem] shadow-[0_-20px_60px_rgba(0,0,0,0.4)] z-20 animate-slide-in-from-bottom duration-500 border-t border-white/20">

        {/* Decorative Curve Effect */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-1.5 bg-white/30 rounded-full"></div>

        <h2 className="text-2xl font-bold text-white mb-8 text-center tracking-tight text-shadow-sm">Acesse sua conta</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {errorMsg && (
            <div className="bg-red-500/80 text-white text-xs p-3 rounded-xl text-center backdrop-blur-sm shadow-sm animate-in fade-in">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-white/80 group-focus-within:text-white transition-colors" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-5 py-4 bg-black/40 border border-white/10 rounded-2xl focus:ring-2 focus:ring-accent focus:bg-black/60 focus:border-transparent text-white placeholder-white/60 backdrop-blur-md transition-all outline-none font-medium"
                placeholder="Seu e-mail"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-white/80 group-focus-within:text-white transition-colors" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-5 py-4 bg-black/40 border border-white/10 rounded-2xl focus:ring-2 focus:ring-accent focus:bg-black/60 focus:border-transparent text-white placeholder-white/60 backdrop-blur-md transition-all outline-none font-medium"
                placeholder="Sua senha"
              />
            </div>
          </div>

          <div className="flex justify-end pr-2">
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-white/90 font-medium text-xs hover:text-white transition-colors hover:underline"
            >
              Esqueci a senha
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary hover:bg-primary-dark text-white rounded-2xl font-bold text-lg shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Entrar'}
          </button>

          {/* Login Options for Demo - Removed for production */}
          {/* <div className="grid grid-cols-2 gap-3 mt-4 border-t border-white/10 pt-4">...</div> */}
        </form>

        <div className="mt-8 flex flex-col items-center gap-4">
          <p className="text-white/70 text-xs uppercase tracking-wide font-medium">Ou continue com</p>
          <div className="flex gap-4">
            <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors border border-white/20">
              <span className="font-bold text-white">G</span>
            </button>
            <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors border border-white/20">
              <span className="font-bold text-white">f</span>
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={onRegister}
            className="text-white text-sm hover:opacity-90 transition-opacity font-medium"
          >
            Não tem conta? <span className="font-bold text-accent underline decoration-accent decoration-2 underline-offset-4">Criar conta</span>
          </button>
        </div>
      </div>
    </div>
  );
};
