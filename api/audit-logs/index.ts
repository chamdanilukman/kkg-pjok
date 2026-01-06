import { query } from '../lib/db';
import { verifyToken, isAdmin } from '../lib/auth';

export default async function handler(req: any, res: any) {
    try {
        const user = verifyToken(req);

        if (req.method === 'GET') {
            if (!isAdmin(user)) {
                return res.status(403).json({ message: 'Only admins can view audit logs' });
            }

            // Return empty for now or fetch if needed
            const result = await query(
                `SELECT l.*, u.name as user_name 
         FROM audit_logs l 
         LEFT JOIN users u ON l.user_id = u.id 
         ORDER BY l.created_at DESC LIMIT 50`
            );
            return res.status(200).json(result.rows);
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error: any) {
        console.error('Audit Logs API error:', error);
        return res.status(error.message === 'Unauthorized' ? 401 : 500).json({ message: error.message });
    }
}
