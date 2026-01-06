import { query } from '../lib/db';
import { verifyToken, isAdmin } from '../lib/auth';

export default async function handler(req: any, res: any) {
    try {
        const user = verifyToken(req);

        if (req.method === 'GET') {
            const result = await query(
                `SELECT g.*, a.title as activity_title
                 FROM gallery g
                 LEFT JOIN activities a ON g.activity_id = a.id
                 WHERE g.deleted_at IS NULL
                 ORDER BY g.uploaded_at DESC`
            );
            return res.status(200).json(result.rows);
        }

        if (req.method === 'POST') {
            if (!isAdmin(user)) return res.status(403).json({ message: 'Forbidden' });
            const { title, description, file_url, activity_id } = req.body;
            const result = await query(
                'INSERT INTO gallery (title, description, file_url, activity_id, uploaded_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [title, description, file_url, activity_id || null, user.userId]
            );
            return res.status(201).json(result.rows[0]);
        }

        if (req.method === 'DELETE') {
            if (!isAdmin(user)) return res.status(403).json({ message: 'Forbidden' });
            const { id } = req.query;
            await query('UPDATE gallery SET deleted_at = now() WHERE id = $1', [id]);
            return res.status(204).end();
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error: any) {
        console.error('Gallery API error:', error);
        return res.status(error.message === 'Unauthorized' ? 401 : 500).json({ message: error.message });
    }
}
