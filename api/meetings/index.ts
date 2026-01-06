import { query } from '../lib/db';
import { verifyToken, isSekretarisOrAdmin } from '../lib/auth';

export default async function handler(req: any, res: any) {
    try {
        const user = verifyToken(req);

        if (req.method === 'GET') {
            const { type, id } = req.query;

            if (id) {
                const result = await query(
                    `SELECT m.*, u.name as created_by_name, a.title as activity_title
                     FROM meetings m
                     LEFT JOIN users u ON m.created_by = u.id
                     LEFT JOIN activities a ON m.activity_id = a.id
                     WHERE m.id = $1 AND m.deleted_at IS NULL`,
                    [id]
                );
                return res.status(200).json(result.rows[0]);
            }

            let sql = `
        SELECT m.*, u.name as created_by_name, a.title as activity_title
        FROM meetings m
        LEFT JOIN users u ON m.created_by = u.id
        LEFT JOIN activities a ON m.activity_id = a.id
        WHERE m.deleted_at IS NULL
      `;
            const params = [];

            if (type) {
                sql += ` AND m.meeting_type = $1`;
                params.push(type);
            }

            sql += ` ORDER BY m.date DESC`;

            const result = await query(sql, params);
            return res.status(200).json(result.rows);
        }

        if (req.method === 'POST') {
            if (!isSekretarisOrAdmin(user)) return res.status(403).json({ message: 'Forbidden' });
            const { title, date, start_time, end_time, location, agenda, notes, meeting_type, activity_id } = req.body;
            if (!activity_id) {
                return res.status(400).json({ message: 'Activity is required for notulen' });
            }
            const result = await query(
                `INSERT INTO meetings (title, date, start_time, end_time, location, agenda, notes, meeting_type, activity_id, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
                [title, date, start_time, end_time, location, agenda, notes, meeting_type, activity_id, user.userId]
            );
            return res.status(201).json(result.rows[0]);
        }

        if (req.method === 'PUT') {
            if (!isSekretarisOrAdmin(user)) return res.status(403).json({ message: 'Forbidden' });
            const { id } = req.query;
            const { title, date, start_time, end_time, location, agenda, notes, meeting_type, activity_id } = req.body;
            const result = await query(
                `UPDATE meetings SET 
          title = COALESCE($1, title), 
          date = COALESCE($2, date),
          start_time = COALESCE($3, start_time),
          end_time = COALESCE($4, end_time),
          location = COALESCE($5, location),
          agenda = COALESCE($6, agenda),
          notes = COALESCE($7, notes),
          meeting_type = COALESCE($8, meeting_type),
          activity_id = COALESCE($9, activity_id),
          updated_at = now()
         WHERE id = $10 AND deleted_at IS NULL RETURNING *`,
                [title, date, start_time, end_time, location, agenda, notes, meeting_type, activity_id, id]
            );
            return res.status(200).json(result.rows[0]);
        }

        if (req.method === 'DELETE') {
            if (!isSekretarisOrAdmin(user)) return res.status(403).json({ message: 'Forbidden' });
            const { id } = req.query;
            await query('UPDATE meetings SET deleted_at = now() WHERE id = $1', [id]);
            return res.status(204).end();
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error: any) {
        console.error('Meetings API error:', error);
        return res.status(error.message === 'Unauthorized' ? 401 : 500).json({ message: error.message });
    }
}
