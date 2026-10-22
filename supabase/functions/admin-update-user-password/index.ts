import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const respond = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/**
 * admin-update-user-password
 * Updates a target user's password via the Supabase Admin API.
 * Requires the caller to be authenticated as an Admin.
 *
 * Body: { targetUserId: string, newPassword: string }
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return respond({ error: "Method not allowed." }, 405);

  const authorization = req.headers.get("Authorization");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!authorization) return respond({ error: "Unauthorized." }, 401);
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return respond({ error: "Server tidak dikonfigurasi dengan benar." }, 500);
  }

  try {
    // Verify caller identity
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: callerData, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !callerData.user?.email) return respond({ error: "Unauthorized." }, 401);

    // Verify caller is Admin
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: callerRecord, error: callerLookupError } = await adminClient
      .from("users")
      .select("id,role")
      .eq("id", callerData.user.id)
      .maybeSingle();
    if (callerLookupError) throw callerLookupError;
    if (callerRecord?.role !== "Admin") return respond({ error: "Admin access is required." }, 403);

    // Parse body
    const body = await req.json().catch(() => null);
    const targetUserId = typeof body?.targetUserId === "string" ? body.targetUserId.trim() : "";
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword.trim() : "";

    if (!targetUserId) return respond({ error: "targetUserId wajib diisi." }, 400);
    if (!newPassword || newPassword.length < 6) return respond({ error: "Kata sandi baru minimal 6 karakter." }, 400);

    // Update password via Admin API
    const { error: updateError } = await adminClient.auth.admin.updateUserById(targetUserId, {
      password: newPassword,
    });
    if (updateError) return respond({ error: updateError.message }, 400);

    return respond({ success: true });
  } catch (error) {
    console.error("[admin-update-user-password] Request failed:", error);
    return respond({ error: "Gagal memperbarui kata sandi." }, 500);
  }
});
