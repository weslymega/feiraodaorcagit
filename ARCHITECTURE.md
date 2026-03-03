# Feirão da Orca - Arquitetura de Software

Este documento define as diretrizes, padrões e convenções arquiteturais obrigatórias para o projeto Feirão da Orca, visando estabilidade, alinhamento técnico entre times/máquinas e prevenção de acoplamento estrutural.

## 1. Stack Tecnológica
- **Frontend:** React + Vite + TypeScript + TailwindCSS
- **Backend/DB:** Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **State Management:** Context API (desacoplada progressivamente do tradicional God Object pattern)
- **Navegação:** Roteamento baseado em Constantes Enumeradas (`Enum Screen`) com renderização delegada e mapeada em escopo isolado (`screenMap.tsx`).

## 2. Estrutura de Diretórios
- `/components/`: Componentes reutilizáveis (Shared UI, layouts base, etc).
  - `/components/router/`: Camada exclusiva de mapeamento e lógica de roteamento visual da aplicação.
- `/contexts/`: Gerenciamento de estado global centralizado (AppContext, AppState).
- `/hooks/`: Custom hooks para injeção modular de negócio.
- `/screens/`: Telas da aplicação projetadas para serem renderizadas a nível macro pelo AppRouter.
- `/services/`: Módulos encapsulados para comunicação com backend, regras estritas de API e serviços adjacentes (ex: `api.ts`, `turboService.ts`). Não deve haver regras de View na camada de Service.
- `/supabase/`: Configurações integradas, edge functions, migrations e queries SQL base.
- `/types.ts`: Definições globais e contratos estritos para garantir paridade tipográfica.

## 3. Diretrizes de Injeção de Dependência e Navegação
- **Proibido "Prop Drilling" massivo em AppRouter**: A camada master de roteamento (`AppRouter.tsx`) deve permanecer enxuta. Sub-renderização condicional é exposta via map (`screenMap.tsx`) e consumida usando Context props.
- O mapeamento nativo reage apenas ao enumerador. Nenhum Context extra forçado de roteamento deve ser criado para não competir com `RouterContextProps`.
- **Desacoplamento Progressivo**: Telas não devem consumir Payload completo quando necessitarem apenas de Fetch isolado atráves de Id. Ex: Telas de edição de entidades carregam seu estado passando IDs (como `adId`).

## 4. Comunicação com Backend e Edge Functions
- Funcionalidades customizadas e Edge Functions (Supercharging, pagamentos) **devem obrigatoriamente** possuir um serviço encapsulado isolado no diretório `/services/`.
- Nenhuma View ou Screen deve importar o pacote `supabase` para invocar procedures/functions diretamente (`supabase.functions.invoke()`). O componente provê gatilhos. O serviço executa as lógicas pesadas.
- O formato de retorno RPC / Edge Methods deve sempre transparecer para a base de contrato `{ success: boolean, error?: string, [payload keys] }`.

## 5. Convenções de Tipagem Estrita
- Variáveis que ditam planos, assinaturas ou estados lógicos com limites conhecidos **devem** ser geridas via TypeScript `enum` ou união de literais. O uso de `string` solta deve ser extirpado para evitar falha em tempo de execução sem catch pelo Compilador.
