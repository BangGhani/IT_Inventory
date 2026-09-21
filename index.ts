// Supabase Edge Function: crud-api
// -----------------------------------------------------------------------
// Gateway CRUD generik untuk aplikasi. Meneruskan header Authorization
// milik pemanggil ke Supabase client, sehingga Row Level Security (RLS)
// tetap berlaku per-user (function ini TIDAK pakai service role key,
// jadi tidak bisa melewati RLS).
//
// Body request (POST, JSON):
//   {
//     "table":   "pc",                         // wajib, lihat ALLOWED_TABLES
//     "action":  "list" | "get" | "insert" | "update" | "delete",
//     "id":      "uuid-atau-pk-lain",           // wajib untuk get/update/delete
//     "payload": { "hostname": "..." },         // wajib untuk insert/update
//     "filters": { "nip_pengguna": "12345" }    // opsional, untuk action=list
//   }
//
// Deploy: supabase functions deploy crud-api
// Contoh panggil dari frontend (supabase-js sudah menyisipkan Authorization):
//   const { data } = await fetch(`${SUPABASE_URL}/functions/v1/crud-api`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${session.access_token}`,
//     },
//     body: JSON.stringify({ table: "pc", action: "list" }),
//   }).then((r) => r.json());
// -----------------------------------------------------------------------

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

// table -> nama kolom primary key (dipakai untuk get/update/delete by id)
const ALLOWED_TABLES: Record<string, string> = {
  data_pegawai: "nip",
  user_estim: "username",
  pc: "id",
  printer: "id",
  wifi: "id",
  atm: "id",
  edc: "id",
  user_password_it_support: "id",
  office: "email",
  forticlient: "username",
  todo_list: "id",
  audit: "id",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Gunakan method POST" }, 405);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  let body: {
    table?: string;
    action?: string;
    id?: string;
    payload?: Record<string, unknown>;
    filters?: Record<string, string>;
  };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Body harus JSON valid" }, 400);
  }

  const { table, action, id, payload, filters } = body;

  if (!table || !(table in ALLOWED_TABLES)) {
    return jsonResponse({ error: `Tabel tidak diizinkan: ${table}` }, 400);
  }
  const pk = ALLOWED_TABLES[table];

  let query;
  switch (action) {
    case "list": {
      query = supabase.from(table).select("*");
      if (filters) {
        for (const [col, val] of Object.entries(filters)) {
          query = query.eq(col, val);
        }
      }
      break;
    }
    case "get": {
      if (!id) return jsonResponse({ error: "id wajib diisi untuk action=get" }, 400);
      query = supabase.from(table).select("*").eq(pk, id).single();
      break;
    }
    case "insert": {
      if (!payload) return jsonResponse({ error: "payload wajib diisi untuk action=insert" }, 400);
      query = supabase.from(table).insert(payload).select().single();
      break;
    }
    case "update": {
      if (!id) return jsonResponse({ error: "id wajib diisi untuk action=update" }, 400);
      if (!payload) return jsonResponse({ error: "payload wajib diisi untuk action=update" }, 400);
      query = supabase.from(table).update(payload).eq(pk, id).select().single();
      break;
    }
    case "delete": {
      if (!id) return jsonResponse({ error: "id wajib diisi untuk action=delete" }, 400);
      query = supabase.from(table).delete().eq(pk, id);
      break;
    }
    default:
      return jsonResponse({ error: `action tidak dikenal: ${action}` }, 400);
  }

  const { data, error } = await query;

  if (error) {
    return jsonResponse({ error: error.message }, 400);
  }

  return jsonResponse({ data });
});
