import { api, supabase } from './api';
import { TurboPlan, TurboSession } from '../types';
import { debugLogger } from '../utils/DebugLogger';
import { captureError, addBreadcrumb } from './sentry';

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
        // 📖 BREADCRUMB: Usuário escolheu o plano Turbo — ANTES do vídeo AdMob
        // NÃO adicionar breadcrumbs dentro do ciclo de vídeo
        addBreadcrumb('turbo_session_requested', { adId, turboType }, 'info');

        try {
            const token = await api.getValidToken();

            const { data, error } = await supabase.functions.invoke('create-turbo-session', {
                body: { adId, turboType },
                headers: { Authorization: `Bearer ${token}` }
            });

            if (error) {
                throw new Error(error.message || 'Falha na comunicação com a Edge Function.');
            }

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
            // 🚨 Sentry: falha ao criar sessão Turbo (Edge Function indisponível ou erro de server)
            captureError(err, {
                tags: { flow: 'turbo', endpoint: 'create-turbo-session', turbo_type: turboType },
                extra: { adId },
                level: 'error',
            });
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
    applyTurboReward: async (adId: string, rewardId?: string): Promise<{ success: boolean; error?: string; turbo_type?: string; turbo_progress?: number; turbo_expires_at?: string }> => {
        try {
            debugLogger.log(`📡 Iniciando applyTurboReward (ID: ${rewardId})...`);

            await supabase.auth.refreshSession();
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData?.session?.access_token;

            if (!token) {
                // 🚨 Sentry: sem token APÓS refresh — caso crítico
                captureError(new Error('applyTurboReward: TOKEN AUSENTE após refresh'), {
                    tags: { flow: 'turbo', endpoint: 'apply-turbo-reward', type: 'missing_token' },
                    extra: { adId, rewardId },
                    level: 'fatal',
                });
                throw new Error("TOKEN AUSENTE");
            }

            debugLogger.log("🔑 TOKEN OK (VALIDADO)");

            // 📖 BREADCRUMB: Chamada à Edge Function — DEPOIS que o vídeo terminou
            // Este breadcrumb está FORA do ciclo do AdMob — é seguro adicioná-lo aqui
            addBreadcrumb('turbo_reward_api_call', { adId, rewardId }, 'info');

            debugLogger.log('📡 Chamando Edge Function apply-turbo-reward');

            const response = await supabase.functions.invoke(
                "apply-turbo-reward",
                {
                    body: { adId, rewardId },
                }
            );

            if (response.error) {
                let errorBody: any = null;
                try {
                    errorBody = response.error instanceof Error ? response.error.message : JSON.stringify(response.error);
                } catch (e) { }

                debugLogger.log(`❌ ERRO FUNCTION: ${response.error.message || 'Erro desconhecido'}`);
                if (errorBody) debugLogger.log(`📦 DETALHES DO ERRO: ${errorBody}`);

                // 🚨 Sentry: falha confirmada na Edge Function de recompensa
                captureError(response.error, {
                    tags: {
                        flow: 'turbo',
                        endpoint: 'apply-turbo-reward',
                        type: 'edge_function_error',
                    },
                    extra: { adId, errorBody },
                    level: 'error',
                });

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

            const diagnostic = err.message || 'Erro desconhecido';
            debugLogger.log(`❌ ERRO FINAL: ${diagnostic}`);

            // Captura apenas se não foi capturado ainda (evita duplicidade)
            if (!err.message?.includes('TOKEN AUSENTE') && !err.message?.includes('FALHA_EDGE_FUNCTION')) {
                captureError(err, {
                    tags: { flow: 'turbo', endpoint: 'apply-turbo-reward', type: 'unexpected' },
                    extra: { adId, diagnostic },
                    level: 'error',
                });
            }

            return {
                success: false,
                error: diagnostic
            };
        }
    }
};
