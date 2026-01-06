import { query } from '../lib/db';
import { verifyToken, isAdmin } from '../lib/auth';

export default async function handler(req: any, res: any) {
    try {
        const user = verifyToken(req);

        if (req.method === 'GET') {
            const { category, type, id } = req.query;

            if (id) {
                const result = await query(
                    'SELECT t.*, u.name as created_by_name FROM transactions t LEFT JOIN users u ON t.created_by = u.id WHERE t.id = $1 AND t.deleted_at IS NULL',
                    [id]
                );
                return res.status(200).json(result.rows[0]);
            }

            let sql = `
        SELECT t.*, u.name as created_by_name
        FROM transactions t
        LEFT JOIN users u ON t.created_by = u.id
        WHERE t.deleted_at IS NULL
      `;
            const params: any[] = [];

            if (category) {
                params.push(category);
                sql += ` AND t.category = $${params.length}`;
            }

            if (type) {
                params.push(type);
                sql += ` AND t.type = $${params.length}`;
            }

            sql += ` ORDER BY t.date DESC`;

            const result = await query(sql, params);
            return res.status(200).json(result.rows);
        }

        if (req.method === 'POST') {
            if (!isAdmin(user)) return res.status(403).json({ message: 'Forbidden' });
            const { description, amount, type, category, date, receipt_url } = req.body;
            const result = await query(
                `INSERT INTO transactions (description, amount, type, category, date, receipt_url, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                [description, amount, type, category, date, receipt_url, user.userId]
            );
            return res.status(201).json(result.rows[0]);
        }

        if (req.method === 'PUT') {
            if (!isAdmin(user)) return res.status(403).json({ message: 'Forbidden' });
            const { id } = req.query;
            const { description, amount, type, category, date, receipt_url } = req.body;
            const result = await query(
                `UPDATE transactions SET 
          description = COALESCE($1, description), 
          amount = COALESCE($2, amount),
          type = COALESCE($3, type),
          category = COALESCE($4, category),
          date = COALESCE($5, date),
          receipt_url = COALESCE($6, receipt_url),
          updated_at = now()
         WHERE id = $7 AND deleted_at IS NULL RETURNING *`,
                [description, amount, type, category, date, receipt_url, id]
            );
            return res.status(200).json(result.rows[0]);
        }

        if (req.method === 'DELETE') {
            if (!isAdmin(user)) return res.status(403).json({ message: 'Forbidden' });
            const { id } = req.query;
            await query('UPDATE transactions SET deleted_at = now() WHERE id = $1', [id]);
            return res.status(204).end();
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error: any) {
        console.error('Transactions API error:', error);
        return res.status(error.message === 'Unauthorized' ? 401 : 500).json({ message: error.message });
    }
}
