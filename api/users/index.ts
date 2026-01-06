import bcrypt from 'bcryptjs';
import { query } from '../lib/db';
import { verifyToken, isAdmin } from '../lib/auth';

export default async function handler(req: any, res: any) {
    try {
        const user = verifyToken(req);

        if (req.method === 'GET') {
            if (!isAdmin(user)) return res.status(403).json({ message: 'Forbidden' });
            const { id } = req.query;

            if (id) {
                const result = await query(
                    'SELECT id, email, name, role, position, school, phone, is_active, last_login_at, created_at FROM users WHERE id = $1 AND deleted_at IS NULL',
                    [id]
                );
                return res.status(200).json(result.rows[0]);
            }

            const result = await query(
                'SELECT id, email, name, role, position, school, phone, is_active, last_login_at, created_at FROM users WHERE deleted_at IS NULL ORDER BY name ASC'
            );
            return res.status(200).json(result.rows);
        }

        if (req.method === 'POST') {
            if (!isAdmin(user)) return res.status(403).json({ message: 'Forbidden' });
            const { email, password, name, school, role, position, phone } = req.body;

            if (!email || !name) {
                return res.status(400).json({ message: 'Missing required fields' });
            }

            const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
            if (existing.rows.length > 0) {
                return res.status(400).json({ message: 'Email sudah terdaftar' });
            }

            const rawPassword = password && password.length > 0 ? password : 'password123';
            const password_hash = await bcrypt.hash(rawPassword, 10);

            const result = await query(
                `INSERT INTO users (email, password_hash, name, school, role, position, phone)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING id, email, name, role, position, school, phone, is_active`,
                [email, password_hash, name, school, role || 'anggota', position, phone]
            );

            return res.status(201).json(result.rows[0]);
        }

        if (req.method === 'PUT') {
            if (!isAdmin(user)) return res.status(403).json({ message: 'Forbidden' });
            const { id } = req.query;
            const { name, role, position, school, phone, is_active } = req.body;

            const result = await query(
                `UPDATE users SET 
          name = COALESCE($1, name), 
          role = COALESCE($2, role),
          position = COALESCE($3, position),
          school = COALESCE($4, school),
          phone = COALESCE($5, phone),
          is_active = COALESCE($6, is_active),
          updated_at = now()
         WHERE id = $7 AND deleted_at IS NULL RETURNING id, email, name, role, position, school, phone, is_active`,
                [name, role, position, school, phone, is_active, id]
            );
            return res.status(200).json(result.rows[0]);
        }

        if (req.method === 'DELETE') {
            if (!isAdmin(user)) return res.status(403).json({ message: 'Forbidden' });
            const { id } = req.query;
            // Soft delete
            await query('UPDATE users SET deleted_at = now(), is_active = false WHERE id = $1', [id]);
            return res.status(204).end();
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error: any) {
        console.error('Users API error:', error);
        return res.status(error.message === 'Unauthorized' ? 401 : 500).json({ message: error.message });
    }
}
