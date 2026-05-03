// Edge Function: notify-signup
// Registra al usuario nuevo en inventario_users (aprobado=false) y notifica al panel admin.
// Llamada desde el cliente tras un signUp exitoso:
//   await supabase.functions.invoke('notify-signup')
// El JWT del usuario se envía automáticamente en Authorization.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DI_ADMIN_WEBHOOK_URL = Deno.env.get("DI_ADMIN_WEBHOOK_URL") ?? "";
const DI_ADMIN_WEBHOOK_SECRET = Deno.env.get("DI_ADMIN_WEBHOOK_SECRET") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "missing_auth" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Verificar JWT para obtener el usuario
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !user) {
    return new Response(JSON.stringify({ error: "invalid_token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Insertar en inventario_users (idempotente: si ya existe, no hace nada)
  await admin.from("inventario_users").upsert({
    user_id: user.id,
    email: user.email ?? "",
    aprobado: false,
  }, { onConflict: "user_id", ignoreDuplicates: true });

  // Notificar al panel admin (fail-soft)
  if (DI_ADMIN_WEBHOOK_URL && DI_ADMIN_WEBHOOK_SECRET) {
    try {
      await fetch(DI_ADMIN_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${DI_ADMIN_WEBHOOK_SECRET}`,
        },
        body: JSON.stringify({
          proyecto: "inventario",
          entity_type: "user",
          entity_id: user.id,
          auth_user_id: user.id,
          email: user.email ?? "",
          nombre: user.user_metadata?.inventory_name ?? null,
          datos_extra: { inventory_name: user.user_metadata?.inventory_name ?? null },
        }),
      });
    } catch { /* silencioso */ }
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
