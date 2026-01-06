import { query } from '../lib/db';
import { verifyToken, isAdmin, isBendaharaOrAdmin } from '../lib/auth';

export default async function handler(req: any, res: any) {
    try {
        const user = verifyToken(req);

        if (req.method === 'GET') {
            const { tahun, user_id, id } = req.query;

            if (id) {
                const result = await query(
                    `SELECT p.*, u.name as user_name, r.name as recorded_by_name,
                            dr.name as delete_requested_by_name, da.name as delete_approved_by_name
                     FROM pembayaran_iuran p
                     LEFT JOIN users u ON p.user_id = u.id
                     LEFT JOIN users r ON p.recorded_by = r.id
                     LEFT JOIN users dr ON p.delete_requested_by = dr.id
                     LEFT JOIN users da ON p.delete_approved_by = da.id
                     WHERE p.id = $1 AND p.deleted_at IS NULL`,
                    [id]
                );
                return res.status(200).json(result.rows[0]);
            }

            let sql = `
                SELECT p.*, u.name as user_name, r.name as recorded_by_name,
                       dr.name as delete_requested_by_name, da.name as delete_approved_by_name
                FROM pembayaran_iuran p
                LEFT JOIN users u ON p.user_id = u.id
                LEFT JOIN users r ON p.recorded_by = r.id
                LEFT JOIN users dr ON p.delete_requested_by = dr.id
                LEFT JOIN users da ON p.delete_approved_by = da.id
                WHERE p.deleted_at IS NULL
            `;
            const params: any[] = [];

            if (tahun) {
                params.push(tahun);
                sql += ` AND p.periode_tahun = $${params.length}`;
            }

            if (user_id) {
                params.push(user_id);
                sql += ` AND p.user_id = $${params.length}`;
            }

            sql += ' ORDER BY p.tanggal_bayar DESC, p.created_at DESC';

            const result = await query(sql, params);
            return res.status(200).json(result.rows);
        }

        if (req.method === 'POST') {
            if (!isBendaharaOrAdmin(user)) return res.status(403).json({ message: 'Forbidden' });

            const { user_id, periode_tahun, bulan_dibayar, jumlah, metode_bayar, tanggal_bayar } = req.body;

            const result = await query(
                `INSERT INTO pembayaran_iuran (user_id, periode_tahun, bulan_dibayar, jumlah, metode_bayar, tanggal_bayar, recorded_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                [user_id, periode_tahun, bulan_dibayar, jumlah, metode_bayar || 'tunai', tanggal_bayar, user.userId]
            );
            return res.status(201).json(result.rows[0]);
        }

        if (req.method === 'PUT') {
            if (!isBendaharaOrAdmin(user)) return res.status(403).json({ message: 'Forbidden' });

            const { id } = req.query;
            const { action } = req.query;
            const body = req.body || {};

            if (action === 'request_delete') {
                if (user.role !== 'bendahara') {
                    return res.status(403).json({ message: 'Only bendahara can request deletion' });
                }
                const result = await query(
                    `UPDATE pembayaran_iuran SET
                        delete_status = 'requested',
                        delete_requested_by = $1,
                        delete_requested_at = now()
                     WHERE id = $2 AND deleted_at IS NULL AND delete_status = 'active'
                     RETURNING *`,
                    [user.userId, id]
                );
                if (result.rows.length === 0) {
                    return res.status(400).json({ message: 'Delete request already exists or record not found' });
                }
                return res.status(200).json(result.rows[0]);
            }

            if (action === 'approve_delete') {
                if (!isAdmin(user)) return res.status(403).json({ message: 'Forbidden' });
                const existing = await query(
                    'SELECT delete_status FROM pembayaran_iuran WHERE id = $1 AND deleted_at IS NULL',
                    [id]
                );
                if (existing.rows.length === 0) {
                    return res.status(404).json({ message: 'Not found' });
                }
                if (existing.rows[0].delete_status !== 'requested') {
                    return res.status(400).json({ message: 'Delete request is required before approval' });
                }
                const result = await query(
                    `UPDATE pembayaran_iuran SET
                        delete_status = 'approved',
                        delete_approved_by = $1,
                        delete_approved_at = now(),
                        deleted_at = now()
                     WHERE id = $2 AND deleted_at IS NULL
                     RETURNING *`,
                    [user.userId, id]
                );
                return res.status(200).json(result.rows[0]);
            }

            const { user_id, periode_tahun, bulan_dibayar, jumlah, metode_bayar, tanggal_bayar } = body;
            const result = await query(
                `UPDATE pembayaran_iuran SET
                    user_id = COALESCE($1, user_id),
                    periode_tahun = COALESCE($2, periode_tahun),
                    bulan_dibayar = COALESCE($3, bulan_dibayar),
                    jumlah = COALESCE($4, jumlah),
                    metode_bayar = COALESCE($5, metode_bayar),
                    tanggal_bayar = COALESCE($6, tanggal_bayar)
                 WHERE id = $7 AND deleted_at IS NULL RETURNING *`,
                [user_id, periode_tahun, bulan_dibayar, jumlah, metode_bayar, tanggal_bayar, id]
            );
            return res.status(200).json(result.rows[0]);
        }

        if (req.method === 'DELETE') {
            return res.status(405).json({ message: 'Method not allowed' });
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error: any) {
        console.error('Pembayaran Iuran API error:', error);
        return res.status(error.message === 'Unauthorized' ? 401 : 500).json({ message: error.message });
    }
}
