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

            await supabase.auth.refreshSession();
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData?.session?.access_token;

            if (!token) throw new Error("TOKEN AUSENTE");

            debugLogger.log("🔑 TOKEN OK (VALIDADO)");
            debugLogger.log('📡 Chamando Edge Function apply-turbo-reward');

            // Usamos o invoke mas capturamos o erro de forma mais detalhada
            const response = await supabase.functions.invoke(
                "apply-turbo-reward",
                {
                    body: { adId },
                }
            );

            if (response.error) {
                // Tenta extrair o corpo do erro se disponível
                let errorBody: any = null;
                try {
                    // Em algumas versões do SDK, o erro contém o texto original
                    errorBody = response.error instanceof Error ? response.error.message : JSON.stringify(response.error);
                } catch (e) { }

                debugLogger.log(`❌ ERRO FUNCTION: ${response.error.message || 'Erro desconhecido'}`);
                if (errorBody) debugLogger.log(`📦 DETALHES DO ERRO: ${errorBody}`);
                
                throw new Error(response.error.message || "FALHA_EDGE_FUNCTION");
            }

            const data = response.data;
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
            
            // Log final para o AdDebug
            const diagnostic = err.message || 'Erro desconhecido';
            debugLogger.log(`❌ ERRO FINAL: ${diagnostic}`);
            
            return {
                success: false,
                error: diagnostic
            };
        }
    }
};
