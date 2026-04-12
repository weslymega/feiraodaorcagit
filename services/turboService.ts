import { supabase } from './api';
import { TurboPlan, TurboSession } from '../types';

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
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData?.session?.access_token;

            const { data, error } = await supabase.functions.invoke('create-turbo-session', {
                body: { adId, turboType },
                ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {})
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
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData?.session?.access_token;

            const { data, error } = await supabase.functions.invoke('apply-turbo-reward', {
                body: { adId },
                ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {})
            });

            if (error) {
                throw new Error(error.message || 'Falha na comunicação com a Edge Function.');
            }

            if (!data?.success && data?.error) {
                return { success: false, error: data.error };
            }

            return {
                success: true,
                turbo_type: data.turbo_type,
                turbo_progress: data.turbo_progress,
                turbo_expires_at: data.turbo_expires_at
            };
        } catch (err: any) {
            console.error('[turboService] applyTurboReward Error:', err);
            return {
                success: false,
                error: err.message || 'Erro ao aplicar recompensa do Turbo.'
            };
        }
    }
};
