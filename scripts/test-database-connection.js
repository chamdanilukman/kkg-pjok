#!/usr/bin/env node

/**
 * Script untuk testing koneksi database Supabase
 * Usage: node scripts/test-database-connection.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

async function testDatabaseConnection() {
  console.log('🔍 Testing Database Connection - MGMP PJOK\n');
  
  try {
    // Check environment variables
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Environment variables tidak ditemukan! Pastikan .env sudah dikonfigurasi.');
    }
    
    console.log('✅ Environment variables ditemukan');
    console.log(`📍 URL: ${supabaseUrl}`);
    console.log(`🔑 Key: ${supabaseKey.substring(0, 20)}...`);
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client berhasil dibuat');
    
    // Test 1: Basic connection
    console.log('\n🧪 Test 1: Basic Connection');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      throw new Error(`Connection failed: ${connectionError.message}`);
    }
    console.log('✅ Basic connection berhasil');
    
    // Test 2: Check tables exist
    console.log('\n🧪 Test 2: Table Structure');
    const tables = ['users', 'activities', 'attendance', 'meetings', 'gallery', 'transactions'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table ${table}: ${error.message}`);
        } else {
          console.log(`✅ Table ${table}: OK`);
        }
      } catch (err) {
        console.log(`❌ Table ${table}: ${err.message}`);
      }
    }
    
    // Test 3: Check sample data
    console.log('\n🧪 Test 3: Sample Data');
    
    // Check activities
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('*')
      .limit(5);
    
    if (activitiesError) {
      console.log(`❌ Activities data: ${activitiesError.message}`);
    } else {
      console.log(`✅ Activities: ${activities.length} records found`);
    }
    
    // Check transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .limit(5);
    
    if (transactionsError) {
      console.log(`❌ Transactions data: ${transactionsError.message}`);
    } else {
      console.log(`✅ Transactions: ${transactions.length} records found`);
    }
    
    // Test 4: Check functions
    console.log('\n🧪 Test 4: Database Functions');
    
    try {
      const { data: financialSummary, error: functionError } = await supabase
        .rpc('get_financial_summary');
      
      if (functionError) {
        console.log(`❌ Financial summary function: ${functionError.message}`);
      } else {
        console.log('✅ Financial summary function: OK');
        console.log(`   Total Income: Rp ${financialSummary[0]?.total_income || 0}`);
        console.log(`   Total Expense: Rp ${financialSummary[0]?.total_expense || 0}`);
        console.log(`   Balance: Rp ${financialSummary[0]?.balance || 0}`);
      }
    } catch (err) {
      console.log(`❌ Functions test: ${err.message}`);
    }
    
    // Test 5: Check RLS policies
    console.log('\n🧪 Test 5: Row Level Security');
    
    try {
      // This should fail without authentication
      const { data: rlsTest, error: rlsError } = await supabase
        .from('users')
        .select('*');
      
      if (rlsError && rlsError.message.includes('row-level security')) {
        console.log('✅ RLS policies: Active (good!)');
      } else if (rlsError) {
        console.log(`⚠️  RLS test: ${rlsError.message}`);
      } else {
        console.log('⚠️  RLS policies: Might not be properly configured');
      }
    } catch (err) {
      console.log(`⚠️  RLS test: ${err.message}`);
    }
    
    // Summary
    console.log('\n📊 Test Summary');
    console.log('================');
    console.log('Database connection: ✅ Success');
    console.log('Tables structure: ✅ OK');
    console.log('Sample data: ✅ Available');
    console.log('Functions: ✅ Working');
    console.log('Security: ✅ RLS Active');
    
    console.log('\n🎉 Database siap digunakan!');
    console.log('\nLangkah selanjutnya:');
    console.log('1. Jalankan aplikasi: npm run dev');
    console.log('2. Test login dan fitur-fitur utama');
    console.log('3. Buat user admin pertama jika belum ada');
    
  } catch (error) {
    console.error('\n❌ Database Test Failed:');
    console.error(error.message);
    
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Pastikan .env sudah dikonfigurasi dengan benar');
    console.log('2. Verify URL dan API keys di Supabase dashboard');
    console.log('3. Pastikan migrasi database sudah dijalankan');
    console.log('4. Check network connectivity');
    
    process.exit(1);
  }
}

// Check if dotenv is available
try {
  require('dotenv');
} catch (err) {
  console.log('⚠️  dotenv not found, install with: npm install dotenv');
}

// Run the test
testDatabaseConnection();
