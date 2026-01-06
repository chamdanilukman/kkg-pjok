import { query } from '../lib/db';
import { verifyToken, isAdmin, isBendaharaOrAdmin } from '../lib/auth';

export default async function handler(req: any, res: any) {
    try {
        const user = verifyToken(req);

        if (req.method === 'GET') {
            const { tahun, status } = req.query;

            let sql = 'SELECT * FROM iuran_config WHERE deleted_at IS NULL';
            const params: any[] = [];

            if (tahun) {
                params.push(tahun);
                sql += ` AND periode_tahun = $${params.length}`;
            }

            if (status) {
                params.push(status);
                sql += ` AND status = $${params.length}`;
            }

            sql += ' ORDER BY periode_tahun DESC';

            const result = await query(sql, params);
            return res.status(200).json(result.rows);
        }

        if (req.method === 'POST') {
            if (!isBendaharaOrAdmin(user)) return res.status(403).json({ message: 'Forbidden' });

            const { periode_tahun, nominal, status } = req.body;

            const result = await query(
                `INSERT INTO iuran_config (periode_tahun, nominal, status)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (periode_tahun) DO UPDATE SET
                    nominal = EXCLUDED.nominal,
                    status = EXCLUDED.status,
                    updated_at = now()
                 RETURNING *`,
                [periode_tahun, nominal, status || 'aktif']
            );
            return res.status(201).json(result.rows[0]);
        }

        if (req.method === 'PUT') {
            if (!isBendaharaOrAdmin(user)) return res.status(403).json({ message: 'Forbidden' });

            const { id } = req.query;
            const { periode_tahun, nominal, status } = req.body;

            const result = await query(
                `UPDATE iuran_config SET
                    periode_tahun = COALESCE($1, periode_tahun),
                    nominal = COALESCE($2, nominal),
                    status = COALESCE($3, status),
                    updated_at = now()
                 WHERE id = $4 AND deleted_at IS NULL RETURNING *`,
                [periode_tahun, nominal, status, id]
            );
            return res.status(200).json(result.rows[0]);
        }

        if (req.method === 'DELETE') {
            if (!isAdmin(user)) return res.status(403).json({ message: 'Forbidden' });

            const { id } = req.query;
            await query('UPDATE iuran_config SET deleted_at = now() WHERE id = $1', [id]);
            return res.status(204).end();
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error: any) {
        console.error('Iuran Config API error:', error);
        return res.status(error.message === 'Unauthorized' ? 401 : 500).json({ message: error.message });
    }
}
