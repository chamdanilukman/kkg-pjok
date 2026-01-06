import { query } from '../lib/db';

export default async function handler(req: any, res: any) {
    try {
        if (req.method === 'GET') {
            const { type } = req.query;

            // Special case for checking if any users exist (used by App.tsx for initial setup)
            if (type === 'count') {
                const result = await query('SELECT count(*) as count FROM users');
                return res.status(200).json({ count: parseInt(result.rows[0].count) });
            }

            return res.status(405).json({ message: 'Method not allowed' });
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error: any) {
        console.error('Users API error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
