<div align="center">
<img width="1200" height="475" alt="GHHeader" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## 🛑 CHEKLIST DE ALINHAMENTO ENTRE AMBIENTES E DEPLOYS
Antes de rodar qualquer versão, debugar, clonar, ou interagir em outro terminal, EXECUTAR OBRIGATORIAMENTE O FLUXO:
1. `git pull` -> Para garantir o source de verdade.
2. `npm install` -> Alinhar package.json se dependências foram adicionadas externamente.
3. `supabase functions deploy` -> Alinhar infra.
4. `supabase db push` -> Garantir tabelas em paridade de desenvolvimento vs staging/produção.
---

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1MzGrbcREO26DYP-OeKiH8sHVpD2UCFpR

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
