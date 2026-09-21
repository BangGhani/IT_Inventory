-- =====================================================================
-- SKEMA DATABASE: Aplikasi Inventaris & Manajemen IT (Personal)
-- Target: Supabase (PostgreSQL)
-- =====================================================================
-- Ringkasan desain (baca juga penjelasan di chat):
--  - Tabel yang punya field bertanda * di sumber -> dipakai sebagai PK asli
--    (data_pegawai.nip, user_estim.username, atm.id, office.email,
--     forticlient.username).
--  - Tabel tanpa tanda * -> PK surrogate UUID (gen_random_uuid()), dengan
--    UNIQUE constraint tambahan pada kolom yang secara alami unik
--    (serial_number, hostname, kombinasi mid+tid, dst).
--  - Field pilihan terbatas (Jenis, Tipe, Status, dll) -> dibatasi pakai
--    CHECK constraint, bukan ENUM type, supaya gampang diubah nanti.
--  - "Lokasi" di wifi & edc sengaja TETAP berupa kolom teks bebas
--    (bukan tabel master / FK) karena sifatnya fleksibel, bisa lokasi
--    apapun, sesuai arahan.
--  - "User Estim" field di Data Pegawai DIHAPUS: relasinya sudah cukup
--    lewat user_estim.nip_pemegang -> data_pegawai.nip (FK di sisi
--    "many"), jadi tidak perlu disimpan dua arah.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. EXTENSIONS
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- ---------------------------------------------------------------------
-- 1. UTILITY: trigger updated_at otomatis
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 2. AUTH: profil pengguna aplikasi (extend auth.users)
-- ---------------------------------------------------------------------
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  role       text not null default 'admin'
             check (role in ('admin', 'staff', 'viewer')),
  created_at timestamptz not null default now()
);

comment on table public.profiles is
  'Profil user aplikasi (1:1 dengan auth.users). role dipakai kalau nanti aplikasi dipakai lebih dari satu orang.';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 3. MASTER DATA
-- ---------------------------------------------------------------------

-- Data Pegawai (*NIP = PK)
create table public.data_pegawai (
  nip        text primary key,
  nama       text not null,
  jabatan    text,
  unit_kerja text,
  keterangan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.data_pegawai is 'Master data pegawai.';

-- User Estim (*User = PK)
create table public.user_estim (
  username     text primary key,
  display      text,
  nip_pemegang text references public.data_pegawai(nip)
               on update cascade on delete set null,
  keterangan   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
comment on table public.user_estim is 'Akun Estim, dipegang oleh satu pegawai (data_pegawai).';

-- ---------------------------------------------------------------------
-- 4. INVENTARIS PERANGKAT
-- ---------------------------------------------------------------------

-- PC (komputer & laptop) — tidak ada tanda * -> PK surrogate UUID
create table public.pc (
  id                      uuid primary key default gen_random_uuid(),
  hostname                text unique,              -- contoh: D09PC99201
  ip                      inet,
  mac_address             macaddr,
  gateway                 inet,
  merk                    text,
  serial_number           text unique,
  windows_version         text,
  windows_version_number  text,
  processor               text,
  ram_mb                  integer,
  storage_type            text check (storage_type in ('HDD', 'SSD', 'NVMe')),
  storage_size_gb         integer,
  tahun_pembelian         integer,
  nip_pengguna            text references public.data_pegawai(nip)
                          on update cascade on delete set null,
  perlu_peremajaan        boolean not null default false,
  keterangan              text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
comment on table public.pc is 'Inventaris komputer & laptop.';

-- Printer
create table public.printer (
  id              uuid primary key default gen_random_uuid(),
  jenis           text check (jenis in ('Printer', 'Passbook', 'Printer Besar', 'Lainnya')),
  merk_type       text,
  serial_number   text unique,
  tahun_pembelian integer,
  keterangan      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
comment on table public.printer is 'Inventaris printer.';

-- Wifi (lokasi = teks bebas, tanpa FK)
create table public.wifi (
  id               uuid primary key default gen_random_uuid(),
  ssid             text not null,
  password         text,
  lokasi           text,
  user_router      text,
  password_router  text,
  provider         text,
  id_pelanggan     text,
  bandwidth        text,
  keterangan       text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
comment on table public.wifi is 'Data wifi per lokasi (lokasi disimpan bebas sebagai teks).';

-- ATM (*ID = PK)
create table public.atm (
  id            text primary key,
  nama          text,
  tipe          text check (tipe in ('ATM', 'CRM')),
  merk          text,
  denom         text,
  serial_number text,
  ip_address    inet,
  mac_address   macaddr,
  gateway       inet,
  keterangan    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
comment on table public.atm is 'Inventaris mesin ATM/CRM.';

-- EDC (lokasi = teks bebas, tanpa FK)
create table public.edc (
  id            uuid primary key default gen_random_uuid(),
  mid           text,
  tid           text,
  serial_number text,
  tipe          text check (tipe in ('Pinpad', 'Android')),
  lokasi        text,
  peruntukan    text check (peruntukan in ('Bank Jatim', 'Merchant')),
  pic_nip       text references public.data_pegawai(nip)
                on update cascade on delete set null,
  pic_nama      text,   -- fallback kalau PIC bukan pegawai internal (mis. PIC merchant)
  keterangan    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (mid, tid)
);
comment on table public.edc is 'Inventaris mesin EDC.';

-- ---------------------------------------------------------------------
-- 5. KREDENSIAL / AKUN
-- ---------------------------------------------------------------------

-- User Password IT Support
create table public.user_password_it_support (
  id         uuid primary key default gen_random_uuid(),
  aplikasi   text not null,
  url        text,
  username   text,
  password   text,
  sandi      text,
  keterangan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (aplikasi, username)
);
comment on table public.user_password_it_support is
  'Kredensial berbagai aplikasi. Pertimbangkan enkripsi kolom password/sandi.';

-- Office (*Email = PK)
create table public.office (
  email             text primary key,
  product_key       text,
  password          text,
  jenis             text check (jenis in ('365', 'Retail', 'WPS')),
  tanggal_pembelian date,
  tanggal_expired   date,
  ip_komputer       inet,
  keterangan        text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
comment on table public.office is 'Akun/lisensi Office (365, Retail, atau WPS).';

-- FortiClient (*User = PK)
create table public.forticlient (
  username               text primary key,
  password               text,
  pemegang_nip           text references public.data_pegawai(nip)
                         on update cascade on delete set null,
  tanggal_pengajuan      date,
  tanggal_akhir_akses    date,
  nomor_surat_pengajuan  text,
  keterangan             text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
comment on table public.forticlient is 'Akses VPN FortiClient per pegawai.';

-- ---------------------------------------------------------------------
-- 6. OPERASIONAL
-- ---------------------------------------------------------------------

-- To Do List
create table public.todo_list (
  id         uuid primary key default gen_random_uuid(),
  tanggal    date not null default current_date,
  kegiatan   text not null,
  status     text not null default 'Pending'
             check (status in ('Done', 'Pending', 'Cancelled')),
  keterangan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.todo_list is 'Daftar aktivitas/tugas.';

-- Audit
create table public.audit (
  id                    uuid primary key default gen_random_uuid(),
  jenis_audit           text,
  tahun_audit           integer,
  no_temuan             text,   -- contoh format: "1 5.3 1"
  rekomendasi           text,
  tanggapan             text,
  bulan_komitmen        text,
  status                text not null default 'Pending'
                        check (status in ('Finish', 'Pending')),
  tanggal_tindak_lanjut date,
  keterangan            text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (jenis_audit, tahun_audit, no_temuan)
);
comment on table public.audit is 'Temuan audit & tindak lanjutnya.';

-- ---------------------------------------------------------------------
-- 7. INDEXES tambahan pada kolom FK (PK & UNIQUE sudah otomatis ter-index)
-- ---------------------------------------------------------------------
create index idx_pc_nip_pengguna            on public.pc (nip_pengguna);
create index idx_user_estim_nip_pemegang    on public.user_estim (nip_pemegang);
create index idx_edc_pic_nip                on public.edc (pic_nip);
create index idx_forticlient_pemegang_nip   on public.forticlient (pemegang_nip);

-- ---------------------------------------------------------------------
-- 8. TRIGGER updated_at untuk semua tabel (dibuat sekaligus lewat DO block)
-- ---------------------------------------------------------------------
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'data_pegawai', 'user_estim',
    'pc', 'printer', 'wifi', 'atm', 'edc',
    'user_password_it_support', 'office', 'forticlient',
    'todo_list', 'audit'
  ]
  loop
    execute format(
      'create trigger trg_set_updated_at
         before update on public.%I
         for each row execute function public.set_updated_at();',
      tbl
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
-- Aplikasi personal: siapapun yang berhasil login (authenticated) punya
-- akses penuh; role 'anon' tidak dapat akses sama sekali (default deny
-- begitu RLS diaktifkan tanpa policy untuk anon). Kalau nanti aplikasi
-- dipakai bareng-bareng, ganti "using (true)" jadi filter berdasarkan
-- public.profiles.role.
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'data_pegawai', 'user_estim',
    'pc', 'printer', 'wifi', 'atm', 'edc',
    'user_password_it_support', 'office', 'forticlient',
    'todo_list', 'audit'
  ]
  loop
    execute format('alter table public.%I enable row level security;', tbl);
    execute format(
      'create policy %I on public.%I
         for all to authenticated
         using (true) with check (true);',
      tbl || '_authenticated_full_access', tbl
    );
  end loop;
end $$;

-- profiles: user hanya boleh lihat/ubah profil dirinya sendiri
alter table public.profiles enable row level security;

create policy profiles_select_own
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy profiles_update_own
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------
-- 10. VIEWS BANTUAN
-- ---------------------------------------------------------------------

create or replace view public.v_todo_pending as
select *
from public.todo_list
where status = 'Pending'
order by tanggal asc;

comment on view public.v_todo_pending is 'To do list yang masih Pending, diurutkan dari yang paling lama.';

create or replace view public.v_upcoming_expirations as
select
  'office' as sumber,
  email    as identitas,
  tanggal_expired as tanggal_akhir,
  keterangan
from public.office
where tanggal_expired is not null
union all
select
  'forticlient'         as sumber,
  username              as identitas,
  tanggal_akhir_akses   as tanggal_akhir,
  keterangan
from public.forticlient
where tanggal_akhir_akses is not null;

comment on view public.v_upcoming_expirations is
  'Gabungan tanggal kedaluwarsa Office & FortiClient, dipakai oleh get_upcoming_expirations().';

-- ---------------------------------------------------------------------
-- 11. FUNCTIONS: monitoring
-- ---------------------------------------------------------------------

create or replace function public.get_upcoming_expirations(days_ahead integer default 30)
returns table (
  sumber        text,
  identitas     text,
  tanggal_akhir date,
  sisa_hari     integer,
  keterangan    text
)
language sql
stable
as $$
  select
    sumber,
    identitas,
    tanggal_akhir,
    (tanggal_akhir - current_date)::integer as sisa_hari,
    keterangan
  from public.v_upcoming_expirations
  where tanggal_akhir between current_date and (current_date + days_ahead)
  order by tanggal_akhir asc;
$$;

comment on function public.get_upcoming_expirations is
  'Contoh pakai: select * from public.get_upcoming_expirations(14);';

-- ---------------------------------------------------------------------
-- 12. FUNCTIONS: dipakai aplikasi (RPC lewat supabase.rpc(...))
-- ---------------------------------------------------------------------
-- Catatan: operasi CRUD dasar (insert/select/update/delete per baris)
-- SUDAH otomatis tersedia lewat REST API Supabase (supabase-js:
-- .from('tabel').insert/select/update/delete()), dan sudah dilindungi
-- RLS di bagian 9. Function di bawah ini untuk kebutuhan di ATAS CRUD
-- polos: data gabungan, pencarian, dan ringkasan dashboard.

-- Detail satu PC lengkap dengan nama & jabatan penggunanya
create or replace function public.get_pc_detail(p_id uuid)
returns table (
  id                uuid,
  hostname          text,
  merk              text,
  serial_number     text,
  nip_pengguna      text,
  nama_pengguna     text,
  jabatan_pengguna  text,
  perlu_peremajaan  boolean,
  keterangan        text
)
language sql
stable
as $$
  select
    pc.id, pc.hostname, pc.merk, pc.serial_number,
    pc.nip_pengguna, dp.nama, dp.jabatan,
    pc.perlu_peremajaan, pc.keterangan
  from public.pc
  left join public.data_pegawai dp on dp.nip = pc.nip_pengguna
  where pc.id = p_id;
$$;

-- Pencarian cepat lintas tabel inventaris (untuk search bar di app)
create or replace function public.search_inventory(keyword text)
returns table (
  sumber      text,
  id          text,
  judul       text,
  keterangan  text
)
language sql
stable
as $$
  select 'pc', id::text, coalesce(hostname, merk, serial_number, id::text), keterangan
  from public.pc
  where hostname ilike '%' || keyword || '%'
     or merk ilike '%' || keyword || '%'
     or serial_number ilike '%' || keyword || '%'
  union all
  select 'printer', id::text, coalesce(merk_type, serial_number, id::text), keterangan
  from public.printer
  where merk_type ilike '%' || keyword || '%'
     or serial_number ilike '%' || keyword || '%'
  union all
  select 'atm', id, coalesce(nama, id), keterangan
  from public.atm
  where id ilike '%' || keyword || '%'
     or nama ilike '%' || keyword || '%'
  union all
  select 'edc', id::text, coalesce(mid, tid, id::text), keterangan
  from public.edc
  where mid ilike '%' || keyword || '%'
     or tid ilike '%' || keyword || '%'
  union all
  select 'wifi', id::text, ssid, keterangan
  from public.wifi
  where ssid ilike '%' || keyword || '%'
  limit 50;
$$;

-- Ringkasan angka untuk dashboard app
create or replace function public.get_dashboard_summary()
returns table (
  total_pc             bigint,
  pc_perlu_peremajaan  bigint,
  todo_pending         bigint,
  audit_pending        bigint,
  expiring_30_hari     bigint
)
language sql
stable
as $$
  select
    (select count(*) from public.pc),
    (select count(*) from public.pc where perlu_peremajaan),
    (select count(*) from public.todo_list where status = 'Pending'),
    (select count(*) from public.audit where status = 'Pending'),
    (select count(*) from public.get_upcoming_expirations(30));
$$;

-- Tandai satu todo sebagai selesai (contoh RPC "write" sederhana)
create or replace function public.mark_todo_done(p_id uuid)
returns public.todo_list
language sql
as $$
  update public.todo_list
  set status = 'Done'
  where id = p_id
  returning *;
$$;

-- =====================================================================
-- SELESAI
-- =====================================================================
