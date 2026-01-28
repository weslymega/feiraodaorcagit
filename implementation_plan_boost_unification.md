# Plano de Implementação: Unificação dos Planos de Destaque

## Objetivo
Eliminar as discrepâncias entre os planos de destaque mostrados durante a Criação de Anúncio e aqueles mostrados no fluxo de destaque em "Meus Anúncios". Garantir que ambos os fluxos usem o banco de dados para obter preços/duração e uma constante compartilhada para ativos visuais (ícones, cores).

## Revisão do Usuário Necessária
> [!IMPORTANT]
> A lógica do plano "Grátis" em `CreateAd` será preservada como uma opção apenas do lado do cliente (frontend), pois não é um plano pago no banco de dados.

## Mudanças Propostas

### [Novo Arquivo] [planConstants.tsx](file:///c:/Users/machine3/feiraodaorcagit/utils/planConstants.tsx)
- Criar um novo arquivo para manter `PLAN_METADATA`.
- Isso mapeará nomes de planos normalizados (ex: 'basic', 'advanced', 'premium') para sua representação visual:
  - `icon`: React Node (Ícone Lucide)
  - `color`: Classe CSS de cor de borda/texto
  - `recommended`: Booleano (Recomendado)
  - `features`: Array de strings (texto de marketing)

### [Modificar] [CreateAd.tsx](file:///c:/Users/machine3/feiraodaorcagit/screens/CreateAd.tsx)
- Remover o array `BOOST_PLANS` que está "hardcoded" (fixo no código).
- Adicionar estado `dbPlans` para armazenar os planos buscados do banco.
- Adicionar `useEffect` para chamar `api.getHighlightPlans()` na montagem do componente.
- Adicionar lógica específica para mesclar `dbPlans` com `PLAN_METADATA` para recriar a estrutura `BOOST_PLANS` dinamicamente.
- Manter a opção de plano 'gratis' localmente.

### [Modificar] [HighlightAdModal.tsx](file:///c:/Users/machine3/feiraodaorcagit/components/HighlightAdModal.tsx)
- Importar `PLAN_METADATA` de `utils/planConstants.tsx`.
- Atualizar a lógica de renderização para usar os metadados para ícones e cores, garantindo consistência visual com `CreateAd`.

## Plano de Verificação

### Verificação Manual
1. **Fluxo de Criação de Anúncio:**
   - Ir para "Criar Anúncio".
   - Navegar até a etapa "Destaque" (Boost).
   - Verificar se os planos (Simples, Premium, Topo) são exibidos com os preços corretos (buscados do DB) e ícones.
   - Verificar se a opção "Grátis" ainda está disponível, se aplicável.

2. **Fluxo Meus Anúncios:**
   - Ir para "Meus Anúncios".
   - Clicar no menu de três pontos em um anúncio ativo.
   - Clicar em "Destacar".
   - Verificar se o modal mostra EXATAMENTE os mesmos planos, preços e estilo visual que o fluxo de criação.
