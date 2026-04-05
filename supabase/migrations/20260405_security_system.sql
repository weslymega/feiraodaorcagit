-- 20260405_security_system.sql

-- 1. Tabela de Logs de Segurança (MUITO LEVE E ISOLADA)
CREATE TABLE IF NOT EXISTS public.security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL, -- 'AUTH_FAILURE', 'UNAUTHORIZED_ADMIN', 'SERVER_ERROR'
    severity TEXT NOT NULL DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
    user_id UUID, -- Sem FK obrigatória para auth.users para evitar bloqueios em delete
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Índices para performance na detecção de padrões
CREATE INDEX IF NOT EXISTS idx_security_logs_ip_time ON public.security_logs(ip_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_time ON public.security_logs(user_id, created_at DESC);

-- 3. RLS: Apenas Admins podem ler logs. Inserções permitidas apenas via Service Role (Edge Functions).
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view security logs" ON public.security_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')
  )
);

-- 4. RPC: check_security_alert_threshold
-- Determina se um alerta deve ser disparado com base nos padrões suspeitos
CREATE OR REPLACE FUNCTION public.check_security_alert_threshold(
    p_ip_address TEXT,
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    login_fails_count INT;
    admin_fails_count INT;
    total_4xx_count INT;
    result JSONB;
BEGIN
    -- Regra 1: 5 falhas de login em 1 minuto
    SELECT COUNT(*) INTO login_fails_count
    FROM public.security_logs
    WHERE ip_address = p_ip_address
    AND event_type = 'AUTH_FAILURE'
    AND created_at > (now() - interval '1 minute');

    IF login_fails_count >= 5 THEN
        RETURN jsonb_build_object(
            'should_alert', true, 
            'severity', 'high', 
            'reason', 'Múltiplas falhas de login (' || login_fails_count || ') vindas do mesmo IP no último minuto.'
        );
    END IF;

    -- Regra 2: 3 tentativas de acesso admin sem permissão em 5 minutos
    SELECT COUNT(*) INTO admin_fails_count
    FROM public.security_logs
    WHERE (ip_address = p_ip_address OR (p_user_id IS NOT NULL AND user_id = p_user_id))
    AND event_type = 'UNAUTHORIZED_ADMIN'
    AND created_at > (now() - interval '5 minutes');

    IF admin_fails_count >= 3 THEN
        RETURN jsonb_build_object(
            'should_alert', true, 
            'severity', 'critical', 
            'reason', 'Tentativas repetidas de acesso administrativo sem permissão (' || admin_fails_count || ').'
        );
    END IF;

    -- Regra 3: 10 erros 401/403 em sequência (5 min)
    SELECT COUNT(*) INTO total_4xx_count
    FROM public.security_logs
    WHERE (ip_address = p_ip_address OR (p_user_id IS NOT NULL AND user_id = p_user_id))
    AND (event_type = 'AUTH_FAILURE' OR event_type = 'UNAUTHORIZED_ADMIN')
    AND created_at > (now() - interval '5 minutes');

    IF total_4xx_count >= 10 THEN
        RETURN jsonb_build_object(
            'should_alert', true, 
            'severity', 'high', 
            'reason', 'Múltiplos erros de autorização em sequência (' || total_4xx_count || ') detectados.'
        );
    END IF;

    RETURN jsonb_build_object('should_alert', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
