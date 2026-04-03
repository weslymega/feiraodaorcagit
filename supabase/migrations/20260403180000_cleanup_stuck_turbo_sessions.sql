-- Cleanup stuck turbo sessions
-- Statuses that are considered active but are older than 1 hour are marked as expired
-- to allow users to retry without being blocked by the "idempotency" rule in the Edge Function.

UPDATE ad_turbo_sessions
SET status = 'expired'
WHERE status = 'active'
AND created_at < now() - interval '1 hour';

-- Complementary index for performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_ad_turbo_sessions_status_created_at 
ON ad_turbo_sessions (status, created_at) 
WHERE status = 'active';
