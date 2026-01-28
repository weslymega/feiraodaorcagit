# Documentação da Tabela `payment_events`

Esta documentação explica a implementação da tabela auditável `payment_events`, as políticas de segurança (RLS) e como utilizá-la em uma Edge Function.

## 1. Estrutura da Tabela e Imutabilidade

A tabela `payment_events` foi projetada para ser um **log imutável** (Append-Only Log). Isso significa que, uma vez inserido, um registro nunca deve ser alterado ou excluído. Isso é crucial para auditoria financeira e segurança.

### Por que é considerada imutável?

1.  **Políticas RLS Restritivas**:
    *   **UPDATE Bloqueado**: Existe uma política `FOR UPDATE` que nega explicitamente qualquer tentativa de atualização (`USING (false)`).
    *   **DELETE Bloqueado**: Existe uma política `FOR DELETE` que nega explicitamente qualquer tentativa de exclusão (`USING (false)`).
    *   **INSERT Controlado**: Apenas a role `service_role` (usada pelo backend/Edge Functions) tem permissão para inserir. O acesso anônimo ou de usuários autenticados padrão é negado.

2.  **Boas Práticas de Design**:
    *   Não utilizamos `ON CONFLICT DO UPDATE` (Upsert).
    *   Cada novo evento (mesmo que referente ao mesmo pagamento) deve gerar uma nova linha na tabela.

---

## 2. Políticas RLS (Row Level Security)

As políticas aplicadas no arquivo `setup_payment_events.sql` garantem a blindagem dos dados:

*   **"Enforce Immutability - No Updates"**: Impede qualquer operação `UPDATE` na tabela.
*   **"Enforce Immutability - No Deletes"**: Impede qualquer operação `DELETE` na tabela.
*   **"Allow Service Role Insert Only"**: Permite operações `INSERT` apenas para o `service_role`. Isso impede que clientes (navegadores/apps) insiram dados falsos diretamente.
*   **"Allow Service Role Select Only"**: (Opcional) Restringe a leitura também ao `service_role`, protegendo dados sensíveis de pagamentos contra acesso público.

---

## 3. Exemplo de Uso (Supabase Edge Function)

Abaixo, um exemplo de como registrar eventos na Edge Function que recebe o Webhook do Mercado Pago.

### `supabase/functions/mp-webhook/index.ts` (Exemplo)

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Interface do Evento para TypeScript
interface PaymentEvent {
  mercado_pago_payment_id: string;
  event_type: 'payment' | 'error' | 'duplicate' | 'invalid_signature' | 'webhook_received';
  status: string;
  raw_payload: any;
  source: 'webhook' | 'system' | 'retry';
  error_message?: string;
  processed: boolean;
}

// Inicializa o cliente Supabase com a Service Role Key (IMPORTANTE: NÃO USAR ANON KEY)
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req) => {
  const payload = await req.json();
  const paymentId = payload.data?.id || payload.id; // Ajuste conforme payload do MP
  
  // 1. Logar o recebimento do Webhook (Primeira ação)
  await logPaymentEvent({
    mercado_pago_payment_id: paymentId,
    event_type: 'webhook_received',
    status: 'pending',
    raw_payload: payload,
    source: 'webhook',
    processed: false
  });

  try {
    // ... Validar assinatura do Webhook ...
    // ... Verificar se o pagamento existe no MP ...

    // Simulando verificação de duplicidade
    const { data: existingProcessed } = await supabase
      .from('payment_events')
      .select('id')
      .eq('mercado_pago_payment_id', paymentId)
      .eq('event_type', 'payment') // Verifica se já processamos um sucesso
      .eq('processed', true)
      .limit(1);

    if (existingProcessed && existingProcessed.length > 0) {
      // Logar evento duplicado
      await logPaymentEvent({
        mercado_pago_payment_id: paymentId,
        event_type: 'duplicate',
        status: 'ignored',
        raw_payload: payload,
        source: 'webhook',
        processed: false // Não reaplicamos a lógica
      });
      
      return new Response(JSON.stringify({ message: 'Duplicate event' }), { status: 200 });
    }

    // ... Lógica de Negócio (Aprovar Anúncio, etc) ...

    // 2. Logar Sucesso do Processamento
    await logPaymentEvent({
      mercado_pago_payment_id: paymentId,
      event_type: 'payment',
      status: 'approved', // Status vindo do MP
      raw_payload: payload,
      source: 'webhook',
      processed: true
    });

    return new Response(JSON.stringify({ message: 'Success' }), { status: 200 });

  } catch (error) {
    // 3. Logar Erro
    await logPaymentEvent({
      mercado_pago_payment_id: paymentId,
      event_type: 'error',
      status: 'failed',
      raw_payload: payload,
      source: 'webhook',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      processed: false
    });

    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
})

// Função auxiliar para inserir na tabela payment_events
async function logPaymentEvent(event: PaymentEvent) {
  const { error } = await supabase
    .from('payment_events')
    .insert(event);

  if (error) {
    console.error('FALHA CRÍTICA: Não foi possível salvar log de pagamento:', error);
    // Em produção, você pode querer alertar um serviço de monitoramento aqui.
  }
}
```
