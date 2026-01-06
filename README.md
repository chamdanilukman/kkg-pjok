# 🏫 MGMP PJOK Grobogan - Sistem Manajemen

Sistem manajemen lengkap untuk Musyawarah Guru Mata Pelajaran (MGMP) Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK) Kecamatan Grobogan.

## 🚀 Fitur Utama

### 👥 Manajemen Anggota
- **Role-based Access Control**: Admin (4 pengurus) dan Member (41 guru)
- **Profil Lengkap**: Nama, sekolah, posisi, kontak
- **Status Aktif**: Tracking keaktifan anggota

### 📅 Manajemen Kegiatan
- **CRUD Kegiatan**: Buat, edit, hapus kegiatan
- **Status Tracking**: Draft, Active, Completed, Cancelled
- **QR Code**: Auto-generate untuk presensi
- **Registrasi**: Sistem pendaftaran dengan batas peserta
- **Deadline**: Batas waktu registrasi

### ✅ Sistem Presensi
- **QR Code Scanner**: Presensi otomatis via QR
- **Manual Check-in**: Backup untuk presensi manual
- **Real-time Tracking**: Monitor kehadiran langsung
- **Statistik**: Tingkat kehadiran per kegiatan

### 📝 Notulen Rapat
- **Manajemen Meeting**: Rapat reguler, darurat, perencanaan
- **Attendees Tracking**: Daftar hadir yang dinormalisasi
- **Status Kehadiran**: Present, Absent, Late
- **Agenda & Notes**: Dokumentasi lengkap

### 📸 Galeri Dokumentasi
- **Multi-format**: Image, video, document
- **Activity Linking**: Kaitkan dengan kegiatan
- **Featured Content**: Highlight konten penting
- **File Management**: Upload dan organize files

### 💰 Manajemen Keuangan
- **Income/Expense Tracking**: Pemasukan dan pengeluaran
- **Kategori**: Iuran, workshop, operasional, dll
- **Approval Workflow**: Sistem persetujuan transaksi
- **Financial Reports**: Laporan keuangan otomatis
- **Receipt Management**: Upload bukti transaksi

### 🔍 Audit Trail
- **Complete Logging**: Track semua perubahan data
- **User Accountability**: Siapa melakukan apa
- **History Tracking**: Riwayat perubahan record
- **System Analytics**: Statistik penggunaan sistem

## 🛠️ Teknologi

### Frontend
- **React 18** dengan TypeScript
- **Tailwind CSS** untuk styling
- **Lucide React** untuk icons
- **Vite** sebagai build tool

### Backend & Database
- **Supabase** (PostgreSQL + Auth + Storage)
- **Row Level Security** untuk keamanan data
- **Real-time subscriptions** untuk update langsung
- **Database functions** untuk business logic

### Development Tools
- **ESLint** untuk code quality
- **TypeScript** untuk type safety
- **Git** untuk version control

## 📦 Instalasi

### Prerequisites
- Node.js 18+ 
- npm atau yarn
- Account Supabase

### Setup Project

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd mgmp-pjok-grobogan
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Setup Database Baru**
   ```bash
   # Konfigurasi database credentials
   npm run db:config
   
   # Test koneksi database
   npm run db:test
   ```

4. **Environment Variables**
   ```bash
   # Copy .env.example ke .env dan isi credentials
   cp .env.example .env
   ```

5. **Jalankan Migrasi Database**
   - Buka Supabase Dashboard
   - Jalankan SQL files secara berurutan:
     1. `20250919_new_improved_schema.sql`
     2. `20250919_indexes_functions.sql`
     3. `20250919_sample_data.sql`

6. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🗄️ Database Schema

### Core Tables
- **users**: Profil anggota dengan role-based access
- **activities**: Kegiatan dengan QR code dan status
- **attendance**: Presensi dengan metode check-in
- **meetings**: Rapat dengan tipe dan agenda
- **meeting_attendees**: Peserta rapat (normalized)
- **gallery**: Media files dengan kategorisasi
- **transactions**: Transaksi keuangan dengan approval
- **activity_registrations**: Pendaftaran kegiatan
- **audit_logs**: Log perubahan untuk accountability

### Key Features
- **Soft Delete**: Semua tabel mendukung soft delete
- **Audit Trail**: Automatic logging semua perubahan
- **RLS Policies**: Row-level security untuk data protection
- **Database Functions**: Business logic di database level
- **Optimized Indexes**: Performance optimization
- **Data Validation**: Constraint checks di database

## 🔐 Keamanan

### Authentication
- **Supabase Auth**: Email/password authentication
- **JWT Tokens**: Secure session management
- **Role-based Access**: Admin vs Member permissions

### Authorization
- **Row Level Security**: Data isolation per user
- **Policy-based Access**: Granular permissions
- **Audit Logging**: Track all data changes

### Data Protection
- **Input Validation**: Database-level constraints
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Input sanitization

## 📊 API Endpoints

### Activities
```typescript
// Get all activities
GET /activities

// Create activity (Admin only)
POST /activities

// Update activity (Admin only)
PUT /activities/:id

// Delete activity (Admin only)
DELETE /activities/:id

// Register for activity
POST /activities/:id/register

// Get activity stats
GET /activities/:id/stats
```

### Attendance
```typescript
// Mark attendance
POST /attendance

// Get user attendance
GET /attendance/user/:userId

// Get activity attendance
GET /attendance/activity/:activityId
```

### Financial
```typescript
// Get financial summary
GET /rpc/get_financial_summary

// Get transactions
GET /transactions

// Create transaction (Admin only)
POST /transactions

// Approve transaction (Admin only)
PUT /transactions/:id/approve
```

## 🧪 Testing

### Database Connection Test
```bash
npm run db:test
```

### Manual Testing Checklist
- [ ] Login dengan admin dan member
- [ ] CRUD operations untuk semua entities
- [ ] QR code generation dan scanning
- [ ] File upload dan download
- [ ] Financial calculations
- [ ] Audit log tracking
- [ ] RLS policy enforcement

## 🚀 Deployment

### Environment Setup
1. **Production Database**
   - Setup Supabase production project
   - Run migrations
   - Configure RLS policies

2. **Environment Variables**
   ```env
   VITE_SUPABASE_URL=your_production_url
   VITE_SUPABASE_ANON_KEY=your_production_key
   NODE_ENV=production
   ```

3. **Build & Deploy**
   ```bash
   npm run build
   # Deploy dist/ folder to hosting platform
   ```

### Recommended Hosting
- **Vercel**: Optimal for React apps
- **Netlify**: Good alternative with form handling
- **Firebase Hosting**: Google's hosting solution

## 📈 Performance Optimization

### Database
- **Indexes**: Comprehensive indexing strategy
- **Query Optimization**: Efficient joins and filters
- **Connection Pooling**: Supabase handles automatically
- **Caching**: Built-in Supabase caching

### Frontend
- **Code Splitting**: Lazy loading components
- **Image Optimization**: Compressed images
- **Bundle Analysis**: Monitor bundle size
- **Caching Strategy**: Browser and CDN caching

## 🔧 Maintenance

### Regular Tasks
- **Database Backup**: Automated via Supabase
- **Log Monitoring**: Check audit logs regularly
- **Performance Monitoring**: Database metrics
- **Security Updates**: Keep dependencies updated

### Troubleshooting
- **Connection Issues**: Check environment variables
- **Permission Errors**: Verify RLS policies
- **Performance Issues**: Analyze query plans
- **Data Integrity**: Run validation queries

## 📞 Support

### Documentation
- **Setup Guide**: `setup-new-database.md`
- **API Reference**: In-code documentation
- **Database Schema**: Migration files

### Contact
- **Technical Issues**: Check logs and error messages
- **Feature Requests**: Create GitHub issues
- **Security Concerns**: Contact administrators

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 Changelog

### Version 2.0.0 (Current)
- ✅ Enhanced database schema with soft delete
- ✅ Audit trail implementation
- ✅ Improved security with RLS
- ✅ Activity registration system
- ✅ Meeting attendees normalization
- ✅ Financial approval workflow
- ✅ Performance optimizations

### Version 1.0.0
- ✅ Basic CRUD operations
- ✅ Authentication system
- ✅ QR code generation
- ✅ File upload functionality
- ✅ Financial tracking
