# Prompt Awal — Aplikasi Inventaris & Manajemen IT

> Cara pakai: taruh file ini sebagai `CLAUDE.md` di root repo (Claude Code otomatis
> membacanya sebagai konteks project), ATAU copy-paste isi di bawah ini sebagai
> pesan pertama ke Claude Code. Taruh juga `supabase_schema.sql` di
> `supabase/schema.sql` dalam repo supaya Claude Code bisa membacanya langsung
> alih-alih hanya mengandalkan ringkasan di bawah.

## 1. Ringkasan Aplikasi

Aplikasi web personal untuk mencatat inventaris IT, manajemen data pegawai/akun,
dan aktivitas terkait (to do list, audit). Dipakai sendiri (bukan multi-tenant
publik), tapi tetap harus terasa seperti aplikasi profesional yang rapi.

## 2. Tech Stack

- **Framework**: Next.js (App Router, TypeScript)
- **Styling**: Tailwind CSS
- **UI components**: shadcn/ui (biar konsisten & cepat, tapi tetap bisa dikustom)
- **Backend/DB**: Supabase (Postgres + Auth + RLS) — skema sudah dirancang, lihat
  bagian 4
- **State/data fetching**: gunakan Supabase JS client langsung dari Server
  Components/Route Handlers untuk data awal; boleh pakai React Query kalau perlu
  client-side caching/mutation yang lebih rapi
- **Theming**: `next-themes` untuk toggle dark/light mode

## 3. Requirement UI/UX

- **Mobile-first**: rancang dulu untuk layar HP (navigasi bottom bar atau
  hamburger, list yang enak di-scroll, form yang nyaman diisi pakai jempol),
  baru sesuaikan layout untuk desktop (bisa pakai sidebar, tabel yang lebih
  lega, multi-kolom).
- **Desktop juga harus bagus**: bukan cuma versi mobile yang di-stretch — desktop
  boleh punya layout berbeda (sidebar + tabel data yang lebih informatif).
- **Dark mode / light mode**: ada toggle yang jelas (misal di header/settings),
  tersimpan preferensinya (localStorage / `next-themes`), dan default mengikuti
  preferensi sistem.
- **Aksen warna merah**: warna dasar tetap netral (putih/abu/hitam sesuai mode),
  tapi elemen aksen (tombol utama, highlight, badge status, active state di
  navigasi) pakai merah secukupnya — jangan dominan, cukup jadi identitas.
- Prioritaskan keterbacaan & kontras yang baik di kedua mode (WCAG AA minimal).
- Gunakan komponen yang konsisten untuk semua modul (PC, Printer, Wifi, ATM,
  EDC, dst) — idealnya bikin komponen generik (tabel list + form) yang dipakai
  ulang, bukan hardcode per tabel.

## 4. Konteks Database (Supabase)

Skema lengkap ada di `supabase/schema.sql` (sudah termasuk tabel, PK/FK, RLS,
trigger, view, dan RPC functions). Ringkasan tabel:

| Tabel | Primary Key | Relasi (FK) |
|---|---|---|
| `data_pegawai` | `nip` | — (master) |
| `user_estim` | `username` | `nip_pemegang` → `data_pegawai.nip` |
| `pc` | `id` (uuid) | `nip_pengguna` → `data_pegawai.nip` |
| `printer` | `id` (uuid) | — |
| `wifi` | `id` (uuid) | — (`lokasi` teks bebas) |
| `atm` | `id` (text) | — |
| `edc` | `id` (uuid) | `pic_nip` → `data_pegawai.nip` (nullable) |
| `user_password_it_support` | `id` (uuid) | — |
| `office` | `email` | — |
| `forticlient` | `username` | `pemegang_nip` → `data_pegawai.nip` |
| `todo_list` | `id` (uuid) | — |
| `audit` | `id` (uuid) | — |
| `profiles` | `id` (= `auth.users.id`) | extend Supabase Auth |

RPC functions yang tersedia (panggil via `supabase.rpc(...)`):
`get_pc_detail`, `search_inventory`, `get_dashboard_summary`, `mark_todo_done`,
`get_upcoming_expirations`.

Auth & RLS: pakai Supabase Auth biasa; semua tabel RLS-nya "authenticated penuh
akses" (karena personal). Kalau butuh, edge functions contoh (`crud-api`,
`dashboard`, `expiry-reminder`) juga sudah ada.

**Kamu diizinkan mengusulkan perubahan skema** kalau menurutmu ada yang perlu
disesuaikan demi kebutuhan frontend (mis. kolom tambahan, index baru, view
baru). Kalau ada perubahan: jangan langsung edit `schema.sql` yang lama —
buatkan file migration baru (`supabase/migrations/xxxx_deskripsi.sql`), jelaskan
alasannya secara singkat, baru aku review sebelum diterapkan.

## 5. Fitur yang Dibutuhkan (awal)

- Login (Supabase Auth)
- Dashboard ringkas (pakai `get_dashboard_summary`): total PC, PC perlu
  peremajaan, todo pending, audit pending, akun mau expired
- Halaman list + detail + form tambah/edit untuk tiap modul: PC, Printer,
  Wifi, ATM, EDC, Data Pegawai, User Estim, User Password IT Support, Office,
  FortiClient
- To Do List (list, tambah, tandai selesai — bisa pakai `mark_todo_done`)
- Audit (list, tambah, update status/tindak lanjut)
- Search global lintas modul (pakai `search_inventory`)
- Reminder/notifikasi visual untuk akun yang mau expired (pakai
  `get_upcoming_expirations`)

## 6. Cara Kerja yang Diinginkan

1. Sebelum mulai coding, tolong ringkas dulu rencana struktur folder & halaman
   yang akan dibuat, biar aku bisa koreksi dulu.
2. Bangun bertahap: setup project + theming + layout dasar (mobile & desktop)
   dulu, baru modul per modul.
3. Kalau ada keputusan desain/skema yang ambigu, tanya dulu sebelum asumsi
   sendiri.
