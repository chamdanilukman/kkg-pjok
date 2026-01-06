import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Load env
const envPath = join(__dirname, '.env');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) process.env[key.trim()] = value.join('=').trim();
  });
}

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL || process.env.VITE_NEON_URL,
  ssl: { rejectUnauthorized: false }
});

const JWT_SECRET = process.env.JWT_SECRET || process.env.VITE_JWT_SECRET || 'super-secret-key';

// Auth middleware
const verifyToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) throw new Error('Unauthorized');
  const token = authHeader.split(' ')[1];
  return jwt.verify(token, JWT_SECRET);
};

const isAdmin = (user) => user?.role === 'admin';
const isBendaharaOrAdmin = (user) => user?.role === 'admin' || user?.role === 'bendahara';

// ============ AUTH ============
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1 AND is_active = true', [email]);
    if (result.rows.length === 0) return res.status(401).json({ message: 'Email atau password salah' });
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ message: 'Email atau password salah' });

    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name, school, position } = req.body;
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(400).json({ message: 'Email sudah terdaftar' });
    
    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name, school, position, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [email, password_hash, name, school, position, 'anggota']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============ USERS ============
app.get('/api/users/public', async (req, res) => {
  try {
    const { type } = req.query;
    if (type === 'count') {
      const result = await pool.query('SELECT COUNT(*) FROM users WHERE is_active = true');
      return res.json({ count: parseInt(result.rows[0].count) });
    }
    const result = await pool.query('SELECT * FROM users WHERE is_active = true ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const user = verifyToken(req);
    if (!isAdmin(user)) return res.status(403).json({ message: 'Forbidden' });
    const result = await pool.query('SELECT * FROM users WHERE deleted_at IS NULL ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const user = verifyToken(req);
    if (!isAdmin(user)) return res.status(403).json({ message: 'Forbidden' });
    const { email, password, name, school, role, position } = req.body;
    const password_hash = await bcrypt.hash(password || 'password123', 10);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name, school, role, position) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [email, password_hash, name, school, role || 'anggota', position]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/users', async (req, res) => {
  try {
    const user = verifyToken(req);
    if (!isAdmin(user)) return res.status(403).json({ message: 'Forbidden' });
    const { id } = req.query;
    const { name, email, school, role, position, is_active } = req.body;
    const result = await pool.query(
      'UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email), school = COALESCE($3, school), role = COALESCE($4, role), position = COALESCE($5, position), is_active = COALESCE($6, is_active) WHERE id = $7 RETURNING *',
      [name, email, school, role, position, is_active, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/users', async (req, res) => {
  try {
    const user = verifyToken(req);
    if (!isAdmin(user)) return res.status(403).json({ message: 'Forbidden' });
    const { id } = req.query;
    await pool.query('UPDATE users SET deleted_at = now() WHERE id = $1', [id]);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============ ACTIVITIES ============
app.get('/api/activities', async (req, res) => {
  try {
    verifyToken(req);
    const { status } = req.query;
    let sql = `SELECT a.*, u.name as created_by_name, (SELECT count(*) FROM activity_registrations WHERE activity_id = a.id) as registered_count, (SELECT count(*) FROM attendance WHERE activity_id = a.id) as attended_count FROM activities a LEFT JOIN users u ON a.created_by = u.id WHERE a.deleted_at IS NULL`;
    const params = [];
    if (status) { params.push(status); sql += ` AND a.status = $${params.length}`; }
    sql += ' ORDER BY a.date DESC';
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
});

app.post('/api/activities', async (req, res) => {
  try {
    const user = verifyToken(req);
    if (!isAdmin(user)) return res.status(403).json({ message: 'Forbidden' });
    const { title, description, date, time, location, qr_code, status, max_participants } = req.body;
    const result = await pool.query(
      'INSERT INTO activities (title, description, date, time, location, qr_code, status, max_participants, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [title, description, date, time, location, qr_code, status || 'draft', max_participants, user.userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/activities', async (req, res) => {
  try {
    const user = verifyToken(req);
    if (!isAdmin(user)) return res.status(403).json({ message: 'Forbidden' });
    const { id } = req.query;
    const { title, description, date, time, location, qr_code, status, max_participants } = req.body;
    const result = await pool.query(
      'UPDATE activities SET title = COALESCE($1, title), description = COALESCE($2, description), date = COALESCE($3, date), time = COALESCE($4, time), location = COALESCE($5, location), qr_code = COALESCE($6, qr_code), status = COALESCE($7, status), max_participants = COALESCE($8, max_participants), updated_at = now() WHERE id = $9 AND deleted_at IS NULL RETURNING *',
      [title, description, date, time, location, qr_code, status, max_participants, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/activities', async (req, res) => {
  try {
    const user = verifyToken(req);
    if (!isAdmin(user)) return res.status(403).json({ message: 'Forbidden' });
    const { id } = req.query;
    await pool.query('UPDATE activities SET deleted_at = now() WHERE id = $1', [id]);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============ ATTENDANCE ============
app.get('/api/attendance', async (req, res) => {
  try {
    const user = verifyToken(req);
    const { activity_id, user_id } = req.query;
    let sql = 'SELECT a.*, act.title as activity_title FROM attendance a LEFT JOIN activities act ON a.activity_id = act.id WHERE 1=1';
    const params = [];
    if (user_id) { params.push(user_id); sql += ` AND a.user_id = $${params.length}`; }
    if (activity_id) { params.push(activity_id); sql += ` AND a.activity_id = $${params.length}`; }
    sql += ' ORDER BY a.attended_at DESC';
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
});

app.post('/api/attendance', async (req, res) => {
  try {
    const user = verifyToken(req);
    const { activity_id, user_id, check_in_method, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO attendance (activity_id, user_id, check_in_method, notes) VALUES ($1, $2, $3, $4) ON CONFLICT (activity_id, user_id) DO UPDATE SET attended_at = now(), check_in_method = EXCLUDED.check_in_method, notes = EXCLUDED.notes RETURNING *',
      [activity_id, user_id, check_in_method, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============ MEETINGS ============
app.get('/api/meetings', async (req, res) => {
  try {
    verifyToken(req);
    const result = await pool.query('SELECT * FROM meetings WHERE deleted_at IS NULL ORDER BY date DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
});

app.post('/api/meetings', async (req, res) => {
  try {
    const user = verifyToken(req);
    if (!isAdmin(user)) return res.status(403).json({ message: 'Forbidden' });
    const { title, date, start_time, end_time, location, agenda, notes, meeting_type } = req.body;
    const result = await pool.query(
      'INSERT INTO meetings (title, date, start_time, end_time, location, agenda, notes, meeting_type, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [title, date, start_time, end_time, location, agenda, notes, meeting_type || 'regular', user.userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/meetings', async (req, res) => {
  try {
    const user = verifyToken(req);
    if (!isAdmin(user)) return res.status(403).json({ message: 'Forbidden' });
    const { id } = req.query;
    const { title, date, start_time, end_time, location, agenda, notes, meeting_type } = req.body;
    const result = await pool.query(
      'UPDATE meetings SET title = COALESCE($1, title), date = COALESCE($2, date), start_time = COALESCE($3, start_time), end_time = COALESCE($4, end_time), location = COALESCE($5, location), agenda = COALESCE($6, agenda), notes = COALESCE($7, notes), meeting_type = COALESCE($8, meeting_type), updated_at = now() WHERE id = $9 AND deleted_at IS NULL RETURNING *',
      [title, date, start_time, end_time, location, agenda, notes, meeting_type, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/meetings', async (req, res) => {
  try {
    const user = verifyToken(req);
    if (!isAdmin(user)) return res.status(403).json({ message: 'Forbidden' });
    const { id } = req.query;
    await pool.query('UPDATE meetings SET deleted_at = now() WHERE id = $1', [id]);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============ GALLERY ============
app.get('/api/gallery', async (req, res) => {
  try {
    verifyToken(req);
    const result = await pool.query('SELECT * FROM gallery WHERE deleted_at IS NULL ORDER BY uploaded_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
});

app.post('/api/gallery', async (req, res) => {
  try {
    const user = verifyToken(req);
    if (!isAdmin(user)) return res.status(403).json({ message: 'Forbidden' });
    const { title, description, file_url, file_type } = req.body;
    const result = await pool.query(
      'INSERT INTO gallery (title, description, file_url, file_type, uploaded_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, description, file_url, file_type || 'image', user.userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/gallery', async (req, res) => {
  try {
    const user = verifyToken(req);
    if (!isAdmin(user)) return res.status(403).json({ message: 'Forbidden' });
    const { id } = req.query;
    await pool.query('UPDATE gallery SET deleted_at = now() WHERE id = $1', [id]);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============ TRANSACTIONS ============
app.get('/api/transactions', async (req, res) => {
  try {
    verifyToken(req);
    const { category, type } = req.query;
    let sql = 'SELECT t.*, u.name as created_by_name FROM transactions t LEFT JOIN users u ON t.created_by = u.id WHERE t.deleted_at IS NULL';
    const params = [];
    if (category) { params.push(category); sql += ` AND t.category = $${params.length}`; }
    if (type) { params.push(type); sql += ` AND t.type = $${params.length}`; }
    sql += ' ORDER BY t.date DESC';
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const user = verifyToken(req);
    if (!isBendaharaOrAdmin(user)) return res.status(403).json({ message: 'Forbidden' });
    const { description, amount, type, category, date, receipt_url } = req.body;
    const result = await pool.query(
      'INSERT INTO transactions (description, amount, type, category, date, receipt_url, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [description, amount, type, category, date, receipt_url, user.userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/transactions', async (req, res) => {
  try {
    const user = verifyToken(req);
    if (!isBendaharaOrAdmin(user)) return res.status(403).json({ message: 'Forbidden' });
    const { id } = req.query;
    const { description, amount, type, category, date, receipt_url } = req.body;
    const result = await pool.query(
      'UPDATE transactions SET description = COALESCE($1, description), amount = COALESCE($2, amount), type = COALESCE($3, type), category = COALESCE($4, category), date = COALESCE($5, date), receipt_url = COALESCE($6, receipt_url), updated_at = now() WHERE id = $7 AND deleted_at IS NULL RETURNING *',
      [description, amount, type, category, date, receipt_url, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/transactions', async (req, res) => {
  try {
    const user = verifyToken(req);
    if (!isBendaharaOrAdmin(user)) return res.status(403).json({ message: 'Forbidden' });
    const { id } = req.query;
    await pool.query('UPDATE transactions SET deleted_at = now() WHERE id = $1', [id]);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============ IURAN ============
app.get('/api/iuran/config', async (req, res) => {
  try {
    verifyToken(req);
    const { tahun, status } = req.query;
    let sql = 'SELECT * FROM iuran_config WHERE deleted_at IS NULL';
    const params = [];
    if (tahun) { params.push(tahun); sql += ` AND periode_tahun = $${params.length}`; }
    if (status) { params.push(status); sql += ` AND status = $${params.length}`; }
    sql += ' ORDER BY periode_tahun DESC';
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
});

app.post('/api/iuran/config', async (req, res) => {
  try {
    const user = verifyToken(req);
    if (!isBendaharaOrAdmin(user)) return res.status(403).json({ message: 'Forbidden' });
    const { periode_tahun, nominal, status } = req.body;
    const result = await pool.query(
      `INSERT INTO iuran_config (periode_tahun, nominal, status) VALUES ($1, $2, $3) ON CONFLICT (periode_tahun) DO UPDATE SET nominal = EXCLUDED.nominal, status = EXCLUDED.status, updated_at = now() RETURNING *`,
      [periode_tahun, nominal, status || 'aktif']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/iuran/config', async (req, res) => {
  try {
    const user = verifyToken(req);
    if (!isBendaharaOrAdmin(user)) return res.status(403).json({ message: 'Forbidden' });
    const { id } = req.query;
    const { periode_tahun, nominal, status } = req.body;
    const result = await pool.query(
      'UPDATE iuran_config SET periode_tahun = COALESCE($1, periode_tahun), nominal = COALESCE($2, nominal), status = COALESCE($3, status), updated_at = now() WHERE id = $4 AND deleted_at IS NULL RETURNING *',
      [periode_tahun, nominal, status, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/iuran/config', async (req, res) => {
  try {
    const user = verifyToken(req);
    if (!isAdmin(user)) return res.status(403).json({ message: 'Forbidden' });
    const { id } = req.query;
    await pool.query('UPDATE iuran_config SET deleted_at = now() WHERE id = $1', [id]);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/iuran/pembayaran', async (req, res) => {
  try {
    verifyToken(req);
    const { tahun, user_id } = req.query;
    let sql = `SELECT p.*, u.name as user_name, r.name as recorded_by_name, dr.name as delete_requested_by_name, da.name as delete_approved_by_name FROM pembayaran_iuran p LEFT JOIN users u ON p.user_id = u.id LEFT JOIN users r ON p.recorded_by = r.id LEFT JOIN users dr ON p.delete_requested_by = dr.id LEFT JOIN users da ON p.delete_approved_by = da.id WHERE p.deleted_at IS NULL`;
    const params = [];
    if (tahun) { params.push(tahun); sql += ` AND p.periode_tahun = $${params.length}`; }
    if (user_id) { params.push(user_id); sql += ` AND p.user_id = $${params.length}`; }
    sql += ' ORDER BY p.tanggal_bayar DESC, p.created_at DESC';
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
});

app.post('/api/iuran/pembayaran', async (req, res) => {
  try {
    const user = verifyToken(req);
    if (!isBendaharaOrAdmin(user)) return res.status(403).json({ message: 'Forbidden' });
    const { user_id, periode_tahun, bulan_dibayar, jumlah, metode_bayar, tanggal_bayar } = req.body;
    const result = await pool.query(
      'INSERT INTO pembayaran_iuran (user_id, periode_tahun, bulan_dibayar, jumlah, metode_bayar, tanggal_bayar, recorded_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [user_id, periode_tahun, bulan_dibayar, jumlah, metode_bayar || 'tunai', tanggal_bayar, user.userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/iuran/pembayaran', async (req, res) => {
  try {
    const user = verifyToken(req);
    if (!isBendaharaOrAdmin(user)) return res.status(403).json({ message: 'Forbidden' });
    const { id } = req.query;
    const { action } = req.query;
    const { user_id, periode_tahun, bulan_dibayar, jumlah, metode_bayar, tanggal_bayar } = req.body;

    if (action === 'request_delete') {
      if (user.role !== 'bendahara') return res.status(403).json({ message: 'Only bendahara can request deletion' });
      const result = await pool.query(
        `UPDATE pembayaran_iuran SET delete_status = 'requested', delete_requested_by = $1, delete_requested_at = now()
         WHERE id = $2 AND deleted_at IS NULL AND delete_status = 'active' RETURNING *`,
        [user.userId, id]
      );
      if (result.rows.length === 0) return res.status(400).json({ message: 'Delete request already exists or record not found' });
      return res.json(result.rows[0]);
    }

    if (action === 'approve_delete') {
      if (!isAdmin(user)) return res.status(403).json({ message: 'Forbidden' });
      const existing = await pool.query('SELECT delete_status FROM pembayaran_iuran WHERE id = $1 AND deleted_at IS NULL', [id]);
      if (existing.rows.length === 0) return res.status(404).json({ message: 'Not found' });
      if (existing.rows[0].delete_status !== 'requested') return res.status(400).json({ message: 'Delete request is required before approval' });
      const result = await pool.query(
        `UPDATE pembayaran_iuran SET delete_status = 'approved', delete_approved_by = $1, delete_approved_at = now(), deleted_at = now()
         WHERE id = $2 AND deleted_at IS NULL RETURNING *`,
        [user.userId, id]
      );
      return res.json(result.rows[0]);
    }
    const result = await pool.query(
      'UPDATE pembayaran_iuran SET user_id = COALESCE($1, user_id), periode_tahun = COALESCE($2, periode_tahun), bulan_dibayar = COALESCE($3, bulan_dibayar), jumlah = COALESCE($4, jumlah), metode_bayar = COALESCE($5, metode_bayar), tanggal_bayar = COALESCE($6, tanggal_bayar) WHERE id = $7 RETURNING *',
      [user_id, periode_tahun, bulan_dibayar, jumlah, metode_bayar, tanggal_bayar, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/iuran/pembayaran', async (req, res) => {
  try {
    res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/iuran/checklist', async (req, res) => {
  try {
    verifyToken(req);
    const { tahun } = req.query;
    const currentYear = tahun || new Date().getFullYear();
    const result = await pool.query(`
      SELECT
        u.id as user_id,
        u.name as nama_anggota,
        u.school as sekolah,
        u.role,
        $1 as periode_tahun,
        (SELECT nominal FROM iuran_config WHERE periode_tahun = $1 AND status = 'aktif' LIMIT 1) as iuran_per_bulan,
        COALESCE((SELECT SUM(p.jumlah) FROM pembayaran_iuran p WHERE p.user_id = u.id AND p.periode_tahun = $1), 0) as total_dibayar,
        ARRAY(SELECT DISTINCT unnest(COALESCE(p.bulan_dibayar, '{}'::integer[])) FROM pembayaran_iuran p WHERE p.user_id = u.id AND p.periode_tahun = $1 ORDER BY unnest) as bulan_lunas,
        CASE
          WHEN COALESCE((SELECT SUM(p.jumlah) FROM pembayaran_iuran p WHERE p.user_id = u.id AND p.periode_tahun = $1), 0) >= (SELECT (nominal * 12) FROM iuran_config WHERE periode_tahun = $1 AND status = 'aktif' LIMIT 1) THEN 'LUNAS'
          WHEN COALESCE((SELECT SUM(p.jumlah) FROM pembayaran_iuran p WHERE p.user_id = u.id AND p.periode_tahun = $1), 0) > 0 THEN 'PARTIAL'
          ELSE 'BELUM'
        END as status_pembayaran
      FROM users u
      WHERE u.deleted_at IS NULL AND u.is_active = true
      ORDER BY u.name
    `, [currentYear]);
    res.json(result.rows);
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
});

// Serve static files from dist folder (for production)
const distPath = join(__dirname, 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  
  // Handle SPA routing - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(join(distPath, 'index.html'));
    }
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
