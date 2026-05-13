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
    const { record, type } = await req.json();
    const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT!);
    const PROJECT_ID = serviceAccount.project_id;
    
    let receiver_id;
    let notificationTitle;
    let notificationBody;
    let customData = {};

    if (type === 'chat_message') {
      const { receiver_id: rid, sender_id, ad_id, content } = record;
      receiver_id = rid;

      const { data: sender } = await supabase
        .from('public_profiles')
        .select('name, avatar_url')
        .eq('id', sender_id)
        .single();

      notificationTitle = sender?.name || 'Novo contato';
      notificationBody = content || '📷 Enviou uma foto';
      customData = {
        type: 'chat',
        adId: ad_id,
        senderId: sender_id,
        senderName: sender?.name || '',
        avatarUrl: sender?.avatar_url || ''
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
      return new Response(JSON.stringify({ success: true, reason: 'chat_push_disabled' }));
    }

    // 1. Buscar tokens
    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', receiver_id);

    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ success: true, reason: 'no_tokens' }));
    }

    // 2. Obter Access Token do Google
    const accessToken = await getAccessToken();

    // 3. Enviar para cada token (FCM v1)
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
                  click_action: 'FLUTTER_NOTIFICATION_CLICK'
                }
              }
            }
          })
        });
        return res.ok;
      } catch (e) {
        console.error('Error sending to token:', t.token, e);
        return false;
      }
    }));

    return new Response(JSON.stringify({ 
      success: true, 
      sent: results.filter(r => r).length, 
      total: tokens.length 
    }));

  } catch (error) {
    console.error('Edge Function Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
})
