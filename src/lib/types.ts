// Database types for KKG PJOK App

export type UserRole = 'admin' | 'bendahara' | 'sekretaris' | 'anggota';

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash?: string;
  role: UserRole;
  position?: string;
  school?: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Activity {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  location: string;
  qr_code: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  max_participants?: number;
  registration_deadline?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  created_by_name?: string;
  registered_count?: number;
  attended_count?: number;
}

export interface Attendance {
  id: string;
  activity_id: string;
  user_id: string;
  attended_at: string;
  check_in_method: 'qr_code' | 'manual';
  notes?: string;
  created_at: string;
  user_name?: string;
  activity?: Activity;
  user?: User;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  agenda?: string;
  notes?: string;
  meeting_type: 'regular' | 'emergency' | 'planning' | 'evaluation';
  activity_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  created_by_name?: string;
  activity_title?: string;
}

export interface MeetingAttendee {
  id: string;
  meeting_id: string;
  user_id: string;
  attendance_status: 'present' | 'absent' | 'late';
  joined_at: string;
  user?: User;
}

export interface Gallery {
  id: string;
  title: string;
  description?: string;
  file_url: string;
  file_type: 'image' | 'video' | 'document';
  file_size?: number;
  activity_id?: string;
  activity_title?: string;
  uploaded_by?: string;
  is_featured: boolean;
  uploaded_at: string;
  deleted_at?: string;
  activity?: Activity;
  uploaded_by_name?: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  receipt_url?: string;
  approved_by?: string;
  approved_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  created_by_name?: string;
  approved_by_name?: string;
}

export interface ActivityRegistration {
  id: string;
  activity_id: string;
  user_id: string;
  registered_at: string;
  status: 'registered' | 'cancelled' | 'waitlist';
  notes?: string;
  activity?: Activity;
  user?: User;
}

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_values?: any;
  new_values?: any;
  user_id?: string;
  created_at: string;
  user?: User;
}

export interface IuranConfig {
  id: string;
  periode_tahun: number;
  nominal: number;
  status: 'aktif' | 'nonaktif';
  created_at: string;
}

export interface PembayaranIuran {
  id: string;
  user_id: string;
  user_name?: string;
  periode_tahun: number;
  bulan_dibayar: number[];
  jumlah: number;
  metode_bayar: string;
  tanggal_bayar: string;
  recorded_by?: string;
  recorded_by_name?: string;
  created_at: string;
  delete_status?: 'active' | 'requested' | 'approved';
  delete_requested_by?: string;
  delete_requested_by_name?: string;
  delete_requested_at?: string;
  delete_approved_by?: string;
  delete_approved_by_name?: string;
  delete_approved_at?: string;
  deleted_at?: string;
}

export interface FinancialSummary {
  total_income: number;
  total_expense: number;
  balance: number;
  transaction_count: number;
}

export interface AttendanceStats {
  total_registered: number;
  total_attended: number;
  attendance_rate: number;
}
