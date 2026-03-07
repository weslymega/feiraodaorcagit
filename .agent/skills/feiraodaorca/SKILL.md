---
name: Feirão da Orca Architecture
description: Documentação técnica completa e guia de arquitetura do marketplace Feirão da Orca.
---

# SKILL: PROJETO FEIRÃO DA ORCA

Você é um especialista responsável por ajudar no desenvolvimento do aplicativo "Feirão da Orca".

Antes de responder qualquer pergunta ou gerar código, considere o seguinte contexto completo do projeto.

------------------------------------------------

## 1. CONTEXTO DO PRODUTO

O Feirão da Orca é um marketplace automotivo onde usuários podem:
- anunciar veículos
- anunciar peças
- anunciar serviços automotivos
- buscar anúncios
- favoritar anúncios
- conversar com vendedores via chat
- impulsionar anúncios usando Turbo ou Destaque VIP

O sistema é C2C (consumidor para consumidor) com suporte a vendedores profissionais.
O aplicativo funciona como uma SPA hospedada na Vercel.

------------------------------------------------

## 2. STACK TECNOLÓGICA

**Frontend:**
- React
- TypeScript
- Vite
- Hooks nativos (useState / useEffect)
- Context API

**Backend:**
- Supabase

**Banco de dados:**
- PostgreSQL

**Autenticação:**
- Supabase Auth (JWT ES256)

**Infraestrutura:**
- Vercel (frontend)
- Supabase Cloud (backend)

**Edge Functions:**
- Deno runtime

**Pagamentos:**
- Mercado Pago

**Monetização:**
- Turbo Ads (reward ads tipo AdMob)

------------------------------------------------

## 3. ESTRUTURA DO PROJETO

Principais diretórios:

`/screens`
Contém as telas principais da aplicação.
Exemplos: Home, VehicleDetails, MyAds, BoostTurboScreen, PublicProfile

`/services`
Contém integração com backend e APIs.
Exemplos: api.ts, turboService.ts, authService.ts

`/components`
Componentes reutilizáveis da interface.
Exemplos: Header, AdCard, Filters, Modals

`/types`
Definições TypeScript globais.

------------------------------------------------

## 4. ARQUITETURA DO APP

O aplicativo é uma SPA React com roteador customizado chamado AppRouter.
A navegação é controlada por:
`screenMap.tsx` e `renderScreen(screen, ctx)`

Não utiliza React Router.
A navegação é feita através de callbacks:
`onNavigate`, `onBack`

Os dados são carregados principalmente via `useEffect` em cada tela.

------------------------------------------------

## 5. BANCO DE DADOS PRINCIPAL

**Tabela profiles**
Dados públicos do usuário.
Campos principais: id, name, phone, role

**Tabela anuncios**
Contém todos os anúncios do sistema.
Campos principais: id, user_id, title, description, price, category, status

**Tabela favorites**
Relacionamento entre usuário e anúncio.
Campos: user_id, anuncio_id

**Tabela chats**
Conversas entre usuários.

**Tabela messages**
Mensagens dentro das conversas.

**Tabela ad_turbo_sessions**
Sessões de impulsionamento gratuito.

------------------------------------------------

## 6. SISTEMA DE AUTENTICAÇÃO

Autenticação via Supabase Auth.

Fluxo:
Usuário faz login → Supabase retorna JWT → JWT é armazenado no localStorage → Sessão é monitorada via onAuthStateChange → estado global é atualizado.

Sessão persiste automaticamente.
⚠️ ATENÇÃO: Os JWTs utilizam assinatura assimétrica ES256.

------------------------------------------------

## 7. SISTEMA DE ANÚNCIOS

**Fluxo de criação:**
Usuário abre Create Ad → preenche dados → envia imagens → dados salvos em Supabase Storage → registro inserido na tabela anuncios.

**Busca de anúncios:**
`SELECT * FROM anuncios WHERE status = 'active'`
Filtros adicionais: categoria, texto, preço, cidade.

------------------------------------------------

## 8. SISTEMA DE TURBO (IMPULSIONAMENTO)

O usuário pode impulsionar anúncios de duas formas.

**Modo gratuito:** Assistindo anúncios de terceiros (reward ads).
Fluxo: Frontend chama Edge Function `create-turbo-session`.
Função: valida anúncio, valida dono e cria sessão em `ad_turbo_sessions`.

**Modo pago:** Usuário compra destaque.
Edge Function: `create-highlight-payment`
Integração: Mercado Pago API.

------------------------------------------------

## 9. EDGE FUNCTIONS

Todas executam no Supabase Edge Runtime.
- `create-turbo-session`: Cria sessão de impulsionamento.
- `create-highlight-payment`: Cria pagamento para destaque premium.

Funções administrativas:
`admin_manage_users`, `admin_manage_roles`, `admin_manage_reports`, `admin_get_stats`

------------------------------------------------

## 10. SISTEMA DE SEGURANÇA

O banco utiliza RLS (Row Level Security).
Exemplo: Usuário só pode editar seus próprios anúncios (`auth.uid() = user_id`).

Proteção adicional:
Função SQL `protect_sensitive_fields()` impede alteração manual de campos sensíveis como role.

Edge Functions utilizam `SUPABASE_SERVICE_ROLE_KEY` para executar ações administrativas controladas ou burlar o Gateway nativo do Kong na verificação do ES256, realizando a verificação do usuário manualmente através do parse da JWT ou chamando a API auth diretamente no fluxo seguro.

------------------------------------------------

## 11. PROBLEMAS ESTRUTURAIS CONHECIDOS

Possíveis gargalos:
1. Roteador customizado dificulta escalabilidade.
2. Todo o bundle JS é carregado de uma vez.
3. Não existe lazy loading de telas.
4. Data fetching repetitivo via `useEffect`.
5. Possível over-fetching de anúncios.

------------------------------------------------

## 12. PADRÕES DE DESENVOLVIMENTO

Sempre que criar código novo:
- respeitar arquitetura atual
- evitar duplicação de lógica
- validar autenticação no backend
- não confiar em dados vindos do frontend
- manter compatibilidade com Supabase

------------------------------------------------

## 13. OBJETIVO DA IA

A IA deve ajudar a:
- melhorar performance
- melhorar segurança
- criar novas features
- reduzir bugs
- melhorar arquitetura gradualmente
- manter compatibilidade com o sistema existente

Sempre considerar as limitações atuais do projeto antes de sugerir mudanças estruturais.
