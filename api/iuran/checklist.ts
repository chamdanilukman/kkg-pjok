import { query } from '../lib/db';
import { verifyToken } from '../lib/auth';

export default async function handler(req: any, res: any) {
    try {
        verifyToken(req);

        if (req.method === 'GET') {
            const { tahun } = req.query;

            let sql = `
                SELECT
                    user_id,
                    nama_anggota,
                    sekolah,
                    role,
                    periode_tahun,
                    iuran_per_bulan,
                    total_dibayar,
                    bulan_lunas,
                    status_pembayaran,
                    (iuran_per_bulan * 12) as total_iuran,
                    (iuran_per_bulan * 12) - total_dibayar as sisa_tunggakan,
                    ARRAY(
                        SELECT generate_series(1, 12)
                        EXCEPT
                        SELECT unnest(bulan_lunas)
                    ) as bulan_belum_lunas
                FROM view_checklist_iuran
            `;
            const params: any[] = [];

            if (tahun) {
                params.push(tahun);
                sql += ` WHERE periode_tahun = $${params.length}`;
            }

            sql += ' ORDER BY nama_anggota ASC';

            const result = await query(sql, params);
            return res.status(200).json(result.rows);
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error: any) {
        console.error('Checklist Iuran API error:', error);
        return res.status(error.message === 'Unauthorized' ? 401 : 500).json({ message: error.message });
    }
}
