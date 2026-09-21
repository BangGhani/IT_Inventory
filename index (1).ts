// Supabase Edge Function: dashboard
// -----------------------------------------------------------------------
// Endpoint ringkas untuk halaman utama app: total PC, PC yang perlu
// peremajaan, todo pending, audit pending, dan akun yang mau expired
// dalam 30 hari. Memanggil RPC public.get_dashboard_summary().
// Memakai token auth user (bukan service role) supaya RLS tetap berlaku.
//
// Deploy: supabase functions deploy dashboard
// -----------------------------------------------------------------------

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data, error } = await supabase
    .rpc("get_dashboard_summary")
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
