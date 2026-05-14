import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { JWT } from 'https://esm.sh/google-auth-library@8.7.0'

/**
 * EDGE FUNCTION: Envio de Push Notifications (FCM HTTP v1)
 */

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FIREBASE_SERVICE_ACCOUNT = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Função para gerar o Access Token do Google
async function getAccessToken() {
  if (!FIREBASE_SERVICE_ACCOUNT) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT secret is not set');
  }

  const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
  const jwtClient = new JWT(
    serviceAccount.client_email,
    null,
    serviceAccount.private_key,
    ['https://www.googleapis.com/auth/cloud-platform']
  );

  const tokens = await jwtClient.authorize();
  return tokens.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    const payload = await req.json();
    console.log(`[PUSH] Payload recebido:`, JSON.stringify(payload));

    // Normalizar o tipo e o registro (Suporta chamada direta ou via Webhook do Supabase)
    const record = payload.record || payload.data;
    const table = payload.table;
    const action = payload.type; // INSERT, UPDATE, etc
    
    let type = payload.type_override || payload.type; // Permite forçar um tipo
    
    // Auto-detecção baseada na tabela (Padrão Webhook Supabase)
    if (table === 'messages') type = 'chat_message';
    if (table === 'anuncios') type = 'ad_status_change';

    console.log(`[PUSH] Processando - Tabela: ${table}, Ação: ${action}, Tipo Detectado: ${type}`);

    const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT!);
    const PROJECT_ID = serviceAccount.project_id;
    
    let receiver_id;
    let notificationTitle;
    let notificationBody;
    let customData = {};

    console.log(`[PUSH] Tipo detectado final: ${type}`);

    if (type === 'chat_message') {
      if (!record) {
        console.error('[PUSH] Erro: record is null for chat_message');
        return new Response(JSON.stringify({ success: false, error: 'record is null' }), { status: 400 });
      }

      const { receiver_id: rid, sender_id, ad_id, content } = record;
      receiver_id = rid;

      console.log(`[PUSH] Detalhes do Chat - Remetente: ${sender_id}, Destinatário: ${receiver_id}, Ad: ${ad_id}`);

      console.log(`[PUSH] Buscando perfil do remetente: ${sender_id}`);
      const { data: sender } = await supabase
        .from('public_profiles')
        .select('name, avatar_url')
        .eq('id', sender_id)
        .single();

      notificationTitle = sender?.name || 'Novo contato';
      notificationBody = content || '📷 Enviou uma foto';
      
      console.log(`[PUSH] Usando Firebase Project ID: ${PROJECT_ID}`);

      // Proteção contra avatares em Base64 que estouram o limite de 4KB do FCM
      const safeAvatarUrl = (sender?.avatar_url && sender.avatar_url.startsWith('http')) 
        ? sender.avatar_url 
        : '';

      customData = {
        type: 'chat',
        adId: ad_id,
        senderId: sender_id,
        senderName: sender?.name || '',
        avatarUrl: safeAvatarUrl
      };
    } else if (type === 'ad_status_change') {
      const { user_id, status, titulo, id } = record;
      receiver_id = user_id;

      const isApproved = status === 'active' || status === 'ativo';
      notificationTitle = isApproved ? 'Anúncio Aprovado! 🚀' : 'Anúncio Rejeitado';
      notificationBody = isApproved 
        ? `Seu anúncio "${titulo}" foi aprovado e já está online.`
        : `Seu anúncio "${titulo}" não atendeu às diretrizes de moderação.`;
      
      customData = { type: 'ad', adId: id };
    }

    if (!receiver_id) {
      return new Response(JSON.stringify({ success: false, error: 'No receiver_id identified' }), { status: 400 });
    }

    // 0. Verificar preferências
    const { data: pref } = await supabase
      .from('profiles')
      .select('push_notifications_enabled, push_chat_enabled, push_ad_status_enabled')
      .eq('id', receiver_id)
      .single();

    if (pref && !pref.push_notifications_enabled) {
      return new Response(JSON.stringify({ success: true, reason: 'global_push_disabled' }));
    }

    if (type === 'chat_message' && pref && !pref.push_chat_enabled) {
      console.log(`[PUSH] User ${receiver_id} has chat notifications disabled`);
      return new Response(JSON.stringify({ success: true, reason: 'chat_push_disabled' }));
    }

    // 1. Buscar tokens
    console.log(`[PUSH] Fetching tokens for user: ${receiver_id}`);
    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', receiver_id);

    if (!tokens || tokens.length === 0) {
      console.log(`[PUSH] Nenhum token encontrado para o usuário: ${receiver_id}`);
      return new Response(JSON.stringify({ success: true, reason: 'no_tokens', user_id: receiver_id }));
    }

    console.log(`[PUSH] Encontrados ${tokens.length} tokens. Gerando access token do Firebase...`);
    // 2. Obter Access Token do Google
    const accessToken = await getAccessToken();

    // 3. Enviar para cada token (FCM v1)
    console.log(`[PUSH] Enviando para ${tokens.length} tokens via FCM v1...`);
    const results = await Promise.all(tokens.map(async (t) => {
      try {
        const res = await fetch(`https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            message: {
              token: t.token,
              notification: {
                title: notificationTitle,
                body: notificationBody
              },
              data: customData,
              android: {
                priority: 'high',
                notification: {
                  sound: 'default',
                  channel_id: 'default'
                }
              }
            }
          })
        });
        
        const fcmResult = await res.json();
        if (!res.ok) {
          console.error(`[PUSH] Erro FCM para o token ${t.token.substring(0, 10)}:`, JSON.stringify(fcmResult));
        } else {
          console.log(`[PUSH] Sucesso FCM para o token ${t.token.substring(0, 10)}`);
        }
        return res.ok;
      } catch (e) {
        console.error('[PUSH] Erro ao enviar para o token:', t.token.substring(0, 10), e);
        return false;
      }
    }));

    return new Response(JSON.stringify({ 
      success: true, 
      sent: results.filter(r => r).length, 
      total: tokens.length,
      debug_project_id: PROJECT_ID
    }));

  } catch (error) {
    console.error('Edge Function Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
})
