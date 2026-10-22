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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return respond({ error: "Method not allowed." }, 405);

  const authorization = req.headers.get("Authorization");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!authorization) return respond({ error: "Unauthorized." }, 401);
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error("[admin-users] Required Supabase secrets are unavailable.");
    return respond({ error: "User service is not configured." }, 500);
  }

  try {
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: callerData, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !callerData.user?.email) return respond({ error: "Unauthorized." }, 401);

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: callerById, error: callerIdError } = await adminClient
      .from("users")
      .select("id,email,role")
      .eq("id", callerData.user.id)
      .maybeSingle();
    if (callerIdError) throw callerIdError;
    let callerRecord = callerById?.email?.toLowerCase() === callerData.user.email.toLowerCase() ? callerById : null;
    if (!callerRecord) {
      const escapedEmail = callerData.user.email.replace(/[\\%_]/g, "\\$&");
      const { data: callerMatches, error: callerLookupError } = await adminClient
        .from("users")
        .select("id,email,role")
        .ilike("email", escapedEmail)
        .limit(2);
      if (callerLookupError) throw callerLookupError;
      callerRecord = callerMatches?.length === 1 && callerMatches[0].email.toLowerCase() === callerData.user.email.toLowerCase()
        ? callerMatches[0]
        : null;
    }
    if (callerRecord?.role !== "Admin") return respond({ error: "Admin access is required." }, 403);

    const findAuthUser = async (record: { id: string; email: string }) => {
      const { data: directResult } = await adminClient.auth.admin.getUserById(record.id);
      if (directResult.user?.email?.toLowerCase() === record.email.toLowerCase()) return directResult.user;

      for (let page = 1; page <= 100; page += 1) {
        const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) throw error;
        const found = data.users.find(user => user.email?.toLowerCase() === record.email.toLowerCase());
        if (found) return found;
        if (data.users.length < 1000) break;
      }
      return null;
    };

    const body = await req.json().catch(() => null);
    if (body?.action === "create") {
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      const password = typeof body.password === "string" ? body.password.trim() : "";
      const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
      const role = body.role;
      const permissions = Array.isArray(body.permissions)
        ? body.permissions.filter((permission: unknown) => typeof permission === "string")
        : [];

      if (!email || !fullName || password.length < 6) {
        return respond({ error: "Nama, email, dan kata sandi minimal 6 karakter wajib diisi." }, 400);
      }
      if (!['Admin', 'Member', 'Kasir'].includes(role)) {
        return respond({ error: "Peran pengguna tidak valid." }, 400);
      }
      const escapedEmail = email.replace(/[\\%_]/g, "\\$&");
      const { data: existingUsers, error: duplicateLookupError } = await adminClient
        .from("users")
        .select("id")
        .ilike("email", escapedEmail)
        .limit(1);
      if (duplicateLookupError) throw duplicateLookupError;
      if (existingUsers?.length) return respond({ error: "Email sudah digunakan oleh pengguna lain." }, 409);

      const { data: authResult, error: authCreateError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
      if (authCreateError) return respond({ error: authCreateError.message }, 400);

      const userRow = {
        id: authResult.user.id,
        email,
        full_name: fullName,
        company_name: typeof body.companyName === "string" ? body.companyName : null,
        role,
        permissions: role === "Member" ? permissions : [],
      };
      const { data: savedUser, error: saveError } = await adminClient
        .from("users")
        .insert(userRow)
        .select("id,email,full_name,company_name,role,permissions")
        .single();

      if (saveError) {
        await adminClient.auth.admin.deleteUser(authResult.user.id);
        return respond({ error: saveError.message }, 400);
      }

      return respond({
        user: {
          id: savedUser.id,
          email: savedUser.email,
          password: "",
          fullName: savedUser.full_name,
          companyName: savedUser.company_name || undefined,
          role: savedUser.role,
          permissions: savedUser.permissions || [],
        },
      }, 201);
    }

    if (body?.action === "update") {
      const targetUserId = typeof body.targetUserId === "string" ? body.targetUserId.trim() : "";
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
      const password = typeof body.password === "string" ? body.password.trim() : "";
      const role = body.role;
      const permissions = Array.isArray(body.permissions)
        ? body.permissions.filter((permission: unknown) => typeof permission === "string")
        : [];
      if (!targetUserId || !email || !fullName) return respond({ error: "Nama, email, dan ID pengguna wajib diisi." }, 400);
      if (!['Admin', 'Member', 'Kasir'].includes(role)) return respond({ error: "Peran pengguna tidak valid." }, 400);
      if (password && password.length < 6) return respond({ error: "Kata sandi baru minimal 6 karakter." }, 400);

      const { data: targetRecord, error: targetLookupError } = await adminClient
        .from("users")
        .select("id,email")
        .eq("id", targetUserId)
        .maybeSingle();
      if (targetLookupError) throw targetLookupError;
      if (!targetRecord?.email) return respond({ error: "Data pengguna tidak ditemukan." }, 404);
      const escapedEmail = email.replace(/[\\%_]/g, "\\$&");
      const { data: otherUsers, error: duplicateLookupError } = await adminClient
        .from("users")
        .select("id")
        .ilike("email", escapedEmail)
        .neq("id", targetRecord.id)
        .limit(1);
      if (duplicateLookupError) throw duplicateLookupError;
      if (otherUsers?.length) return respond({ error: "Email sudah digunakan oleh pengguna lain." }, 409);

      const authUser = await findAuthUser(targetRecord);
      if (!authUser) {
        if (!password) return respond({ error: "Akun Auth belum tersedia. Masukkan kata sandi baru untuk mengaktifkannya." }, 404);
        const { error: createAuthError } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName },
        });
        if (createAuthError) return respond({ error: createAuthError.message }, 400);
      } else {
        const authUpdates: { email: string; email_confirm: boolean; user_metadata: { full_name: string }; password?: string } = {
          email,
          email_confirm: true,
          user_metadata: { full_name: fullName },
        };
        if (password) authUpdates.password = password;
        const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(authUser.id, authUpdates);
        if (authUpdateError) return respond({ error: authUpdateError.message }, 400);
      }

      const { data: savedUser, error: saveError } = await adminClient
        .from("users")
        .update({ email, full_name: fullName, role, permissions: role === "Member" ? permissions : [] })
        .eq("id", targetRecord.id)
        .select("id,email,full_name,company_name,role,permissions")
        .single();
      if (saveError) return respond({ error: saveError.message }, 400);
      return respond({
        user: {
          id: savedUser.id,
          email: savedUser.email,
          password: "",
          fullName: savedUser.full_name,
          companyName: savedUser.company_name || undefined,
          role: savedUser.role,
          permissions: savedUser.permissions || [],
        },
      });
    }

    if (body?.action === "delete") {
      const targetUserId = typeof body.targetUserId === "string" ? body.targetUserId.trim() : "";
      if (!targetUserId) return respond({ error: "ID pengguna wajib diisi." }, 400);

      const { data: targetRecord, error: targetLookupError } = await adminClient
        .from("users")
        .select("id,email")
        .eq("id", targetUserId)
        .maybeSingle();
      if (targetLookupError) throw targetLookupError;
      if (!targetRecord?.email) return respond({ error: "Data pengguna tidak ditemukan." }, 404);
      if (targetRecord.id === callerRecord.id || targetRecord.email.toLowerCase() === callerData.user.email.toLowerCase()) {
        return respond({ error: "Anda tidak dapat menghapus akun sendiri." }, 400);
      }

      const authUser = await findAuthUser(targetRecord);
      if (authUser) {
        const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(authUser.id);
        if (authDeleteError) throw authDeleteError;
      }
      const { error: rowDeleteError } = await adminClient.from("users").delete().eq("id", targetRecord.id);
      if (rowDeleteError) throw rowDeleteError;
      return respond({ success: true });
    }

    return respond({ error: "Aksi pengguna tidak valid." }, 400);
  } catch (error) {
    console.error("[admin-users] Request failed:", error);
    return respond({ error: "Gagal memproses pengguna." }, 500);
  }
});