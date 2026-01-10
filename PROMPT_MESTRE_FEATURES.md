# Prompt Mestre de Criação de Features - Feirão da Orca

Copie exatamente o texto abaixo e envie para a IA antes de pedir qualquer feature:

---

📌 CONTEXTO OBRIGATÓRIO

Você está trabalhando no aplicativo Feirão da Orca, um marketplace de veículos, imóveis e peças/serviços, com:

*   Painel de Administrador robusto
*   Carrosséis de banners administráveis por página
*   Regras de negócio já definidas (datas, status, limite, visibilidade)
*   Arquitetura React + TypeScript
*   Estado centralizado (useAppState / useAppActions)
*   Persistência local (LocalStorage) e futura migração para Supabase
*   Integrações futuras com Mercado Pago
*   Código já blindado contra duplicidade de arquivos e imports cruzados

🎯 OBJETIVO DA FEATURE

Quero criar a seguinte funcionalidade:

[DESCREVA A FEATURE AQUI EM UMA FRASE]

⚠️ REGRAS INEGOCIÁVEIS

A IA DEVE:

1.  **Seguir a arquitetura existente**
    *   Nunca criar lógica fora de `useAppState` e `useAppActions`
    *   Nunca usar estado local para dados globais
    *   Nunca duplicar lógica já existente
2.  **Não quebrar funcionalidades existentes**
    *   Dashboard
    *   Admin
    *   Carrosséis
    *   Promoções
    *   Navegação
3.  **Não criar arquivos duplicados**
    *   NÃO criar nada dentro de `src/` se já existir equivalente na raiz
    *   Usar apenas um source of truth
4.  **Persistência obrigatória**
    *   Toda feature que gera dados deve:
        *   Persistir em LocalStorage
        *   Estar pronta para migração futura para Supabase
5.  **Admin-first**
    *   Se a feature tiver impacto visual ou comercial:
        *   Deve existir controle no Admin
        *   Deve permitir ativar/desativar
        *   Deve ter datas (quando aplicável)
6.  **Segurança lógica**
    *   Validar dados antes de salvar
    *   Impedir estados inválidos
    *   Proteger regras de negócio (ex: limites, datas, permissões)

🧱 ENTREGÁVEIS ESPERADOS

A IA deve entregar nesta ordem:

1.  **1️⃣ Análise da Feature**
    *   Onde ela se encaixa no app
    *   Impactos em Admin, UX e backend
    *   Dependências existentes
2.  **2️⃣ Modelagem de Dados**
    *   Interfaces TypeScript
    *   Campos obrigatórios
    *   Campos opcionais
    *   Regras de validação
3.  **3️⃣ Plano Técnico Passo a Passo**
    *   Arquivos que serão modificados
    *   Arquivos novos (se realmente necessários)
    *   O que NÃO deve ser mexido
4.  **4️⃣ Implementação Segura**
    *   Código organizado
    *   Sem duplicações
    *   Seguindo padrões já existentes
5.  **5️⃣ Checklist de Validação**
    *   O que testar manualmente
    *   Cenários de erro
    *   Cenários de sucesso

🚫 O QUE É PROIBIDO

A IA NÃO PODE:

*   “Simplificar” regras de negócio
*   Criar soluções temporárias
*   Ignorar Admin
*   Ignorar persistência
*   Criar código sem explicar impacto
*   Assumir decisões sem justificar
