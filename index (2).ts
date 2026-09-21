// Supabase Edge Function: expiry-reminder
// -----------------------------------------------------------------------
// Contoh edge function untuk dijalankan terjadwal (lewat pg_cron + HTTP,
// atau Supabase Scheduled Functions) yang mengecek Office Account &
// FortiClient yang akan expired dalam N hari, lalu bisa dikirim ke
// webhook/notifikasi pilihanmu (Slack, email, WhatsApp API, dll).
//
// Deploy: supabase functions deploy expiry-reminder
// Test manual: curl -i --location --request POST \
//   'https://<project-ref>.functions.supabase.co/expiry-reminder' \
//   --header 'Authorization: Bearer <ANON_OR_SERVICE_ROLE_KEY>'
// -----------------------------------------------------------------------

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const daysAhead = Number(Deno.env.get("EXPIRY_DAYS_AHEAD") ?? "14");

// Isi dengan URL webhook notifikasimu (opsional). Kalau kosong, function
// hanya mengembalikan datanya sebagai JSON.
const notifyWebhookUrl = Deno.env.get("NOTIFY_WEBHOOK_URL") ?? "";

Deno.serve(async (_req) => {
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data, error } = await supabase.rpc("get_upcoming_expirations", {
    days_ahead: daysAhead,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (notifyWebhookUrl && data && data.length > 0) {
    const lines = data
      .map(
        (row: Record<string, unknown>) =>
          `- [${row.sumber}] ${row.identitas} -> expired ${row.tanggal_akhir} (${row.sisa_hari} hari lagi)`,
      )
      .join("\n");

    await fetch(notifyWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `Reminder: ${data.length} akun/akses akan expired dalam ${daysAhead} hari:\n${lines}`,
      }),
    });
  }

  return new Response(JSON.stringify({ count: data?.length ?? 0, data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
