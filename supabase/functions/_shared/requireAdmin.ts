/**
 * _shared/requireAdmin.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for admin authentication and authorization in all
 * Feirão da Orca Edge Functions.
 *
 * Contract:
 *   - Extracts JWT from Authorization header
 *   - Validates the JWT via auth.getUser() (server-side, not trusting frontend)
 *   - Verifies is_admin === true OR role === 'admin' in the profiles table
 *   - Returns a typed result (AdminContext | ErrorResponse) — no throws
 *
 * Usage:
 *   const result = await requireAdmin(req, adminClient, corsHeaders);
 *   if (result.error) return result.response;
 *   const { user, adminId } = result; // safe to use from here on
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type AdminContext = {
  error: false;
  user: { id: string; email?: string };
  adminId: string;
};

export type AdminError = {
  error: true;
  response: Response;
};

export type AdminResult = AdminContext | AdminError;

/**
 * Validate that the incoming request comes from a legitimate admin user.
 * Returns AdminContext on success, AdminError with a ready Response on failure.
 */
export async function requireAdmin(
  req: Request,
  adminClient: SupabaseClient,
  corsHeaders: Record<string, string>,
  functionName: string = "unknown"
): Promise<AdminResult> {
  const tag = `[${functionName}][requireAdmin]`;

  // ── 1. Authorization Header ──────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn(`${tag} Missing or malformed Authorization header`);
    return {
      error: true,
      response: new Response(
        JSON.stringify({
          error: "UNAUTHORIZED",
          code: "ERR_MISSING_AUTH_HEADER",
          message: "Authorization header is required.",
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      ),
    };
  }

  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) {
    console.warn(`${tag} Empty Bearer token`);
    return {
      error: true,
      response: new Response(
        JSON.stringify({ error: "UNAUTHORIZED", code: "ERR_EMPTY_TOKEN" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      ),
    };
  }

  // ── 2. JWT Validation via Supabase Auth ──────────────────────────────────
  const { data: { user }, error: authError } = await adminClient.auth.getUser(token);

  if (authError || !user) {
    console.warn(`${tag} JWT validation failed: ${authError?.message ?? "no user"}`);
    return {
      error: true,
      response: new Response(
        JSON.stringify({
          error: "UNAUTHORIZED",
          code: "ERR_INVALID_JWT",
          message: "Token inválido ou expirado.",
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      ),
    };
  }

  // ── 3. Admin Privilege Check (DB is the ONLY source of truth) ────────────
  // Select BOTH fields to support either convention in the DB schema.
  // Explicit error handling: a DB failure should NEVER silently pass as admin.
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("is_admin, role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    // Cannot verify privileges → deny with 500, not 403
    console.error(`${tag} DB error fetching profile for user ${user.id}: ${profileError.message}`);
    return {
      error: true,
      response: new Response(
        JSON.stringify({
          error: "SERVER_ERROR",
          code: "ERR_PROFILE_FETCH_FAILED",
          message: "Não foi possível verificar as permissões. Tente novamente.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      ),
    };
  }

  const isAdmin = profile?.is_admin === true || profile?.role === "admin";

  if (!isAdmin) {
    // Audit log: unauthorized access attempt
    console.warn(
      `${tag} FORBIDDEN access attempt — user: ${user.email} (${user.id}) | is_admin: ${profile?.is_admin} | role: ${profile?.role}`
    );
    return {
      error: true,
      response: new Response(
        JSON.stringify({
          error: "FORBIDDEN",
          code: "ERR_NOT_ADMIN",
          message: "Acesso restrito a administradores.",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      ),
    };
  }

  // ── 4. Audit Log: Successful admin access ────────────────────────────────
  console.log(
    JSON.stringify({
      event: "ADMIN_ACCESS",
      function: functionName,
      adminId: user.id,
      adminEmail: user.email,
      timestamp: new Date().toISOString(),
    })
  );

  return {
    error: false,
    user: { id: user.id, email: user.email },
    adminId: user.id,
  };
}

/**
 * Convenience function: log an admin action after it completes.
 * Call this after every destructive admin operation.
 */
export function logAdminAction(
  functionName: string,
  action: string,
  adminId: string,
  targetId: string | null,
  success: boolean,
  extra?: Record<string, unknown>
): void {
  console.log(
    JSON.stringify({
      event: success ? "ADMIN_ACTION_SUCCESS" : "ADMIN_ACTION_FAILED",
      function: functionName,
      action,
      adminId,
      targetId,
      timestamp: new Date().toISOString(),
      ...extra,
    })
  );
}
