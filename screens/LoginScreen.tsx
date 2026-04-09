import React, { useState, useEffect } from 'react';
import { Mail, Lock, Image as ImageIcon, Shield, Loader2, AlertCircle } from 'lucide-react';
import { APP_LOGOS, ADMIN_USER, REGULAR_USER } from '../constants';
import { User } from '../types';
import { supabase, api } from '../services/api';
import { getSiteUrl } from '../utils/url';

interface LoginScreenProps {
  onLogin: (user: User) => void;
  onForgotPassword: () => void;
  onRegister: () => void;
  onViewTerms: () => void;
  onViewPrivacy: () => void;
  user: User | null; // Added for Auth Guard
  navigateTo: (screen: any) => void; // Added for redirection
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  onLogin, 
  onForgotPassword, 
  onRegister,
  onViewTerms,
  onViewPrivacy,
  user,
  navigateTo
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showErrorLinks, setShowErrorLinks] = useState(false);

  // Reset form when component mounts to prevent stale state after logout
  useEffect(() => {
    setEmail('');
    setPassword('');
    setErrorMsg('');
    setIsSubmitting(false);
    setShowErrorLinks(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // --- EARLY RETURN PROTECTION ---
    if (user) {
      console.warn('[AUTH] Usuário já autenticado. Redirecionando sem reprocessar login.');
      navigateTo('DASHBOARD');
      return;
    }

    // Prevent double submit
    if (isSubmitting) return;

    if (!email || !password) {
      setErrorMsg("Preencha todos os campos.");
      setShowErrorLinks(false);
      return;
    }

    setErrorMsg('');
    setShowErrorLinks(false);
    setLoading(true);
    setIsSubmitting(true);

    try {
      // 1. Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data.user) {
        // 2. Success: do NOTHING else.
        // The onAuthStateChange listener in useAppState.ts will detect the session, 
        // fetch the profile, set the user, and redirect to Dashboard.
        console.log("✅ Login successful. Waiting for Auth Listener...");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      
      // Monitoramento de Segurança: Logar falha de tentativa
      const isCredentialError = err.message === "Invalid login credentials" || err.status === 400;
      
      if (isCredentialError) {
        api.reportSecurityEvent('AUTH_FAILURE', 'low', { email });
        setErrorMsg("Não encontramos uma conta com esse e-mail ou a senha está incorreta.");
        setShowErrorLinks(true);
      } else {
        setErrorMsg("Erro ao entrar. Verifique sua conexão e tente novamente.");
        setShowErrorLinks(false);
      }
    } finally {
      // --- GUARANTEED STATE RESET ---
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    // --- EARLY RETURN PROTECTION ---
    if (user) {
      console.warn('[AUTH] Usuário já autenticado. Redirecionando...');
      navigateTo('DASHBOARD');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      setShowErrorLinks(false);
      const redirectUrl = getSiteUrl();
      console.log('🔗 [DEBUG] Starting Google Login...');
      console.log('🔗 [DEBUG] Resolved Site URL (getSiteUrl):', redirectUrl);
      console.log('🔗 [DEBUG] Window Origin:', window.location.origin);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error("Google login error:", err);
      setErrorMsg("Erro ao iniciar login com Google.");
    } finally {
      // --- GUARANTEED STATE RESET ---
      setLoading(false);
    }
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
      <div className="relative bg-white/10 backdrop-blur-3xl pt-14 pb-12 px-8 rounded-t-[3.5rem] shadow-[0_-20px_60px_rgba(0,0,0,0.4)] z-20 animate-slide-in-from-bottom duration-500 border-t border-white/20">

        {/* Decorative Curve Effect */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-1.5 bg-white/30 rounded-full"></div>

        <h2 className="text-2xl font-bold text-white mb-8 text-center tracking-tight text-shadow-sm">Acesse sua conta</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6" autoComplete="off">
          {errorMsg && (
            <div className="bg-red-500/90 text-white p-4 rounded-2xl backdrop-blur-md shadow-lg animate-in zoom-in duration-300 border border-red-400/50">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <div className="flex flex-col gap-2">
                  <p className="text-[13px] font-medium leading-tight">{errorMsg}</p>
                  {showErrorLinks && (
                    <div className="flex gap-4 mt-1">
                      <button 
                        type="button"
                        onClick={onRegister}
                        className="text-[12px] font-bold underline underline-offset-4 decoration-white/30 hover:text-white/80"
                      >
                        Criar conta agora
                      </button>
                      <button 
                        type="button"
                        onClick={() => { setErrorMsg(''); setShowErrorLinks(false); }}
                        className="text-[12px] font-bold hover:text-white/80"
                      >
                        Tentar novamente
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className={`h-5 w-5 transition-colors ${email ? 'text-accent' : 'text-white/70'} group-focus-within:text-accent`} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                className="w-full pl-11 pr-5 py-4 bg-black/40 border border-white/10 rounded-2xl focus:ring-2 focus:ring-accent focus:bg-black/60 focus:border-transparent text-white placeholder-white/40 backdrop-blur-md transition-all outline-none font-medium"
                placeholder="Seu e-mail"
                maxLength={254}
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className={`h-5 w-5 transition-colors ${password ? 'text-accent' : 'text-white/70'} group-focus-within:text-accent`} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full pl-11 pr-5 py-4 bg-black/40 border border-white/10 rounded-2xl focus:ring-2 focus:ring-accent focus:bg-black/60 focus:border-transparent text-white placeholder-white/40 backdrop-blur-md transition-all outline-none font-medium"
                placeholder="Sua senha"
                maxLength={100}
              />
            </div>
          </div>

          <div className="flex justify-end pr-2">
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-white/80 font-medium text-[13px] hover:text-accent transition-colors underline-offset-4 hover:underline"
            >
              Esqueci a senha
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || isSubmitting}
            className={`w-full py-4.5 rounded-2xl font-bold text-lg shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-2 ${
              loading || isSubmitting
              ? 'bg-white/10 text-white/40 cursor-not-allowed shadow-none'
              : 'bg-primary hover:bg-primary-dark text-white hover:shadow-primary/20'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-[15px]">Iniciando sessão...</span>
              </>
            ) : 'Entrar'}
          </button>
        </form>

        <div className="mt-10 flex flex-col items-center gap-4">
          <div className="flex items-center gap-4 w-full">
            <div className="flex-1 h-[1px] bg-white/10"></div>
            <p className="text-white/40 text-[11px] uppercase tracking-widest font-bold">Ou via digital</p>
            <div className="flex-1 h-[1px] bg-white/10"></div>
          </div>
          
          <button
            onClick={handleGoogleLogin}
            disabled={loading || isSubmitting}
            className="flex items-center gap-3 px-8 py-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group disabled:opacity-40"
          >
           <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
            </svg>
            <span className="text-white font-bold text-sm">Entrar com Google</span>
          </button>
          
          {/* Brand/Legal Policy Google */}
          <p className="text-[12px] text-white/40 text-center leading-relaxed max-w-[280px]">
            Ao continuar com o Google, você concorda automaticamente com nossos{' '}
            <button onClick={onViewTerms} className="text-white/60 font-bold hover:text-white underline decoration-white/20">Termos</button>
            {' '}e{' '}
            <button onClick={onViewPrivacy} className="text-white/60 font-bold hover:text-white underline decoration-white/20">Privacidade</button>.
          </p>
        </div>

        <div className="mt-12 text-center pb-4">
          <button
            onClick={onRegister}
            className="text-white/60 text-[14px] hover:text-white transition-all group"
          >
            Ainda não tem conta? <span className="font-bold text-accent group-hover:underline decoration-accent decoration-2 underline-offset-4 ml-1">Crie agora</span>
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
