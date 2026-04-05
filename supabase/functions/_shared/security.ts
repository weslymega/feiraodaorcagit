// supabase/functions/_shared/security.ts
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type SecurityEvent = "AUTH_FAILURE" | "UNAUTHORIZED_ADMIN" | "SERVER_ERROR";
export type Severity = "low" | "medium" | "high" | "critical";

interface LogPayload {
    event_type: SecurityEvent;
    severity?: Severity;
    user_id?: string;
    ip_address?: string;
    user_agent?: string;
    metadata?: Record<string, unknown>;
}

/**
 * Log a security event and check if an alert should be sent.
 * Non-blocking: Uses try/catch.
 */
export async function logSecurityEvent(
    supabase: SupabaseClient,
    payload: LogPayload
): Promise<void> {
    try {
        console.log(`[Security] Logging event: ${payload.event_type} (Severity: ${payload.severity || 'low'})`);

        // 1. Inserir Log (Service Role)
        const { error } = await supabase
            .from("security_logs")
            .insert({
                event_type: payload.event_type,
                severity: payload.severity || "low",
                user_id: payload.user_id,
                ip_address: payload.ip_address,
                user_agent: payload.user_agent,
                metadata: payload.metadata || {},
            });

        if (error) {
            console.error("[Security] Error inserting log:", error.message);
            return;
        }

        // 2. Chamar RPC de Detecção de Padrões
        const { data: threshold, error: rpcError } = await supabase.rpc(
            "check_security_alert_threshold",
            {
                p_ip_address: payload.ip_address,
                p_user_id: payload.user_id,
            }
        );

        if (rpcError) {
            console.error("[Security] Error checking patterns:", rpcError.message);
            return;
        }

        // 3. Se o padrão for detectado, disparar Webhook
        if (threshold && threshold.should_alert) {
            // Não bloqueamos a função esperando a resposta do webhook
            sendSecurityAlert({
                severity: threshold.severity,
                reason: threshold.reason,
                ip: payload.ip_address,
                userId: payload.user_id,
                event: payload.event_type
            }).catch(e => console.error("[Security] Webhook delivery failed:", e));
        }
    } catch (err) {
        console.error("[Security] Critical failure in logging system (non-blocking):", err);
    }
}

/**
 * Envia alerta para o Discord.
 * Assíncrono: Erros não bloqueiam o fluxo.
 */
async function sendSecurityAlert(alert: {
    severity: string;
    reason: string;
    ip?: string;
    userId?: string;
    event: string;
}): Promise<void> {
    const webhookUrl = Deno.env.get("SECURITY_WEBHOOK_URL");
    if (!webhookUrl) {
        console.warn("[Security] SECURITY_WEBHOOK_URL not set. Skipping real-time alert.");
        return;
    }

    try {
        const color = alert.severity === "critical" ? 15158332 : 15844367; // Red vs Orange
        
        const payload = {
            embeds: [{
                title: `🕵️ ALERTA DE SEGURANÇA - FEIRÃO DA ORCA`,
                description: alert.reason,
                color,
                fields: [
                    { name: "Severidade", value: alert.severity.toUpperCase(), inline: true },
                    { name: "Evento Base", value: alert.event, inline: true },
                    { name: "IP", value: alert.ip || "Desconhecido", inline: true },
                    { name: "User ID", value: alert.userId || "N/A", inline: true }
                ],
                timestamp: new Date().toISOString(),
                footer: { text: "Sistema de Monitoramento Automático" }
            }]
        };

        await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
    } catch (err) {
        console.error("[Security] Error sending Discord webhook:", err);
    }
}
