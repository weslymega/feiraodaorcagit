# Plano de Implementação: Ajuste Legal + UX (Login e Cadastro)

Este plano detalha as alterações para garantir conformidade total com os requisitos do Google OAuth e Play Store, mantendo a estética Premium (Glassmorphism) e a fluidez da UX do Feirão da Orca.

## 🎯 Objetivos
- **Conformidade Legal**: Aceite explícito de termos para login via e-mail e cadastro.
- **Brand Policy Google**: Aviso legal para login social sem bloqueio por checkbox.
- **UX Premium**: Navegação interna para documentos legais e design Glassmorphism.
- **Micro-interações**: Feedback visual claro e acessibilidade.

---

## 🛠️ Arquitetura das Alterações

### 1. Novo Componente: `components/LegalConsent.tsx`
Um componente reutilizável que gerencia o checkbox de aceite e os links para Termos e Privacidade.

**Características:**
- Estilo: Glassmorphism (`bg-white/5`, `backdrop-blur-md`).
- Acessibilidade: Texto >= 12px, contraste alto, áreas de clique generosas.
- Links: Abrem via callbacks `onViewTerms` e `onViewPrivacy` (Navegação interna).

### 2. Tela de Login (`LoginScreen.tsx`)
- **Login E-mail/Senha**: Inserção do `LegalConsent` acima do botão "Entrar". O botão será desabilitado se o checkbox estiver desmarcado.
- **Google Login**: Adição de texto legal informativo abaixo do botão Google (conforme política do Google).
- **Smart Error UX**: Se o login falhar por credenciais inválidas, a mensagem oferecerá a opção de "Criar Conta".
- **Rodapé**: Links discretos para "Privacidade" e "Termos" na base da tela.

### 3. Tela de Cadastro (`RegisterScreen.tsx`)
- Substituição da implementação manual de termos pelo componente `LegalConsent`.
- Garantia de que o fluxo bloqueie a criação de conta sem aceite.
- Adição do mesmo rodapé para paridade visual.

### 4. Roteamento (`screenMap.tsx`)
- Implementação dos callbacks de navegação para garantir que os links abram as telas `Screen.TERMS_OF_USE` e `Screen.PRIVACY_POLICY` dentro do app.

---

## 📜 Detalhes do Código

### `components/LegalConsent.tsx`
```tsx
import React, { useState } from 'react';
import { Check } from 'lucide-react';

interface LegalConsentProps {
  onCheckedChange: (checked: boolean) => void;
  onViewTerms: () => void;
  onViewPrivacy: () => void;
  required?: boolean;
}

export const LegalConsent: React.FC<LegalConsentProps> = ({ 
  onCheckedChange, 
  onViewTerms, 
  onViewPrivacy, 
  required = true 
}) => {
  const [checked, setChecked] = useState(false);
  
  const handleToggle = () => {
    const nextValue = !checked;
    setChecked(nextValue);
    onCheckedChange(nextValue);
  };

  return (
    <div 
      className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 group cursor-pointer active:scale-[0.99] transition-all"
      onClick={handleToggle}
    >
      <div className={`mt-0.5 min-w-[24px] h-[24px] rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
        checked ? 'bg-primary border-primary shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-black/20 border-white/30'
      }`}>
        {checked && <Check className="w-4 h-4 text-white animate-in zoom-in duration-300" />}
      </div>
      <p className="text-white/80 text-[13px] leading-relaxed select-none">
        Li e aceito os <span onClick={(e) => { e.stopPropagation(); onViewTerms(); }} className="text-accent font-bold hover:text-accent/80 transition-colors">Termos de Uso</span> e a <span onClick={(e) => { e.stopPropagation(); onViewPrivacy(); }} className="text-accent font-bold hover:text-accent/80 transition-colors">Política de Privacidade</span>.
      </p>
    </div>
  );
};
```

---

## ✅ Checklist de Verificação (Testes)
- [ ] Login E-mail: Botão "Entrar" desabilitado sem o checkbox.
- [ ] Login E-mail: Mensagem de erro amigável ao falhar.
- [ ] Google Login: Texto informativo presente e funcional (sem checkbox).
- [ ] Cadastro: Bloqueio efetivo sem aceite.
- [ ] Navegação: Links abrindo as telas corretas sem sair do app.
- [ ] Design: Glassmorphism intacto e responsivo.

---

> [!IMPORTANT]
> **Aguardando análise**: Este plano será executado assim que você aprovar os detalhes acima.
