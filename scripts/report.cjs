/**
 * FEIRÃO DA ORCA - Script de Relatório Diário com Integração Telegram
 * Coleta métricas rápidas e envia para o Telegram via HTML.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
    const envPath = path.join(__dirname, '../.env');
    if (!fs.existsSync(envPath)) return process.env;
    const content = fs.readFileSync(envPath, 'utf8');
    const env = { ...process.env };
    content.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) env[key.trim()] = value.trim().replace(/^"|"$/g, '');
    });
    return env;
}

const env = loadEnv();
const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.SERVICE_ROLE_KEY);

async function sendTelegramMessage(text) {
    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
        console.log('⚠️ Telegram não configurado.');
        return;
    }

    try {
        const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: env.TELEGRAM_CHAT_ID,
                text: text,
                parse_mode: 'HTML' // Mais estável que Markdown
            })
        });

        if (response.ok) {
            console.log('✅ Relatório enviado para o Telegram!');
        } else {
            const errorData = await response.json();
            console.error('❌ Erro da API do Telegram:', errorData);
        }
    } catch (err) {
        console.error('❌ Erro na API do Telegram:', err.message);
    }
}

async function generateReport() {
    console.log('📊 GERANDO RELATÓRIO FEIRÃO DA ORCA...');
    
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));

    try {
        const { count: activeCount } = await supabase
            .from('anuncios')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');

        const { count: newCount } = await supabase
            .from('anuncios')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', twentyFourHoursAgo.toISOString());

        const { data: ads } = await supabase.from('anuncios').select('status');
        const stats = (ads || []).reduce((acc, ad) => {
            acc[ad.status] = (acc[ad.status] || 0) + 1;
            return acc;
        }, {});

        // Construir Mensagem HTML
        let reportText = `📊 <b>RELATÓRIO FEIRÃO DA ORCA</b>\n`;
        reportText += `<i>📅 ${now.toLocaleString('pt-BR')}</i>\n\n`;
        reportText += `📈 <b>Métricas de Hoje:</b>\n`;
        reportText += `• Novos anúncios (24h): <b>${newCount || 0}</b>\n`;
        reportText += `• Total ativos: <b>${activeCount || 0}</b>\n\n`;
        reportText += `📋 <b>Distribuição por Status:</b>\n`;
        
        Object.entries(stats).forEach(([status, count]) => {
            reportText += `• <code>${status}</code>: ${count}\n`;
        });

        reportText += `\n🤖 <i>Enviado automaticamente via GitHub Actions</i>`;

        await sendTelegramMessage(reportText);

    } catch (err) {
        console.error('❌ Erro ao gerar relatório:', err.message);
    }
}

generateReport();
