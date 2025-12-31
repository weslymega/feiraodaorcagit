
import React, { useState, useEffect } from 'react';
import { Mail, ArrowRight, CheckCircle, ChevronLeft, Loader2, Key, Hash, Lock, Eye, EyeOff } from 'lucide-react';

interface ForgotPasswordProps {
  onBack: () => void;
}

// Helper Component for Password Input
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

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form States
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // --- ACTIONS ---

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setError('Digite um e-mail válido.');
      return;
    }
    setError(null);
    setIsLoading(true);
    // Simular API
    setTimeout(() => {
      setIsLoading(false);
      setStep(2);
    }, 1500);
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) {
      setError('Código inválido.');
      return;
    }
    setError(null);
    setIsLoading(true);
    // Simular API
    setTimeout(() => {
      setIsLoading(false);
      setStep(3);
    }, 1500);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    setError(null);
    setIsLoading(true);
    // Simular API
    setTimeout(() => {
      setIsLoading(false);
      setStep(4);
    }, 2000);
  };

  // --- RENDERS ---

  // STEP 4: Success
  if (step === 4) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 animate-in zoom-in duration-300">
        <div className="bg-white p-8 rounded-[2rem] shadow-xl flex flex-col items-center text-center max-w-sm w-full border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-green-500"></div>
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-sm animate-bounce">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Senha Redefinida!</h2>
          <p className="text-gray-500 mb-8 leading-relaxed text-sm">
            Sua senha foi alterada com sucesso. Você já pode acessar sua conta com a nova credencial.
          </p>
          
          <button 
            onClick={onBack}
            className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-blue-200 active:scale-[0.98] transition-all hover:bg-primary-dark"
          >
            Fazer Login Agora
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
          onClick={step === 1 ? onBack : () => setStep(prev => (prev - 1) as any)} 
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-700 transition-colors w-fit"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      </div>

      <div className="flex-1 px-8 flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Progress Dots */}
        <div className="flex gap-2 mb-8 justify-center">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${step >= i ? 'w-8 bg-primary' : 'w-2 bg-gray-200'}`} />
          ))}
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
            {step === 1 && 'Recuperar Senha'}
            {step === 2 && 'Código de Verificação'}
            {step === 3 && 'Criar Nova Senha'}
          </h1>
          <p className="text-gray-500 leading-relaxed">
            {step === 1 && 'Digite seu e-mail abaixo para receber o código de recuperação.'}
            {step === 2 && <>Enviamos um código de 4 dígitos para <span className="font-bold text-gray-800">{email}</span></>}
            {step === 3 && 'Sua nova senha deve ser diferente das anteriores.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold mb-6 flex items-center gap-2 border border-red-100 animate-in fade-in">
             <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
             {error}
          </div>
        )}

        {/* STEP 1: Email Input */}
        {step === 1 && (
          <form onSubmit={handleSendEmail} className="flex flex-col gap-6">
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
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email}
              className={`w-full py-4 mt-2 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all ${
                isLoading || !email 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                  : 'bg-primary text-white shadow-blue-200 hover:bg-primary-dark active:scale-[0.98]'
              }`}
            >
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <><span>Enviar Código</span><ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: OTP Input */}
        {step === 2 && (
          <form onSubmit={handleVerifyCode} className="flex flex-col gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Código de 4 dígitos</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Hash className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type="text"
                  maxLength={4}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-11 pr-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900 placeholder-gray-400 transition-all outline-none font-bold tracking-widest text-lg"
                  placeholder="0000"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length < 4}
              className={`w-full py-4 mt-2 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all ${
                isLoading || otp.length < 4
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                  : 'bg-primary text-white shadow-blue-200 hover:bg-primary-dark active:scale-[0.98]'
              }`}
            >
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <><span>Verificar Código</span><ArrowRight className="w-5 h-5" /></>
              )}
            </button>
            
            <div className="text-center">
               <button type="button" onClick={() => { setStep(1); setOtp(''); }} className="text-sm text-primary font-bold hover:underline">
                 Reenviar código
               </button>
            </div>
          </form>
        )}

        {/* STEP 3: New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
            <PasswordInput 
              label="Nova Senha" 
              value={newPassword} 
              onChange={setNewPassword} 
              placeholder="Mínimo 6 caracteres"
            />
            <PasswordInput 
              label="Confirme a Senha" 
              value={confirmPassword} 
              onChange={setConfirmPassword} 
              placeholder="Repita a nova senha"
            />

            <button
              type="submit"
              disabled={isLoading || !newPassword || !confirmPassword}
              className={`w-full py-4 mt-4 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all ${
                isLoading || !newPassword || !confirmPassword
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                  : 'bg-primary text-white shadow-blue-200 hover:bg-primary-dark active:scale-[0.98]'
              }`}
            >
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <><span>Redefinir Senha</span><Key className="w-5 h-5" /></>
              )}
            </button>
          </form>
        )}

        <div className="mt-auto pb-10 text-center">
           <p className="text-sm text-gray-400">
             Lembrou a senha? <button onClick={onBack} className="font-bold text-primary hover:underline">Fazer Login</button>
           </p>
        </div>

      </div>
    </div>
  );
};
