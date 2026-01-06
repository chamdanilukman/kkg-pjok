-- Database Schema Update - KKG PJOK
-- Menambahkan tabel iuran dan role bendahara/sekretaris

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing types and recreate with new roles
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('admin', 'bendahara', 'sekretaris', 'anggota');

-- Drop and recreate other types
DROP TYPE IF EXISTS transaction_type CASCADE;
CREATE TYPE transaction_type AS ENUM ('income', 'expense');

DROP TYPE IF EXISTS file_type CASCADE;
CREATE TYPE file_type AS ENUM ('image', 'video', 'document');

DROP TYPE IF EXISTS activity_status CASCADE;
CREATE TYPE activity_status AS ENUM ('draft', 'active', 'completed', 'cancelled');

-- Users table
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(name) >= 2),
  email text UNIQUE NOT NULL CHECK (length(email) >= 5),
  password_hash text NOT NULL CHECK (length(password_hash) >= 60),
  role user_role DEFAULT 'anggota',
  position text,
  school text,
  phone text CHECK (phone ~ '^[0-9+\-\s()]+$'),
  avatar_url text,
  is_active boolean DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Activities table
DROP TABLE IF EXISTS activities CASCADE;
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (length(title) >= 5),
  description text,
  date date NOT NULL CHECK (date >= CURRENT_DATE - INTERVAL '1 year'),
  time time NOT NULL,
  location text NOT NULL CHECK (length(location) >= 3),
  qr_code text UNIQUE NOT NULL,
  status activity_status DEFAULT 'draft',
  max_participants integer CHECK (max_participants > 0),
  registration_deadline timestamptz,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Attendance table
DROP TABLE IF EXISTS attendance CASCADE;
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid REFERENCES activities(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  attended_at timestamptz DEFAULT now(),
  check_in_method text DEFAULT 'qr_code' CHECK (check_in_method IN ('qr_code', 'manual')),
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(activity_id, user_id)
);

-- Meetings table
DROP TABLE IF EXISTS meetings CASCADE;
CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (length(title) >= 5),
  date date NOT NULL,
  start_time time,
  end_time time,
  location text,
  agenda text,
  notes text,
  meeting_type text DEFAULT 'regular' CHECK (meeting_type IN ('regular', 'emergency', 'planning', 'evaluation')),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  CHECK (end_time IS NULL OR end_time > start_time)
);

-- Meeting attendees
DROP TABLE IF EXISTS meeting_attendees CASCADE;
CREATE TABLE IF NOT EXISTS meeting_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid REFERENCES meetings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  attendance_status text DEFAULT 'present' CHECK (attendance_status IN ('present', 'absent', 'late')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(meeting_id, user_id)
);

-- Gallery table
DROP TABLE IF EXISTS gallery CASCADE;
CREATE TABLE IF NOT EXISTS gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (length(title) >= 3),
  description text,
  file_url text NOT NULL,
  file_type file_type DEFAULT 'image',
  file_size bigint CHECK (file_size > 0),
  activity_id uuid REFERENCES activities(id) ON DELETE SET NULL,
  uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL,
  is_featured boolean DEFAULT false,
  uploaded_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Transactions table
DROP TABLE IF EXISTS transactions CASCADE;
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL CHECK (length(description) >= 5),
  amount decimal(15,2) NOT NULL CHECK (amount > 0),
  type transaction_type NOT NULL,
  category text NOT NULL DEFAULT 'Umum',
  date date NOT NULL CHECK (date <= CURRENT_DATE),
  receipt_url text,
  approved_by uuid REFERENCES users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Activity registrations
DROP TABLE IF EXISTS activity_registrations CASCADE;
CREATE TABLE IF NOT EXISTS activity_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid REFERENCES activities(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  registered_at timestamptz DEFAULT now(),
  status text DEFAULT 'registered' CHECK (status IN ('registered', 'cancelled', 'waitlist')),
  notes text,
  UNIQUE(activity_id, user_id)
);

-- Audit logs
DROP TABLE IF EXISTS audit_logs CASCADE;
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values jsonb,
  new_values jsonb,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- ===== IURAN TABLES =====

-- Iuran Config - Setting nominal iuran per tahun
DROP TABLE IF EXISTS iuran_config CASCADE;
CREATE TABLE IF NOT EXISTS iuran_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  periode_tahun integer NOT NULL,
  nominal decimal(15,2) NOT NULL CHECK (nominal > 0),
  status text DEFAULT 'aktif' CHECK (status IN ('aktif', 'nonaktif')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE(periode_tahun)
);

-- Pembayaran Iuran - Tracking pembayaran per anggota
DROP TABLE IF EXISTS pembayaran_iuran CASCADE;
CREATE TABLE IF NOT EXISTS pembayaran_iuran (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  periode_tahun integer NOT NULL,
  bulan_dibayar integer[] NOT NULL,  -- Array of months: [1,2,3,4,5,6,7,8,9,10,11,12]
  jumlah decimal(15,2) NOT NULL CHECK (jumlah > 0),
  metode_bayar text DEFAULT 'tunai' CHECK (metode_bayar IN ('tunai', 'transfer', 'lainnya')),
  tanggal_bayar date NOT NULL,
  recorded_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  delete_status text DEFAULT 'active' CHECK (delete_status IN ('active', 'requested', 'approved')),
  delete_requested_by uuid REFERENCES users(id) ON DELETE SET NULL,
  delete_requested_at timestamptz,
  delete_approved_by uuid REFERENCES users(id) ON DELETE SET NULL,
  delete_approved_at timestamptz,
  deleted_at timestamptz
);

-- ===== INDEXES =====

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date);
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
CREATE INDEX IF NOT EXISTS idx_attendance_activity ON attendance(activity_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_pembayaran_iuran_user ON pembayaran_iuran(user_id);
CREATE INDEX IF NOT EXISTS idx_pembayaran_iuran_tahun ON pembayaran_iuran(periode_tahun);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- ===== VIEWS =====

-- View untuk checklist pembayaran iuran
CREATE OR REPLACE VIEW view_checklist_iuran AS
SELECT
  u.id as user_id,
  u.name as nama_anggota,
  u.school as sekolah,
  u.role,
  c.periode_tahun,
  c.nominal as iuran_per_bulan,
  COALESCE(
    (SELECT SUM(COALESCE(p.jumlah, 0))
     FROM pembayaran_iuran p
     WHERE p.user_id = u.id AND p.periode_tahun = c.periode_tahun AND p.deleted_at IS NULL),
    0
  ) as total_dibayar,
  ARRAY(
    SELECT DISTINCT unnest(COALESCE(p.bulan_dibayar, '{}'::integer[]))
    FROM pembayaran_iuran p
    WHERE p.user_id = u.id AND p.periode_tahun = c.periode_tahun AND p.deleted_at IS NULL
    ORDER BY unnest
  ) as bulan_lunas,
  CASE
    WHEN COALESCE(
      (SELECT SUM(COALESCE(p.jumlah, 0))
       FROM pembayaran_iuran p
       WHERE p.user_id = u.id AND p.periode_tahun = c.periode_tahun AND p.deleted_at IS NULL),
      0
    ) >= (c.nominal * 12) THEN 'LUNAS'
    WHEN COALESCE(
      (SELECT SUM(COALESCE(p.jumlah, 0))
       FROM pembayaran_iuran p
       WHERE p.user_id = u.id AND p.periode_tahun = c.periode_tahun AND p.deleted_at IS NULL),
      0
    ) > 0 THEN 'PARTIAL'
    ELSE 'BELUM'
  END as status_pembayaran
FROM users u
CROSS JOIN LATERAL (
  SELECT periode_tahun, nominal
  FROM iuran_config
  WHERE status = 'aktif'
  ORDER BY periode_tahun DESC
  LIMIT 1
) c
WHERE u.deleted_at IS NULL AND u.is_active = true
ORDER BY u.name;

-- View untuk ringkasan keuangan
CREATE OR REPLACE VIEW view_keuangan_ringkasan AS
SELECT
  (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'income' AND deleted_at IS NULL) as total_pemasukan,
  (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'expense' AND deleted_at IS NULL) as total_pengeluaran,
  (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'income' AND deleted_at IS NULL) -
  (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'expense' AND deleted_at IS NULL) as saldo_kas;

-- ===== SAMPLE DATA (OPSIONAL) =====

-- Insert sample iuran config untuk tahun 2025
-- INSERT INTO iuran_config (periode_tahun, nominal, status) VALUES (2025, 150000, 'aktif');
