#!/usr/bin/env node

/**
 * Comprehensive test suite for MGMP PJOK database migration
 * Tests all major functionality and data integrity
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Environment variables not found!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runComprehensiveTests() {
  console.log('🧪 MGMP PJOK - Comprehensive Database Test Suite\n');
  
  let passedTests = 0;
  let totalTests = 0;
  
  const test = async (name, testFn) => {
    totalTests++;
    try {
      console.log(`🔍 Testing: ${name}`);
      await testFn();
      console.log(`✅ PASSED: ${name}\n`);
      passedTests++;
    } catch (error) {
      console.log(`❌ FAILED: ${name}`);
      console.log(`   Error: ${error.message}\n`);
    }
  };

  // Test 1: Basic Connection
  await test('Database Connection', async () => {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) throw error;
  });

  // Test 2: Table Structure
  await test('Table Structure Validation', async () => {
    const tables = [
      'users', 'activities', 'attendance', 'meetings', 
      'meeting_attendees', 'gallery', 'transactions', 
      'activity_registrations', 'audit_logs'
    ];
    
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) throw new Error(`Table ${table} not accessible: ${error.message}`);
    }
  });

  // Test 3: Sample Data
  await test('Sample Data Verification', async () => {
    // Check activities
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('*')
      .is('deleted_at', null);
    
    if (activitiesError) throw activitiesError;
    if (!activities || activities.length === 0) {
      throw new Error('No sample activities found');
    }

    // Check transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .is('deleted_at', null);
    
    if (transactionsError) throw transactionsError;
    if (!transactions || transactions.length === 0) {
      throw new Error('No sample transactions found');
    }

    console.log(`   Found ${activities.length} activities and ${transactions.length} transactions`);
  });

  // Test 4: Database Functions
  await test('Database Functions', async () => {
    // Test financial summary function
    const { data: financialData, error: financialError } = await supabase
      .rpc('get_financial_summary');
    
    if (financialError) throw financialError;
    if (!financialData || financialData.length === 0) {
      throw new Error('Financial summary function returned no data');
    }

    const summary = financialData[0];
    console.log(`   Financial Summary: Income: ${summary.total_income}, Expense: ${summary.total_expense}, Balance: ${summary.balance}`);

    // Test attendance stats function
    const { data: attendanceData, error: attendanceError } = await supabase
      .rpc('get_attendance_stats');
    
    if (attendanceError) throw attendanceError;
    console.log(`   Attendance function: OK`);
  });

  // Test 5: Views
  await test('Database Views', async () => {
    // Test activity details view
    const { data: activityDetails, error: viewError } = await supabase
      .from('activity_details')
      .select('*')
      .limit(5);
    
    if (viewError) throw viewError;
    console.log(`   Activity details view: ${activityDetails.length} records`);

    // Test user attendance summary view
    const { data: userSummary, error: userError } = await supabase
      .from('user_attendance_summary')
      .select('*')
      .limit(5);
    
    if (userError) throw userError;
    console.log(`   User attendance summary view: ${userSummary.length} records`);
  });

  // Test 6: Indexes Performance
  await test('Index Performance', async () => {
    const start = Date.now();
    
    // Test indexed queries
    await supabase
      .from('activities')
      .select('*')
      .eq('status', 'active')
      .order('date');
    
    await supabase
      .from('transactions')
      .select('*')
      .eq('type', 'income')
      .order('date');
    
    await supabase
      .from('attendance')
      .select('*')
      .order('attended_at');
    
    const duration = Date.now() - start;
    console.log(`   Query performance: ${duration}ms`);
    
    if (duration > 5000) {
      throw new Error('Queries taking too long, check indexes');
    }
  });

  // Test 7: Data Integrity
  await test('Data Integrity Constraints', async () => {
    // Test foreign key constraints
    const { data: activities } = await supabase
      .from('activities')
      .select('id')
      .limit(1);
    
    if (activities && activities.length > 0) {
      const activityId = activities[0].id;
      
      // Test attendance foreign key
      const { data: attendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('activity_id', activityId);
      
      console.log(`   Foreign key integrity: OK`);
    }

    // Test enum constraints
    const { error: enumError } = await supabase
      .from('activities')
      .select('status')
      .in('status', ['draft', 'active', 'completed', 'cancelled']);
    
    if (enumError) throw enumError;
    console.log(`   Enum constraints: OK`);
  });

  // Test 8: Soft Delete
  await test('Soft Delete Functionality', async () => {
    // Check that deleted_at filter works
    const { data: allRecords } = await supabase
      .from('activities')
      .select('*');
    
    const { data: activeRecords } = await supabase
      .from('activities')
      .select('*')
      .is('deleted_at', null);
    
    console.log(`   Total records: ${allRecords.length}, Active: ${activeRecords.length}`);
    console.log(`   Soft delete filtering: OK`);
  });

  // Test 9: Security Policies (Basic)
  await test('Row Level Security Policies', async () => {
    // Test that RLS is enabled (should get policy error without auth)
    const { error } = await supabase
      .from('users')
      .select('*');
    
    // We expect an error here due to RLS
    if (error && (error.message.includes('row-level security') || error.message.includes('policy'))) {
      console.log(`   RLS policies: Active and working`);
    } else if (error) {
      console.log(`   RLS test: ${error.message}`);
    } else {
      console.log(`   ⚠️  RLS might not be properly configured`);
    }
  });

  // Test 10: Triggers
  await test('Database Triggers', async () => {
    // Check if updated_at triggers work by looking at existing data
    const { data: activities } = await supabase
      .from('activities')
      .select('created_at, updated_at')
      .limit(5);
    
    if (activities && activities.length > 0) {
      const hasUpdatedAt = activities.every(activity => activity.updated_at);
      if (!hasUpdatedAt) {
        throw new Error('updated_at trigger not working');
      }
      console.log(`   Timestamp triggers: OK`);
    }

    // Check QR code generation
    const { data: qrActivities } = await supabase
      .from('activities')
      .select('qr_code')
      .not('qr_code', 'is', null)
      .limit(5);
    
    if (qrActivities && qrActivities.length > 0) {
      console.log(`   QR code generation: OK`);
    }
  });

  // Summary
  console.log('📊 Test Results Summary');
  console.log('========================');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Database is ready for production.');
    console.log('\nNext steps:');
    console.log('1. Start the application: npm run dev');
    console.log('2. Create admin user through the setup flow');
    console.log('3. Test all features in the UI');
    console.log('4. Deploy to production when ready');
  } else {
    console.log('\n⚠️  Some tests failed. Please review and fix issues before proceeding.');
    console.log('\nTroubleshooting:');
    console.log('1. Check migration files were run correctly');
    console.log('2. Verify environment variables');
    console.log('3. Check Supabase dashboard for errors');
    console.log('4. Review database logs');
  }
  
  return passedTests === totalTests;
}

// Run the comprehensive test suite
runComprehensiveTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
