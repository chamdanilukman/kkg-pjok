#!/usr/bin/env node

/**
 * Script untuk update konfigurasi database Supabase
 * Usage: node scripts/update-database-config.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function updateDatabaseConfig() {
  console.log('🗄️  MGMP PJOK - Database Configuration Update\n');
  
  try {
    // Get new database credentials
    console.log('Masukkan credentials database Supabase baru:');
    const newUrl = await question('Supabase URL: ');
    const newAnonKey = await question('Anon Key: ');
    const serviceRoleKey = await question('Service Role Key (opsional): ');
    
    // Validate inputs
    if (!newUrl || !newAnonKey) {
      throw new Error('URL dan Anon Key harus diisi!');
    }
    
    if (!newUrl.includes('supabase.co')) {
      throw new Error('URL tidak valid! Harus berupa URL Supabase.');
    }
    
    // Read current .env file
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Backup old .env
    const backupPath = path.join(__dirname, '..', '.env.backup');
    if (envContent) {
      fs.writeFileSync(backupPath, envContent);
      console.log('✅ Backup .env lama disimpan ke .env.backup');
    }
    
    // Create new .env content
    const newEnvContent = `# MGMP PJOK Database Configuration
# Generated on ${new Date().toISOString()}

# Database Baru
VITE_SUPABASE_URL=${newUrl}
VITE_SUPABASE_ANON_KEY=${newAnonKey}

# Service Role Key (untuk admin operations) - JANGAN COMMIT KE GIT
${serviceRoleKey ? `SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey}` : '# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key'}

# Development Settings
NODE_ENV=development
VITE_APP_NAME=MGMP PJOK Grobogan
VITE_APP_VERSION=2.0.0
`;
    
    // Write new .env file
    fs.writeFileSync(envPath, newEnvContent);
    console.log('✅ File .env berhasil diupdate');
    
    // Update .env.example
    const envExampleContent = `# MGMP PJOK Database Configuration Template
# Copy file ini ke .env dan isi dengan credentials yang sesuai

# Database Supabase
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Service Role Key (untuk admin operations) - JANGAN COMMIT KE GIT
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Development Settings
NODE_ENV=development
VITE_APP_NAME=MGMP PJOK Grobogan
VITE_APP_VERSION=2.0.0
`;
    
    const envExamplePath = path.join(__dirname, '..', '.env.example');
    fs.writeFileSync(envExamplePath, envExampleContent);
    console.log('✅ File .env.example berhasil dibuat');
    
    // Update .gitignore to ensure .env is ignored
    const gitignorePath = path.join(__dirname, '..', '.gitignore');
    let gitignoreContent = '';
    
    if (fs.existsSync(gitignorePath)) {
      gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    }
    
    if (!gitignoreContent.includes('.env')) {
      gitignoreContent += '\n# Environment variables\n.env\n.env.local\n.env.backup\n';
      fs.writeFileSync(gitignorePath, gitignoreContent);
      console.log('✅ .gitignore diupdate untuk mengabaikan file .env');
    }
    
    console.log('\n🎉 Konfigurasi database berhasil diupdate!');
    console.log('\nLangkah selanjutnya:');
    console.log('1. Jalankan migrasi database di Supabase dashboard');
    console.log('2. Test koneksi dengan: npm run dev');
    console.log('3. Verify semua fitur berfungsi dengan benar');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the script
updateDatabaseConfig();
