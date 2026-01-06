import { query } from '../lib/db';
import { verifyToken, isAdmin } from '../lib/auth';

export default async function handler(req: any, res: any) {
    try {
        const user = verifyToken(req);

        if (req.method === 'GET') {
            const { activity_id, user_id } = req.query;
            let sql = `
        SELECT a.*, u.name as user_name, act.title as activity_title
        FROM attendance a
        JOIN users u ON a.user_id = u.id
        JOIN activities act ON a.activity_id = act.id
        WHERE 1=1
      `;
            const params = [];

            if (activity_id) {
                params.push(activity_id);
                sql += ` AND a.activity_id = $${params.length}`;
            }

            if (user_id) {
                params.push(user_id);
                sql += ` AND a.user_id = $${params.length}`;
            }

            sql += ` ORDER BY a.attended_at DESC`;

            const result = await query(sql, params);
            return res.status(200).json(result.rows);
        }

        if (req.method === 'POST') {
            const { activity_id, user_id, check_in_method, notes } = req.body;

            // Users can only mark their own attendance unless they are admin
            if (user_id !== user.userId && !isAdmin(user)) {
                return res.status(403).json({ message: 'Unauthorized to mark attendance for others' });
            }

            const result = await query(
                `INSERT INTO attendance (activity_id, user_id, check_in_method, notes)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (activity_id, user_id) DO UPDATE SET attended_at = now()
         RETURNING *`,
                [activity_id, user_id, check_in_method || 'qr_code', notes]
            );

            return res.status(201).json(result.rows[0]);
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error: any) {
        console.error('Attendance API error:', error);
        return res.status(error.message === 'Unauthorized' ? 401 : 500).json({ message: error.message });
    }
}
