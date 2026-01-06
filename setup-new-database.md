# 🗄️ Setup Database Supabase Baru - MGMP PJOK

## 📋 Checklist Migrasi Database

### 1. ✅ Persiapan Project Supabase Baru

1. **Buat Project Baru di Supabase:**
   - Buka [supabase.com](https://supabase.com)
   - Klik "New Project"
   - Nama: `mgmp-pjok-grobogan`
   - Region: `Southeast Asia (Singapore)`
   - Database Password: **SIMPAN PASSWORD INI DENGAN AMAN**

2. **Dapatkan Credentials:**
   - Project URL: `https://[project-ref].supabase.co`
   - Anon Key: (dari Settings > API)
   - Service Role Key: (dari Settings > API) - **JANGAN COMMIT KE GIT**

### 2. ✅ Update Environment Variables

Update file `.env` dengan credentials baru:

```env
# Database Baru
VITE_SUPABASE_URL=https://[your-project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=[your-anon-key]

# Service Role Key (untuk migrasi data) - JANGAN COMMIT KE GIT
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
```

### 3. ✅ Jalankan Migrasi Schema

Jalankan file SQL berikut secara berurutan di SQL Editor Supabase:

1. **Schema Utama:**
   ```sql
   -- Copy dan paste isi file: 20250919_new_improved_schema.sql
   ```

2. **Indexes dan Functions:**
   ```sql
   -- Copy dan paste isi file: 20250919_indexes_functions.sql
   ```

3. **Data Sample:**
   ```sql
   -- Copy dan paste isi file: 20250919_sample_data.sql
   ```

### 4. ✅ Konfigurasi Storage (Opsional)

Jika menggunakan file upload:

1. Buka Storage di dashboard Supabase
2. Buat bucket baru: `gallery`
3. Set bucket sebagai public
4. Konfigurasi RLS policies untuk bucket

### 5. ✅ Testing Koneksi

Test koneksi database baru:

```bash
cd project
npm run dev
```

Pastikan:
- [ ] Login berfungsi
- [ ] Dashboard menampilkan data
- [ ] CRUD operations berfungsi
- [ ] RLS policies bekerja dengan benar

## 🔧 Perbaikan yang Diimplementasikan

### ✨ Schema Improvements

1. **Soft Delete Support:**
   - Semua tabel memiliki `deleted_at` field
   - Queries otomatis filter data yang tidak dihapus

2. **Enhanced Validation:**
   - Check constraints untuk data integrity
   - Proper data types dan length validation

3. **Normalisasi Data:**
   - Meeting attendees dinormalisasi ke tabel terpisah
   - Better relationship management

4. **Activity Status:**
   - Status: draft, active, completed, cancelled
   - Registration deadline tracking
   - Max participants limit

5. **Audit Logging:**
   - Automatic audit trail untuk semua perubahan data
   - User tracking untuk accountability

### 🚀 Performance Optimizations

1. **Comprehensive Indexing:**
   - Indexes untuk semua foreign keys
   - Composite indexes untuk query kompleks
   - Partial indexes untuk soft delete

2. **Optimized Queries:**
   - Views untuk query yang sering digunakan
   - Functions untuk business logic

3. **Better Data Types:**
   - Proper decimal precision untuk money
   - Enum types untuk validation
   - JSONB untuk flexible data

### 🔒 Security Enhancements

1. **Enhanced RLS Policies:**
   - Granular access control
   - Soft delete aware policies
   - Admin vs member permissions

2. **Data Validation:**
   - Input validation di database level
   - Constraint checks
   - Proper foreign key relationships

## 📊 New Features Available

### 1. Activity Registration System
- Users dapat register untuk activities
- Tracking registration status
- Waitlist support

### 2. Enhanced Meeting Management
- Normalized attendees
- Attendance status tracking
- Meeting types categorization

### 3. Audit Trail
- Complete change tracking
- User accountability
- Data history

### 4. Financial Reporting
- Built-in financial summary functions
- Category-based reporting
- Approval workflow ready

### 5. Attendance Analytics
- Attendance rate calculations
- User attendance summaries
- Activity performance metrics

## 🔄 Migration Commands

Jika menggunakan Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Login ke Supabase
supabase login

# Link ke project baru
supabase link --project-ref [your-project-ref]

# Push migrations
supabase db push

# Generate types (opsional)
supabase gen types typescript --local > types/supabase.ts
```

## ⚠️ Important Notes

1. **Backup Data Lama:**
   - Export data dari database lama sebelum migrasi
   - Simpan credentials lama sebagai backup

2. **Environment Variables:**
   - Jangan commit service role key ke git
   - Gunakan .env.local untuk development

3. **Testing:**
   - Test semua fitur setelah migrasi
   - Verify RLS policies bekerja dengan benar
   - Check performance dengan data sample

4. **Production Deployment:**
   - Update environment variables di hosting platform
   - Test di staging environment dulu
   - Monitor error logs setelah deployment

## 🆘 Troubleshooting

### Connection Issues:
- Verify URL dan API keys
- Check network connectivity
- Ensure project is not paused

### Permission Issues:
- Check RLS policies
- Verify user roles
- Test with different user types

### Performance Issues:
- Check query execution plans
- Verify indexes are being used
- Monitor database metrics

## 📞 Support

Jika ada masalah:
1. Check Supabase dashboard logs
2. Review migration files
3. Test dengan data minimal
4. Contact support jika diperlukan
