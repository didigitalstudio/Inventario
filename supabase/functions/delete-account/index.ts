// Edge Function: delete-account
// El user logueado pide borrar su propia cuenta. La function valida el JWT,
// borra todos sus productos, sus fotos del bucket, y al usuario en auth.users.
//
// Llamada desde el cliente:
//   await supabase.functions.invoke('delete-account')
// La sesión del cliente se manda en el header Authorization automáticamente.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BUCKET = "fotos-productos";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "missing_auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user) {
    return new Response(JSON.stringify({ error: "invalid_token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // 1) Listar fotos en la carpeta del usuario y borrarlas
  const { data: files } = await admin.storage.from(BUCKET).list(user.id, { limit: 1000 });
  if (files && files.length > 0) {
    const paths = files.map((f) => `${user.id}/${f.name}`);
    const { error: storageErr } = await admin.storage.from(BUCKET).remove(paths);
    if (storageErr) {
      return new Response(JSON.stringify({ error: "storage_cleanup_failed", detail: storageErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }

  // 2) Borrar todos sus productos (incluye soft-deleted)
  const { error: dbErr } = await admin.from("productos").delete().eq("owner_id", user.id);
  if (dbErr) {
    return new Response(JSON.stringify({ error: "db_cleanup_failed", detail: dbErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // 3) Borrar al user
  const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
  if (delErr) {
    return new Response(JSON.stringify({ error: "user_delete_failed", detail: delErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
