-- Add delete request/approval flow to pembayaran_iuran
ALTER TABLE IF EXISTS pembayaran_iuran
  ADD COLUMN IF NOT EXISTS delete_status text DEFAULT 'active' CHECK (delete_status IN ('active', 'requested', 'approved')),
  ADD COLUMN IF NOT EXISTS delete_requested_by uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS delete_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS delete_approved_by uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS delete_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_pembayaran_iuran_deleted_at ON pembayaran_iuran(deleted_at);

-- Refresh view to ignore deleted payments
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
