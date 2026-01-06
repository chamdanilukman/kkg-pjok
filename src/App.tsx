import React, { useState, useEffect } from 'react';
import { Users, Calendar, FileText, DollarSign, Camera, QrCode, LogOut, Menu, X, User, BarChart3, Clock, MapPin, Settings, CreditCard, CheckSquare } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useActivities } from './hooks/useActivities';
import { useAttendance } from './hooks/useAttendance';
import { useTransactions } from './hooks/useTransactions';
import { useMeetings } from './hooks/useMeetings';
import { useGallery } from './hooks/useGallery';
import { useUsers } from './hooks/useUsers';
import { useIuranConfig, usePembayaranIuran, useChecklistIuran } from './hooks/useIuran';
import { AdminSetup } from './components/AdminSetup';
import { Modal, ActivityForm, MeetingForm, TransactionForm, GalleryForm, AttendanceMarkForm, MemberForm, IuranConfigForm, PembayaranIuranForm } from './components/Forms';
import { QRCodeGenerator } from './components/QRCodeGenerator';
import { QRScanner } from './components/QRScanner';
import { api } from './lib/api';

function App() {
  const { user, profile, loading: authLoading, signIn, signOut } = useAuth();
  const { activities, registerForActivity } = useActivities();
  const { getUserAttendance, markAttendance, fetchAttendance } = useAttendance();
  const { transactions, fetchTransactions, createTransaction, updateTransaction, deleteTransaction } = useTransactions();
  const { meetings, fetchMeetings } = useMeetings();
  const { gallery, fetchGallery } = useGallery();
  const { users, fetchUsers, deleteUser } = useUsers();
  const { config: iuranConfig, fetchConfig: fetchIuranConfig, saveConfig: saveIuranConfig } = useIuranConfig();
  const { pembayaran: pembayaranIuran, fetchPembayaran: fetchPembayaranIuran, createPembayaran: createPembayaranIuran, requestDeletePembayaran, approveDeletePembayaran } = usePembayaranIuran();
  const { checklist: checklistIuran, fetchChecklist: fetchChecklistIuran, loading: checklistLoading } = useChecklistIuran();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [userAttendance, setUserAttendance] = useState<any[]>([]);
  const [showAdminSetup, setShowAdminSetup] = useState(false);
  const [hasUsers, setHasUsers] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [iuranActiveTab, setIuranActiveTab] = useState<'transaksi' | 'iuran'>('iuran');
  const [attendanceByActivity, setAttendanceByActivity] = useState<Record<string, any[]>>({});
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [userCount, setUserCount] = useState<number>(0);

  useEffect(() => {
    if (user && profile) {
      fetchMeetings();
      fetchGallery();
      fetchUserAttendance();
      fetchTransactions();
      fetchIuranConfig();
      fetchPembayaranIuran(selectedYear);
      fetchChecklistIuran(selectedYear);
      if (profile.role === 'admin') {
        fetchUsers();
      }
    }
  }, [user, profile, selectedYear]);

  useEffect(() => {
    checkForUsers();
  }, []);

  const checkForUsers = async () => {
    try {
      const { count } = await api.fetch('/users/public?type=count');
      setHasUsers(count > 0);
      setUserCount(count || 0);
    } catch (error) {
      setHasUsers(true);
    }
  };

  const fetchUserAttendance = async () => {
    if (user) {
      const { data } = await getUserAttendance(user.userId || user.id);
      if (data) setUserAttendance(data);
    }
  };

  const refreshAttendanceForActivity = async (activityId: string) => {
    const { data } = await fetchAttendance(activityId);
    setAttendanceByActivity(prev => ({ ...prev, [activityId]: data || [] }));
  };

  const loadAttendanceForActivities = async () => {
    if (!activities.length) {
      setAttendanceByActivity({});
      setAttendanceLoading(false);
      return;
    }
    setAttendanceLoading(true);
    const entries = await Promise.all(
      activities.map(async (activity: any) => {
        const { data } = await fetchAttendance(activity.id);
        return [activity.id, data || []] as const;
      })
    );
    setAttendanceByActivity(Object.fromEntries(entries));
    setAttendanceLoading(false);
  };

  useEffect(() => {
    const isAdminUser = profile?.role === 'admin';
    if (!isAdminUser || activeTab !== 'attendance') return;
    let isActive = true;
    const load = async () => {
      if (!isActive) return;
      await loadAttendanceForActivities();
    };
    load();
    const interval = setInterval(load, 15000);
    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [profile, activeTab, activities]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const { error } = await signIn(loginForm.email, loginForm.password);
    if (error) {
      setLoginError(error.message || 'Email atau password salah');
    }
  };

  const handleLogout = async () => {
    await signOut();
    setActiveTab('dashboard');
  };

  const handleAdminCreated = () => {
    setShowAdminSetup(false);
    setHasUsers(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Users className="h-8 w-8 text-white" />
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasUsers && !showAdminSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Selamat Datang!</h1>
          <p className="text-gray-600 mb-6">Aplikasi belum memiliki administrator. Silakan buat akun admin terlebih dahulu.</p>
          <button onClick={() => setShowAdminSetup(true)} className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
            Setup Admin
          </button>
        </div>
      </div>
    );
  }

  if (showAdminSetup) {
    return <AdminSetup onAdminCreated={handleAdminCreated} />;
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">KKG PJOK</h1>
            <p className="text-gray-600">Kecamatan Grobogan</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{loginError}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input type="email" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder="Masukkan email Anda" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder="Masukkan password" required />
            </div>
            <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">Masuk</button>
          </form>
        </div>
      </div>
    );
  }

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
  const activeIuranConfig = iuranConfig.find((c: any) => c.status === 'aktif');
  const totalIuranCollected = checklistIuran.reduce((sum: number, item: any) => sum + Number(item.total_dibayar || 0), 0);
  const totalIuranExpected = checklistIuran.length * (activeIuranConfig?.nominal || 0) * 12;

  const isAdmin = profile?.role === 'admin';
  const isBendahara = profile?.role === 'bendahara';
  const isSekretaris = profile?.role === 'sekretaris';
  const canManageUsers = isAdmin;
  const canManageFinance = isAdmin || isBendahara;
  const canManageActivities = isAdmin || isSekretaris;
  const canManageMeetings = isAdmin || isSekretaris;

  const totalUsers = isAdmin ? users.length : userCount;
  const dashboardStats = [
    { label: 'Total Anggota', value: totalUsers.toString(), color: 'green', icon: Users },
    { label: 'Kegiatan Bulan Ini', value: activities.length.toString(), color: 'blue', icon: Calendar },
    { label: 'Rata-rata Kehadiran', value: userAttendance.length > 0 ? `${Math.min(100, Math.round(userAttendance.length / Math.max(1, activities.length) * 100))}%` : '0%', color: 'orange', icon: BarChart3 },
    { label: 'Saldo Kas', value: `Rp ${(totalIncome - totalExpense).toLocaleString('id-ID')}`, color: 'purple', icon: DollarSign }
  ];

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'activities', label: 'Kegiatan', icon: Calendar, show: canManageActivities || true },
    { id: 'attendance', label: 'Presensi', icon: QrCode },
    { id: 'meetings', label: 'Notulen', icon: FileText, show: canManageMeetings || true },
    { id: 'gallery', label: 'Galeri', icon: Camera },
    { id: 'finance', label: 'Keuangan', icon: DollarSign, show: canManageFinance || true },
    ...(canManageUsers ? [{ id: 'members', label: 'Anggota', icon: Users }] : [])
  ];

  const handleDeleteActivity = async (id: string) => {
    if (confirm('Hapus kegiatan ini?')) {
      await api.delete(`/activities?id=${id}`);
      window.location.reload();
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    if (confirm('Hapus notulen ini?')) {
      await api.delete(`/meetings?id=${id}`);
      window.location.reload();
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (confirm('Hapus transaksi ini?')) {
      await deleteTransaction(id);
    }
  };

  const handleDeletePhoto = async (id: string) => {
    if (confirm('Hapus foto ini?')) {
      await api.delete(`/gallery?id=${id}`);
      window.location.reload();
    }
  };

  const handleCreateTransaction = async (data: any) => {
    await createTransaction(data);
    setIsModalOpen(false);
  };

  const handleUpdateTransaction = async (data: any) => {
    await updateTransaction(selectedItem.id, data);
    setIsModalOpen(false);
  };

  const handleCreateActivity = async (data: any) => {
    await api.post('/activities', data);
    setIsModalOpen(false);
    window.location.reload();
  };

  const handleUpdateActivity = async (data: any) => {
    await api.put(`/activities?id=${selectedItem.id}`, data);
    setIsModalOpen(false);
    window.location.reload();
  };

  const handleCreateMeeting = async (data: any) => {
    await api.post('/meetings', data);
    setIsModalOpen(false);
    window.location.reload();
  };

  const handleUpdateMeeting = async (data: any) => {
    await api.put(`/meetings?id=${selectedItem.id}`, data);
    setIsModalOpen(false);
    window.location.reload();
  };

  const handleUploadPhoto = async (data: any) => {
    await api.post('/gallery', data);
    setIsModalOpen(false);
    window.location.reload();
  };

  const handleMarkAttendance = async (qrCode: string, notes?: string) => {
    const activity = activities.find((a: any) => a.qr_code === qrCode);
    if (!activity) {
      alert('Kode QR tidak valid');
      return;
    }
    const { error } = await markAttendance({ activity_id: activity.id, user_id: user.userId || user.id, check_in_method: 'qr_code', notes });
    if (!error) {
      alert('Berhasil melakukan presensi!');
      setIsModalOpen(false);
      setShowQRScanner(false);
      fetchUserAttendance();
      refreshAttendanceForActivity(activity.id);
    } else {
      alert('Gagal presensi: ' + error.message);
    }
  };

  const handleSaveIuranConfig = async (data: any) => {
    await saveIuranConfig(data);
    setIsModalOpen(false);
    fetchIuranConfig();
  };

  const handleCreatePembayaranIuran = async (data: any) => {
    await createPembayaranIuran(data);
    setIsModalOpen(false);
    fetchPembayaranIuran(selectedYear);
    fetchChecklistIuran(selectedYear);
  };

  const handleRequestDeletePembayaran = async (id: string) => {
    if (!confirm('Ajukan penghapusan pembayaran iuran ini?')) return;
    const { error } = await requestDeletePembayaran(id);
    if (!error) {
      fetchPembayaranIuran(selectedYear);
    } else {
      alert(error.message || 'Gagal mengajukan penghapusan');
    }
  };

  const handleApproveDeletePembayaran = async (id: string) => {
    if (!confirm('Setujui dan hapus pembayaran iuran ini?')) return;
    const { error } = await approveDeletePembayaran(id);
    if (!error) {
      fetchPembayaranIuran(selectedYear);
      fetchChecklistIuran(selectedYear);
    } else {
      alert(error.message || 'Gagal menyetujui penghapusan');
    }
  };

  const handleScanResult = (result: string) => {
    setShowQRScanner(false);
    handleMarkAttendance(result);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Selamat datang, {profile.name}</h2>
              <p className="text-gray-600 capitalize">{(profile as any).role === 'admin' ? 'Administrator' : (profile as any).role === 'bendahara' ? 'Bendahara' : (profile as any).role === 'sekretaris' ? 'Sekretaris' : 'Anggota'}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {dashboardStats.map((stat, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                      <p className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</p>
                    </div>
                    <stat.icon className={`h-8 w-8 text-${stat.color}-600`} />
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Kegiatan Mendatang</h3>
                <div className="space-y-3">
                  {activities.slice(0, 3).map((activity: any) => (
                    <div key={activity.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <Calendar className="h-5 w-5 text-green-600 mr-3" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{activity.title}</p>
                        <p className="text-sm text-gray-600">{new Date(activity.date).toLocaleDateString('id-ID')} • {activity.time}</p>
                      </div>
                    </div>
                  ))}
                  {activities.length === 0 && <p className="text-gray-500 text-sm">Tidak ada kegiatan mendatang</p>}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Aktivitas Terbaru</h3>
                <div className="space-y-3">
                  <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                    <Clock className="h-5 w-5 text-blue-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Sistem aktif</p>
                      <p className="text-sm text-gray-600">{new Date().toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'activities':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Kegiatan</h2>
              {canManageActivities && (
                <button onClick={() => { setModalType('activity_add'); setSelectedItem(null); setIsModalOpen(true); }} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                  Tambah Kegiatan
                </button>
              )}
            </div>
            <div className="grid gap-6">
              {activities.map((activity: any) => (
                <div key={activity.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{activity.title}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${activity.status === 'active' ? 'bg-green-100 text-green-700' : activity.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                            {activity.status === 'active' ? 'Aktif' : activity.status === 'completed' ? 'Selesai' : 'Draft'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center text-gray-600 mb-2">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{new Date(activity.date).toLocaleDateString('id-ID')} • {activity.time}</span>
                      </div>
                      <div className="flex items-center text-gray-600 mb-4">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{activity.location}</span>
                      </div>
                      <p className="text-gray-700 mb-4">{activity.description}</p>
                      <div className="flex space-x-2 flex-wrap gap-2">
                        <button onClick={async () => { const { error } = await registerForActivity(activity.id); if (!error) alert('Berhasil mendaftar!'); else alert('Gagal: ' + error.message); }} className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-100">
                          Daftar
                        </button>
                        {canManageActivities && (
                          <>
                            <button onClick={() => { setSelectedItem(activity); setModalType('activity_edit'); setIsModalOpen(true); }} className="text-sm bg-gray-50 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-100">Edit</button>
                            <button onClick={() => handleDeleteActivity(activity.id)} className="text-sm bg-red-50 text-red-700 px-3 py-1 rounded-md hover:bg-red-100">Hapus</button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      {isAdmin && activity.status === 'active' && (
                        <QRCodeGenerator value={activity.qr_code} size={200} title="Scan untuk Presensi" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {activities.length === 0 && <p className="text-center py-12 text-gray-500">Belum ada kegiatan</p>}
            </div>
          </div>
        );

      case 'attendance':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Sistem Presensi QR Code</h2>
            {isAdmin ? (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">QR Presensi Kegiatan</h3>
                      <p className="text-sm text-gray-600">Tampilkan QR agar anggota bisa scan saat hadir.</p>
                    </div>
                    <button onClick={loadAttendanceForActivities} className="text-sm bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200">
                      Refresh
                    </button>
                  </div>
                </div>
                <div className="grid gap-6">
                  {activities.filter((activity: any) => activity.status !== 'cancelled').map((activity: any) => {
                    const attendanceList = attendanceByActivity[activity.id] || [];
                    return (
                      <div key={activity.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex flex-col md:flex-row md:items-start gap-6">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">{activity.title}</h3>
                            <p className="text-sm text-gray-600 mb-3">{new Date(activity.date).toLocaleDateString('id-ID')} - {activity.time}</p>
                            <div className="text-sm text-gray-700 mb-4">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                activity.status === 'active' ? 'bg-green-100 text-green-700' :
                                activity.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {activity.status === 'active' ? 'Aktif' : activity.status === 'completed' ? 'Selesai' : 'Draft'}
                              </span>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-2">Rekap Kehadiran</h4>
                              {attendanceLoading ? (
                                <p className="text-sm text-gray-500">Memuat kehadiran...</p>
                              ) : attendanceList.length > 0 ? (
                                <ul className="space-y-1 text-sm text-gray-700">
                                  {attendanceList.map((record: any) => (
                                    <li key={record.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                                      <span>{record.user_name || record.user?.name || 'Anggota'}</span>
                                      <span className="text-xs text-gray-500">{new Date(record.attended_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-gray-500">Belum ada yang hadir.</p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-center">
                            <QRCodeGenerator value={activity.qr_code} size={220} title="Scan untuk Presensi" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {activities.length === 0 && <p className="text-center py-12 text-gray-500">Belum ada kegiatan</p>}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="text-center py-8">
                  <div className="w-32 h-32 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <QrCode className="h-16 w-16 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Presensi Mandiri</h3>
                  <p className="text-gray-600 mb-6">Scan QR Code kegiatan atau masukkan kode manual</p>
                  <div className="flex justify-center gap-4">
                    <button onClick={() => setShowQRScanner(true)} className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
                      Scan QR Code
                    </button>
                    <button onClick={() => { setModalType('attendance_mark'); setIsModalOpen(true); }} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                      Input Manual
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Riwayat Kehadiran</h3>
              <div className="space-y-3">
                {userAttendance.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{record.activity_title || record.activity?.title}</p>
                      <p className="text-sm text-gray-600">{new Date(record.attended_at || record.activity?.date).toLocaleDateString('id-ID')}</p>
                    </div>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Hadir</span>
                  </div>
                ))}
                {userAttendance.length === 0 && <p className="text-gray-500 text-sm">Belum ada riwayat kehadiran</p>}
              </div>
            </div>
          </div>
        );

      case 'meetings':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Notulen Rapat</h2>
              {canManageMeetings && (
                <button onClick={() => { setModalType('meeting_add'); setSelectedItem(null); setIsModalOpen(true); }} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                  Tambah Notulen
                </button>
              )}
            </div>
            <div className="space-y-4">
              {meetings.map((meeting: any) => (
                <div key={meeting.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{meeting.title}</h3>
                      <p className="text-gray-600">{new Date(meeting.date).toLocaleDateString('id-ID')}</p>
                      {meeting.activity_title && (
                        <p className="text-sm text-gray-500">Kegiatan: {meeting.activity_title}</p>
                      )}
                    </div>
                    {canManageMeetings && (
                      <div className="flex space-x-2">
                        <button onClick={() => { setSelectedItem(meeting); setModalType('meeting_edit'); setIsModalOpen(true); }} className="p-2 text-gray-400 hover:text-blue-600">Edit</button>
                        <button onClick={() => handleDeleteMeeting(meeting.id)} className="p-2 text-gray-400 hover:text-red-600">Hapus</button>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-700 mb-4">{meeting.notes || meeting.agenda}</p>
                </div>
              ))}
              {meetings.length === 0 && <p className="text-center py-12 text-gray-500">Belum ada notulen rapat</p>}
            </div>
          </div>
        );

      case 'gallery':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Galeri Dokumentasi</h2>
              {isAdmin && (
                <button onClick={() => { setModalType('photo_upload'); setSelectedItem(null); setIsModalOpen(true); }} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                  Upload Foto
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gallery.map((photo: any) => (
                <div key={photo.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative group">
                  {isAdmin && (
                    <button onClick={() => handleDeletePhoto(photo.id)} className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <img src={photo.file_url} alt={photo.title} className="w-full h-48 object-cover" onError={(e) => { (e.target as any).src = 'https://via.placeholder.com/400x300?text=No+Image'; }} />
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{photo.title}</h3>
                    {photo.activity_title && (
                      <p className="text-xs text-gray-500 mb-1">Kegiatan: {photo.activity_title}</p>
                    )}
                    <p className="text-sm text-gray-600">{new Date(photo.uploaded_at).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>
              ))}
              {gallery.length === 0 && <p className="col-span-full text-center py-12 text-gray-500">Belum ada dokumentasi</p>}
            </div>
          </div>
        );

      case 'finance':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-2xl font-bold text-gray-900">Keuangan</h2>
              <div className="flex gap-2">
                <button onClick={() => setIuranActiveTab('iuran')} className={`px-4 py-2 rounded-lg ${iuranActiveTab === 'iuran' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                  Iuran
                </button>
                <button onClick={() => setIuranActiveTab('transaksi')} className={`px-4 py-2 rounded-lg ${iuranActiveTab === 'transaksi' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                  Transaksi
                </button>
              </div>
            </div>

            {iuranActiveTab === 'iuran' ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold text-gray-900">Pembayaran Iuran</h3>
                    <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="px-3 py-1 border border-gray-300 rounded-lg text-sm">
                      {[2024, 2025, 2026].map(year => <option key={year} value={year}>{year}</option>)}
                    </select>
                  </div>
                  {canManageFinance && (
                    <div className="flex gap-2">
                      <button onClick={() => { setModalType('iuran_config'); setSelectedItem(activeIuranConfig || null); setIsModalOpen(true); }} className="bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 text-sm flex items-center">
                        <Settings className="h-4 w-4 mr-1" /> Setting
                      </button>
                      <button onClick={() => { setModalType('pembayaran_iuran'); setSelectedItem(null); setIsModalOpen(true); }} className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm flex items-center">
                        <CreditCard className="h-4 w-4 mr-1" /> Bayar Iuran
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">Total Anggota</p>
                    <p className="text-2xl font-bold text-green-700">{checklistIuran.length}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">Iuran Terkumpul</p>
                    <p className="text-2xl font-bold text-blue-700">Rp {totalIuranCollected.toLocaleString('id-ID')}</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm text-orange-600 font-medium">Target ({selectedYear})</p>
                    <p className="text-2xl font-bold text-orange-700">Rp {totalIuranExpected.toLocaleString('id-ID')}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-purple-600 font-medium">Progress</p>
                    <p className="text-2xl font-bold text-purple-700">{totalIuranExpected > 0 ? Math.round(totalIuranCollected / totalIuranExpected * 100) : 0}%</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Checklist Pembayaran Iuran {selectedYear}</h3>
                  {checklistLoading ? (
                    <p className="text-gray-500">Loading...</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-2 font-semibold text-gray-900">Nama</th>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(b => (
                              <th key={b} className="text-center py-3 px-1 font-semibold text-gray-600">{['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][b - 1]}</th>
                            ))}
                            <th className="text-center py-3 px-2 font-semibold text-gray-900">Total</th>
                            <th className="text-center py-3 px-2 font-semibold text-gray-900">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {checklistIuran.map((item: any) => (
                            <tr key={item.user_id} className="border-b hover:bg-gray-50">
                              <td className="py-2 px-2 font-medium text-gray-900">{item.nama_anggota}</td>
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(bulan => (
                                <td key={bulan} className="text-center py-2 px-1">
                                  {item.bulan_lunas?.includes(bulan) ? (
                                    <CheckSquare className="h-4 w-4 text-green-600 mx-auto" />
                                  ) : (
                                    <span className="text-gray-300">-</span>
                                  )}
                                </td>
                              ))}
                              <td className="py-2 px-2 text-center font-medium">Rp {(item.total_dibayar || 0).toLocaleString('id-ID')}</td>
                              <td className="py-2 px-2 text-center">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  item.status_pembayaran === 'LUNAS' ? 'bg-green-100 text-green-700' :
                                  item.status_pembayaran === 'PARTIAL' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {item.status_pembayaran}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {canManageFinance && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Riwayat Pembayaran Iuran</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-2 font-semibold text-gray-900">Tanggal</th>
                            <th className="text-left py-3 px-2 font-semibold text-gray-900">Anggota</th>
                            <th className="text-left py-3 px-2 font-semibold text-gray-900">Bulan</th>
                            <th className="text-right py-3 px-2 font-semibold text-gray-900">Jumlah</th>
                            <th className="text-left py-3 px-2 font-semibold text-gray-900">Metode</th>
                            <th className="text-left py-3 px-2 font-semibold text-gray-900">Status</th>
                            <th className="text-right py-3 px-2 font-semibold text-gray-900">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pembayaranIuran.map((item: any) => {
                            const status = item.delete_status || 'active';
                            return (
                              <tr key={item.id} className="border-b hover:bg-gray-50">
                                <td className="py-2 px-2">{new Date(item.tanggal_bayar).toLocaleDateString('id-ID')}</td>
                                <td className="py-2 px-2">{item.user_name || '-'}</td>
                                <td className="py-2 px-2">
                                  {(item.bulan_dibayar || []).map((b: number) => b.toString().padStart(2, '0')).join(', ') || '-'}
                                </td>
                                <td className="py-2 px-2 text-right">Rp {Number(item.jumlah).toLocaleString('id-ID')}</td>
                                <td className="py-2 px-2 capitalize">{item.metode_bayar}</td>
                                <td className="py-2 px-2">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    status === 'requested' ? 'bg-yellow-100 text-yellow-700' :
                                    status === 'approved' ? 'bg-red-100 text-red-700' :
                                    'bg-green-100 text-green-700'
                                  }`}>
                                    {status === 'requested' ? 'Menunggu Approve' : status === 'approved' ? 'Dihapus' : 'Aktif'}
                                  </span>
                                  {status === 'requested' && item.delete_requested_by_name && (
                                    <p className="text-xs text-gray-500 mt-1">Diminta: {item.delete_requested_by_name}</p>
                                  )}
                                </td>
                                <td className="py-2 px-2 text-right">
                                  {isBendahara && status === 'active' && (
                                    <button onClick={() => handleRequestDeletePembayaran(item.id)} className="text-xs text-red-600 hover:text-red-700">
                                      Ajukan Hapus
                                    </button>
                                  )}
                                  {isAdmin && status === 'requested' && (
                                    <button onClick={() => handleApproveDeletePembayaran(item.id)} className="text-xs text-red-600 hover:text-red-700">
                                      Setujui Hapus
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                          {pembayaranIuran.length === 0 && (
                            <tr>
                              <td colSpan={7} className="py-6 text-center text-gray-500">Belum ada pembayaran iuran</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Transaksi Keuangan</h3>
                  {canManageFinance && (
                    <button onClick={() => { setModalType('transaction_add'); setSelectedItem(null); setIsModalOpen(true); }} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                      Tambah Transaksi
                    </button>
                  )}
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan</h3>
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-green-600 font-medium">Pemasukan</p>
                      <p className="text-xl font-bold text-green-700">Rp {totalIncome.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-sm text-red-600 font-medium">Pengeluaran</p>
                      <p className="text-xl font-bold text-red-700">Rp {totalExpense.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-600 font-medium">Saldo</p>
                      <p className="text-xl font-bold text-blue-700">Rp {(totalIncome - totalExpense).toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Riwayat Transaksi</h3>
                  <div className="space-y-3">
                    {transactions.map((transaction: any) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg group">
                        <div>
                          <p className="font-medium text-gray-900">{transaction.description}</p>
                          <p className="text-sm text-gray-600">{new Date(transaction.date).toLocaleDateString('id-ID')} • {transaction.category || 'Umum'}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.type === 'income' ? '+' : '-'}Rp {Number(transaction.amount).toLocaleString('id-ID')}
                          </span>
                          {canManageFinance && (
                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setSelectedItem(transaction); setModalType('transaction_edit'); setIsModalOpen(true); }} className="p-1 text-blue-600">Edit</button>
                              <button onClick={() => handleDeleteTransaction(transaction.id)} className="p-1 text-red-600">Hapus</button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {transactions.length === 0 && <p className="text-center py-12 text-gray-500">Belum ada transaksi</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'members':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Manajemen Anggota</h2>
              {isAdmin && (
                <button onClick={() => { setModalType('member_add'); setSelectedItem(null); setIsModalOpen(true); }} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                  Tambah Anggota
                </button>
              )}
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Nama</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Sekolah</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Role</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u: any) => (
                      <tr key={u.id} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-gray-900">{u.name}</td>
                        <td className="py-3 px-4 text-gray-600">{u.email}</td>
                        <td className="py-3 px-4 text-gray-600">{u.school || '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-sm ${
                            u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                            u.role === 'bendahara' ? 'bg-green-100 text-green-700' :
                            u.role === 'sekretaris' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {u.role === 'admin' ? 'Admin' : u.role === 'bendahara' ? 'Bendahara' : u.role === 'sekretaris' ? 'Sekretaris' : 'Anggota'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-sm ${u.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {u.is_active !== false ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {isAdmin && (
                            <>
                              <button onClick={() => { setSelectedItem(u); setModalType('member_edit'); setIsModalOpen(true); }} className="text-blue-600 hover:text-blue-700 mr-2 text-sm">Edit</button>
                              <button onClick={() => { if (confirm('Hapus user ini?')) deleteUser(u.id); }} className="text-red-600 hover:text-red-700 text-sm">Hapus</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <div className="flex items-center ml-4 md:ml-0">
                <Users className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">KKG PJOK</h1>
                  <p className="text-xs text-gray-600">Kecamatan Grobogan</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-600" />
                <span className="text-sm text-gray-700 hidden sm:block">{profile.name}</span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium capitalize">
                  {(profile as any).role}
                </span>
              </div>
              <button onClick={handleLogout} className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className={`${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform md:translate-x-0 md:static md:inset-0 transition-transform duration-200 ease-in-out`}>
          <div className="flex flex-col h-full">
            <nav className="flex-1 px-4 py-6 space-y-2">
              {menuItems.filter((item: any) => item.show !== false).map((item: any) => (
                <button key={item.id} onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${activeTab === item.id ? 'bg-green-100 text-green-700 border-r-2 border-green-600' : 'text-gray-700 hover:bg-gray-100'}`}>
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{renderContent()}</div>
        </main>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={
        modalType === 'activity_add' ? 'Tambah Kegiatan' :
        modalType === 'activity_edit' ? 'Edit Kegiatan' :
        modalType === 'meeting_add' ? 'Tambah Notulen' :
        modalType === 'meeting_edit' ? 'Edit Notulen' :
        modalType === 'transaction_add' ? 'Tambah Transaksi' :
        modalType === 'transaction_edit' ? 'Edit Transaksi' :
        modalType === 'photo_upload' ? 'Upload Foto' :
        modalType === 'attendance_mark' ? 'Presensi Manual' :
        modalType === 'member_edit' ? 'Edit Anggota' :
        modalType === 'member_add' ? 'Tambah Anggota' :
        modalType === 'iuran_config' ? 'Setting Iuran' :
        modalType === 'pembayaran_iuran' ? 'Pembayaran Iuran' : 'Form'
      }>
        {modalType?.startsWith('activity') && <ActivityForm activity={selectedItem} onSubmit={modalType === 'activity_add' ? handleCreateActivity : handleUpdateActivity} onCancel={() => setIsModalOpen(false)} />}
        {modalType?.startsWith('meeting') && <MeetingForm meeting={selectedItem} activities={activities} onSubmit={modalType === 'meeting_add' ? handleCreateMeeting : (data: any) => handleUpdateMeeting(data)} onCancel={() => setIsModalOpen(false)} />}
        {modalType?.startsWith('transaction') && <TransactionForm transaction={selectedItem} onSubmit={modalType === 'transaction_add' ? handleCreateTransaction : (data: any) => handleUpdateTransaction(data)} onCancel={() => setIsModalOpen(false)} />}
        {modalType === 'photo_upload' && <GalleryForm activities={activities} onSubmit={handleUploadPhoto} onCancel={() => setIsModalOpen(false)} />}
        {modalType === 'attendance_mark' && <AttendanceMarkForm onSubmit={handleMarkAttendance} onCancel={() => setIsModalOpen(false)} />}
        {modalType?.startsWith('member') && (
          <MemberForm
            member={selectedItem}
            onSubmit={async (data: any) => {
              if (modalType === 'member_add') {
                await api.post('/users', data);
              } else if (modalType === 'member_edit') {
                const { name, role, position, school, phone, is_active } = data;
                await api.put(`/users?id=${selectedItem.id}`, { name, role, position, school, phone, is_active });
              }
              setIsModalOpen(false);
              fetchUsers();
            }}
            onCancel={() => setIsModalOpen(false)}
          />
        )}
        {modalType === 'iuran_config' && <IuranConfigForm config={selectedItem} onSubmit={handleSaveIuranConfig} onCancel={() => setIsModalOpen(false)} />}
        {modalType === 'pembayaran_iuran' && <PembayaranIuranForm users={users} config={activeIuranConfig} pembayaran={selectedItem} onSubmit={handleCreatePembayaranIuran} onCancel={() => setIsModalOpen(false)} />}
      </Modal>

      {showQRScanner && <QRScanner onScan={handleScanResult} onClose={() => setShowQRScanner(false)} />}
    </div>
  );
}

export default App;
