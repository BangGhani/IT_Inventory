// Database types derived from supabase_schema.sql

export interface DataPegawai {
  nip: string;
  nama: string;
  jabatan: string | null;
  unit_kerja: string | null;
  keterangan: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserEstim {
  username: string;
  display: string | null;
  nip_pemegang: string | null;
  keterangan: string | null;
  created_at: string;
  updated_at: string;
}

export interface PC {
  id: string;
  hostname: string | null;
  ip: string | null;
  mac_address: string | null;
  gateway: string | null;
  merk: string | null;
  serial_number: string | null;
  windows_version: string | null;
  windows_version_number: string | null;
  processor: string | null;
  ram_mb: number | null;
  storage_type: "HDD" | "SSD" | "NVMe" | null;
  storage_size_gb: number | null;
  tahun_pembelian: number | null;
  nip_pengguna: string | null;
  perlu_peremajaan: boolean;
  keterangan: string | null;
  created_at: string;
  updated_at: string;
}

export interface Printer {
  id: string;
  jenis: "Printer" | "Passbook" | "Printer Besar" | "Lainnya" | null;
  merk_type: string | null;
  serial_number: string | null;
  tahun_pembelian: number | null;
  keterangan: string | null;
  created_at: string;
  updated_at: string;
}

export interface Wifi {
  id: string;
  ssid: string;
  password: string | null;
  lokasi: string | null;
  user_router: string | null;
  password_router: string | null;
  provider: string | null;
  id_pelanggan: string | null;
  bandwidth: string | null;
  keterangan: string | null;
  created_at: string;
  updated_at: string;
}

export interface ATM {
  id: string;
  nama: string | null;
  tipe: "ATM" | "CRM" | null;
  merk: string | null;
  denom: string | null;
  serial_number: string | null;
  ip_address: string | null;
  mac_address: string | null;
  gateway: string | null;
  keterangan: string | null;
  created_at: string;
  updated_at: string;
}

export interface EDC {
  id: string;
  mid: string | null;
  tid: string | null;
  serial_number: string | null;
  tipe: "Pinpad" | "Android" | null;
  lokasi: string | null;
  peruntukan: "Bank Jatim" | "Merchant" | null;
  pic_nip: string | null;
  pic_nama: string | null;
  keterangan: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPasswordITSupport {
  id: string;
  aplikasi: string;
  url: string | null;
  username: string | null;
  password: string | null;
  sandi: string | null;
  keterangan: string | null;
  created_at: string;
  updated_at: string;
}

export interface Office {
  email: string;
  product_key: string | null;
  password: string | null;
  jenis: "365" | "Retail" | "WPS" | null;
  tanggal_pembelian: string | null;
  tanggal_expired: string | null;
  ip_komputer: string | null;
  keterangan: string | null;
  created_at: string;
  updated_at: string;
}

export interface FortiClient {
  username: string;
  password: string | null;
  pemegang_nip: string | null;
  tanggal_pengajuan: string | null;
  tanggal_akhir_akses: string | null;
  nomor_surat_pengajuan: string | null;
  keterangan: string | null;
  created_at: string;
  updated_at: string;
}

export interface TodoList {
  id: string;
  tanggal: string;
  kegiatan: string;
  status: "Done" | "Pending" | "Cancelled";
  keterangan: string | null;
  created_at: string;
  updated_at: string;
}

export interface Audit {
  id: string;
  jenis_audit: string | null;
  tahun_audit: number | null;
  no_temuan: string | null;
  rekomendasi: string | null;
  tanggapan: string | null;
  bulan_komitmen: string | null;
  status: "Finish" | "Pending";
  tanggal_tindak_lanjut: string | null;
  keterangan: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardSummary {
  total_pc: number;
  pc_perlu_peremajaan: number;
  todo_pending: number;
  audit_pending: number;
  expiring_30_hari: number;
}

export interface UpcomingExpiration {
  sumber: string;
  identitas: string;
  tanggal_akhir: string;
  sisa_hari: number;
  keterangan: string | null;
}

export interface SearchResult {
  sumber: string;
  id: string;
  judul: string;
  keterangan: string | null;
}

// Table name to type mapping
export interface TableMap {
  data_pegawai: DataPegawai;
  user_estim: UserEstim;
  pc: PC;
  printer: Printer;
  wifi: Wifi;
  atm: ATM;
  edc: EDC;
  user_password_it_support: UserPasswordITSupport;
  office: Office;
  forticlient: FortiClient;
  todo_list: TodoList;
  audit: Audit;
}

export type TableName = keyof TableMap;
