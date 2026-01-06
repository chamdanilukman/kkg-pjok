import { query } from '../lib/db';
import { verifyToken, isAdmin } from '../lib/auth';

export default async function handler(req: any, res: any) {
    try {
        const user = verifyToken(req);

        if (req.method === 'GET') {
            const { activity_id } = req.query;
            const result = await query(
                'SELECT r.*, u.name as user_name, u.school FROM activity_registrations r JOIN users u ON r.user_id = u.id WHERE r.activity_id = $1',
                [activity_id]
            );
            return res.status(200).json(result.rows);
        }

        if (req.method === 'POST') {
            const { activity_id, user_id, notes } = req.body;

            // Auto-use current user if not provided
            const targetUserId = user_id || user.userId;

            // Duplicate check
            const existing = await query(
                'SELECT id FROM activity_registrations WHERE activity_id = $1 AND user_id = $2',
                [activity_id, targetUserId]
            );

            if (existing.rows.length > 0) {
                return res.status(400).json({ message: 'Already registered' });
            }

            const result = await query(
                'INSERT INTO activity_registrations (activity_id, user_id, notes) VALUES ($1, $2, $3) RETURNING *',
                [activity_id, targetUserId, notes]
            );

            return res.status(201).json(result.rows[0]);
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error: any) {
        console.error('Activity Registration error:', error);
        return res.status(error.message === 'Unauthorized' ? 401 : 500).json({ message: error.message });
    }
}
