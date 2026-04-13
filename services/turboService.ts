import { api, supabase } from './api';
import { TurboPlan, TurboSession } from '../types';
import { debugLogger } from '../utils/DebugLogger';

const FUNCTION_URL = 'https://xkkjjvrucnlilegwnoey.supabase.co/functions/v1/apply-turbo-reward';

export interface CreateTurboSessionResponse {
    success: boolean;
    sessionId: string;
    error?: string;
    requiredSteps?: number;
}

export const turboService = {
    /**
     * Inicializa uma sessão do Turbo para um anúncio específico
     *
     * @param adId - O UUID do anúncio
     * @param turboType - O plano escolhido baseado no enum oficial (PREMIUM, PRO, MAX)
     * @returns O objeto de resposta padronizado CreateTurboSessionResponse
     */
    createTurboSession: async (adId: string, turboType: TurboPlan): Promise<CreateTurboSessionResponse> => {
        try {
            const token = await api.getValidToken();

            const { data, error } = await supabase.functions.invoke('create-turbo-session', {
                body: { adId, turboType },
                headers: { Authorization: `Bearer ${token}` }
            });

            if (error) {
                throw new Error(error.message || 'Falha na comunicação com a Edge Function.');
            }

            // Converte o possível formato de data que retorne do servidor no padrão esperado.
            // E assegura que a checagem falha com a reposta formatada unificada:
            if (!data?.success && data?.error) {
                return {
                    success: false,
                    sessionId: '',
                    error: data.error
                };
            }

            return {
                success: data?.success || false,
                sessionId: data?.sessionId || '',
                requiredSteps: data?.requiredSteps
            };
        } catch (err: any) {
            console.error('[turboService] createTurboSession Error:', err);
            return {
                success: false,
                sessionId: '',
                error: err.message || 'Ocorreu um erro inesperado ao acionar o Turbo.'
            };
        }
    },

    /**
     * Aplica uma recompensa de turbo diretamente ao anúncio (Novo Sistema Progressivo)
     * 
     * @param adId - O UUID do anúncio
     * @returns Objeto de resposta com sucesso e novos dados do turbo
     */
    applyTurboReward: async (adId: string): Promise<{ success: boolean; error?: string; turbo_type?: string; turbo_progress?: number; turbo_expires_at?: string }> => {
        try {
            debugLogger.log("📡 Iniciando applyTurboReward...");

            // 🔁 Garantir sessão atualizada
            await supabase.auth.refreshSession();

            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData?.session?.access_token;

            if (!token) {
                throw new Error("TOKEN AUSENTE");
            }

            debugLogger.log("🔑 TOKEN OK (VALIDADO)");
            debugLogger.log(`🔐 TOKEN SIZE: ${token.length}`);
            debugLogger.log('📡 Chamando Edge Function apply-turbo-reward');

            // 🚀 CHAMADA CORRETA (SEM FETCH MANUAL)
            const { data, error } = await supabase.functions.invoke(
                "apply-turbo-reward",
                {
                    body: { adId },
                }
            );

            if (error) {
                debugLogger.log(`❌ ERRO FUNCTION: ${error.message}`);
                throw error;
            }

            debugLogger.log("✅ TURBO APLICADO COM SUCESSO");
            debugLogger.log(JSON.stringify(data));

            return {
                success: true,
                turbo_type: data.turbo_type,
                turbo_progress: data.turbo_progress,
                turbo_expires_at: data.turbo_expires_at
            };
        } catch (err: any) {
            console.error('[turboService] applyTurboReward Error:', err);
            debugLogger.log(`❌ ERRO FINAL: ${err.message}`);
            return {
                success: false,
                error: err.message || 'Erro ao aplicar recompensa do Turbo.'
            };
        }
    }
};
