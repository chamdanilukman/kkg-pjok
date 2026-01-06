import { query } from '../lib/db';
import { verifyToken, isAdmin, isSekretarisOrAdmin } from '../lib/auth';

export default async function handler(req: any, res: any) {
    try {
        const user = verifyToken(req);

        if (req.method === 'GET') {
            const { status, id } = req.query;

            if (id) {
                const result = await query(
                    'SELECT a.*, u.name as created_by_name FROM activities a LEFT JOIN users u ON a.created_by = u.id WHERE a.id = $1 AND a.deleted_at IS NULL',
                    [id]
                );
                return res.status(200).json(result.rows[0]);
            }

            let sql = `
        SELECT a.*, u.name as created_by_name,
        (SELECT count(*) FROM activity_registrations WHERE activity_id = a.id) as registered_count,
        (SELECT count(*) FROM attendance WHERE activity_id = a.id) as attended_count
        FROM activities a
        LEFT JOIN users u ON a.created_by = u.id
        WHERE a.deleted_at IS NULL
      `;
            const params: any[] = [];

            if (status) {
                sql += ` AND a.status = $1`;
                params.push(status);
            }

            sql += ` ORDER BY a.date DESC`;

            const result = await query(sql, params);
            return res.status(200).json(result.rows);
        }

        if (req.method === 'POST') {
            if (!isSekretarisOrAdmin(user)) return res.status(403).json({ message: 'Forbidden' });
            const { title, description, date, time, location, qr_code, status, max_participants, registration_deadline } = req.body;
            const result = await query(
                `INSERT INTO activities (title, description, date, time, location, qr_code, status, max_participants, registration_deadline, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
                [title, description, date, time, location, qr_code, status || 'draft', max_participants, registration_deadline, user.userId]
            );
            return res.status(201).json(result.rows[0]);
        }

        if (req.method === 'PUT') {
            if (!isSekretarisOrAdmin(user)) return res.status(403).json({ message: 'Forbidden' });
            const { id } = req.query;
            const { title, description, date, time, location, qr_code, status, max_participants, registration_deadline } = req.body;
            const result = await query(
                `UPDATE activities SET 
          title = COALESCE($1, title), 
          description = COALESCE($2, description),
          date = COALESCE($3, date),
          time = COALESCE($4, time),
          location = COALESCE($5, location),
          qr_code = COALESCE($6, qr_code),
          status = COALESCE($7, status),
          max_participants = COALESCE($8, max_participants),
          registration_deadline = COALESCE($9, registration_deadline),
          updated_at = now()
         WHERE id = $10 AND deleted_at IS NULL RETURNING *`,
                [title, description, date, time, location, qr_code, status, max_participants, registration_deadline, id]
            );
            return res.status(200).json(result.rows[0]);
        }

        if (req.method === 'DELETE') {
            if (!isSekretarisOrAdmin(user)) return res.status(403).json({ message: 'Forbidden' });
            const { id } = req.query;
            await query('UPDATE activities SET deleted_at = now() WHERE id = $1', [id]);
            return res.status(204).end();
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error: any) {
        console.error('Activities API error:', error);
        return res.status(error.message === 'Unauthorized' ? 401 : 500).json({ message: error.message });
    }
}
