import React, { useState } from 'react';
import { X } from 'lucide-react';

// Modal Component
export const Modal = ({ isOpen, onClose, title, children }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" onClick={onClose}>
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>&#8203;
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Activity Form
export const ActivityForm = ({ activity, onSubmit, onCancel }: any) => {
    const [formData, setFormData] = useState(activity || {
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        time: '08:00',
        location: '',
        qr_code: Math.random().toString(36).substring(7).toUpperCase(),
        status: 'draft',
        max_participants: 50
    });

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Judul</label>
                <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tanggal</label>
                    <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Waktu</label>
                    <input type="time" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" required />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Lokasi</label>
                <input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Deskripsi</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" rows={3}></textarea>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500">
                    <option value="draft">Draft</option>
                    <option value="active">Aktif</option>
                    <option value="completed">Selesai</option>
                    <option value="cancelled">Dibatalkan</option>
                </select>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Batal</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Simpan</button>
            </div>
        </form>
    );
};

// Meeting Form
export const MeetingForm = ({ meeting, onSubmit, onCancel, activities }: any) => {
    const scheduledActivities = (activities || []).filter((activity: any) => activity.status !== 'completed' && activity.status !== 'cancelled');
    const [formData, setFormData] = useState(meeting || {
        title: '',
        date: new Date().toISOString().split('T')[0],
        start_time: '09:00',
        end_time: '11:00',
        location: '',
        agenda: '',
        meeting_type: 'regular',
        activity_id: ''
    });

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Kegiatan</label>
                <select
                    value={formData.activity_id}
                    onChange={e => setFormData({ ...formData, activity_id: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                >
                    <option value="">Pilih kegiatan</option>
                    {scheduledActivities.map((activity: any) => (
                        <option key={activity.id} value={activity.id}>
                            {activity.title} ({new Date(activity.date).toLocaleDateString('id-ID')})
                        </option>
                    ))}
                </select>
                {scheduledActivities.length === 0 && (
                    <p className="mt-2 text-xs text-gray-500">Belum ada kegiatan yang dijadwalkan.</p>
                )}
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Judul Rapat</label>
                <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" required />
            </div>
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tanggal</label>
                    <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Mulai</label>
                    <input type="time" value={formData.start_time} onChange={e => setFormData({ ...formData, start_time: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Selesai</label>
                    <input type="time" value={formData.end_time} onChange={e => setFormData({ ...formData, end_time: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" required />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Agenda</label>
                <textarea value={formData.agenda} onChange={e => setFormData({ ...formData, agenda: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" rows={3}></textarea>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Batal</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Simpan</button>
            </div>
        </form>
    );
};

// Transaction Form
export const TransactionForm = ({ transaction, onSubmit, onCancel }: any) => {
    const [formData, setFormData] = useState(transaction || {
        description: '',
        amount: '',
        type: 'income',
        category: 'Iuran',
        date: new Date().toISOString().split('T')[0]
    });

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Deskripsi</label>
                <input type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Jumlah (Rp)</label>
                    <input type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tipe</label>
                    <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500">
                        <option value="income">Pemasukan</option>
                        <option value="expense">Pengeluaran</option>
                    </select>
                </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Batal</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Simpan</button>
            </div>
        </form>
    );
};

// Gallery Form
export const GalleryForm = ({ photo, onSubmit, onCancel, activities }: any) => {
    const [formData, setFormData] = useState(photo || {
        title: '',
        description: '',
        file_url: '',
        activity_id: ''
    });

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Kegiatan (Opsional)</label>
                <select
                    value={formData.activity_id || ''}
                    onChange={e => setFormData({ ...formData, activity_id: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                >
                    <option value="">Tanpa kegiatan</option>
                    {(activities || []).map((activity: any) => (
                        <option key={activity.id} value={activity.id}>
                            {activity.title} ({new Date(activity.date).toLocaleDateString('id-ID')})
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Judul Foto</label>
                <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">URL Gambar</label>
                <input type="url" value={formData.file_url} onChange={e => setFormData({ ...formData, file_url: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" placeholder="https://..." required />
                <p className="mt-1 text-xs text-gray-500">Gunakan link gambar publik (misal: imgbb, cloudinary, dll)</p>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Batal</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Simpan</button>
            </div>
        </form>
    );
};

// Iuran Config Form
export const IuranConfigForm = ({ config, onSubmit, onCancel }: any) => {
    const [formData, setFormData] = useState(config || {
        periode_tahun: new Date().getFullYear(),
        nominal: 150000,
        status: 'aktif'
    });

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tahun Periode</label>
                    <input 
                        type="number" 
                        value={formData.periode_tahun} 
                        onChange={e => setFormData({ ...formData, periode_tahun: parseInt(e.target.value) })} 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" 
                        required 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nominal (Rp)</label>
                    <input 
                        type="number" 
                        value={formData.nominal} 
                        onChange={e => setFormData({ ...formData, nominal: parseInt(e.target.value) })} 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" 
                        required 
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select 
                    value={formData.status} 
                    onChange={e => setFormData({ ...formData, status: e.target.value })} 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                </select>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Batal</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Simpan</button>
            </div>
        </form>
    );
};

// Pembayaran Iuran Form
export const PembayaranIuranForm = ({ users, config, pembayaran, onSubmit, onCancel }: any) => {
    const [formData, setFormData] = useState(pembayaran || {
        user_id: '',
        periode_tahun: config?.periode_tahun || new Date().getFullYear(),
        bulan_dibayar: [] as number[],
        jumlah: config?.nominal || 150000,
        metode_bayar: 'tunai',
        tanggal_bayar: new Date().toISOString().split('T')[0]
    });
    const nominalPerBulan = config?.nominal || 0;

    const bulanOptions = [
        { value: 1, label: 'Januari' },
        { value: 2, label: 'Februari' },
        { value: 3, label: 'Maret' },
        { value: 4, label: 'April' },
        { value: 5, label: 'Mei' },
        { value: 6, label: 'Juni' },
        { value: 7, label: 'Juli' },
        { value: 8, label: 'Agustus' },
        { value: 9, label: 'September' },
        { value: 10, label: 'Oktober' },
        { value: 11, label: 'November' },
        { value: 12, label: 'Desember' }
    ];

    const toggleBulan = (bulan: number) => {
        const current = formData.bulan_dibayar || [];
        const nextBulan = current.includes(bulan)
            ? current.filter((b: number) => b !== bulan)
            : [...current, bulan].sort((a: number, b: number) => a - b);
        const nextJumlah = nominalPerBulan > 0 ? nominalPerBulan * Math.max(1, nextBulan.length) : formData.jumlah;
        setFormData({ ...formData, bulan_dibayar: nextBulan, jumlah: nextJumlah });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.user_id || (formData.bulan_dibayar || []).length === 0) {
            alert('Pilih anggota dan minimal 1 bulan!');
            return;
        }
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Anggota</label>
                <select 
                    value={formData.user_id} 
                    onChange={e => {
                        const nextBulanCount = formData.bulan_dibayar?.length || 0;
                        const nextJumlah = nominalPerBulan > 0 ? nominalPerBulan * Math.max(1, nextBulanCount) : formData.jumlah;
                        setFormData({ ...formData, user_id: e.target.value, jumlah: nextJumlah });
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                >
                    <option value="">Pilih Anggota</option>
                    {users?.map((u: any) => (
                        <option key={u.id} value={u.id}>{u.name} - {u.school}</option>
                    ))}
                </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tahun</label>
                    <input 
                        type="number" 
                        value={formData.periode_tahun} 
                        onChange={e => setFormData({ ...formData, periode_tahun: parseInt(e.target.value) })} 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" 
                        required 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Jumlah (Rp)</label>
                    <input 
                        type="number" 
                        value={formData.jumlah} 
                        onChange={e => setFormData({ ...formData, jumlah: parseInt(e.target.value) || 0 })} 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" 
                        required 
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bulan Dibayar</label>
                <div className="grid grid-cols-3 gap-2">
                    {bulanOptions.map(bulan => (
                        <button
                            key={bulan.value}
                            type="button"
                            onClick={() => toggleBulan(bulan.value)}
                            className={`px-3 py-2 text-sm rounded-md transition-colors ${
                                formData.bulan_dibayar?.includes(bulan.value)
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {bulan.label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Metode</label>
                    <select 
                    value={formData.metode_bayar} 
                        onChange={e => setFormData({ ...formData, metode_bayar: e.target.value })} 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    >
                        <option value="tunai">Tunai</option>
                        <option value="transfer">Transfer</option>
                        <option value="lainnya">Lainnya</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tanggal</label>
                    <input 
                        type="date" 
                        value={formData.tanggal_bayar} 
                        onChange={e => setFormData({ ...formData, tanggal_bayar: e.target.value })} 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" 
                        required 
                    />
                </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Batal</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Simpan</button>
            </div>
        </form>
    );
};

// Attendance Mark Form
export const AttendanceMarkForm = ({ onSubmit, onCancel }: any) => {
    const [qrCode, setQrCode] = useState('');
    const [notes, setNotes] = useState('');

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(qrCode, notes); }} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Kode QR / ID Kegiatan</label>
                <input
                    type="text"
                    value={qrCode}
                    onChange={e => setQrCode(e.target.value.toUpperCase())}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    placeholder="CONTOH: ABC123"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Catatan (Opsional)</label>
                <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    rows={2}
                ></textarea>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Batal</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Absen Sekarang</button>
            </div>
        </form>
    );
};

// Member Form
export const MemberForm = ({ member, onSubmit, onCancel }: any) => {
    const isEdit = Boolean(member?.id);
    const [formData, setFormData] = useState(member || {
        name: '',
        email: '',
        role: 'anggota',
        school: '',
        position: '',
        phone: '',
        password: ''
    });

    return (
        <form onSubmit={(e) => {
            e.preventDefault();
            const payload = { ...formData };
            if (payload.password === '' || isEdit) {
                delete (payload as any).password;
            }
            onSubmit(payload);
        }} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" required={!isEdit} disabled={isEdit} />
            </div>
            {!isEdit && (
                <div>
                    <label className="block text-sm font-medium text-gray-700">Password (opsional)</label>
                    <input type="password" value={formData.password || ''} onChange={e => setFormData({ ...formData, password: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" placeholder="Default: password123" />
                </div>
            )}
            <div>
                <label className="block text-sm font-medium text-gray-700">Unit Kerja</label>
                <input type="text" value={formData.school} onChange={e => setFormData({ ...formData, school: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Jabatan</label>
                <input type="text" value={formData.position || ''} onChange={e => setFormData({ ...formData, position: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">No. HP</label>
                <input type="text" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500">
                    <option value="anggota">Anggota</option>
                    <option value="bendahara">Bendahara</option>
                    <option value="sekretaris">Sekretaris</option>
                    <option value="admin">Administrator</option>
                </select>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Batal</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Simpan</button>
            </div>
        </form>
    );
};
