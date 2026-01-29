#!/usr/bin/env node
/**
 * ========================================
 * DIAGNOSTIC SCRIPT 5: Check Supabase Config
 * ========================================
 * This script verifies Supabase environment variables and connection
 */

import { createClient } from '@supabase/supabase-js'

console.log('🔍 DIAGNOSTIC 5: Checking Supabase Configuration\n')

// Check environment variables
console.log('📋 Environment Variables:')
console.log('  NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing')
console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')
console.log('  SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing')
console.log('')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERROR: Missing required Supabase environment variables')
  process.exit(1)
}

// Test anon client connection
console.log('🔌 Testing Anon Client Connection...')
try {
  const anonClient = createClient(supabaseUrl, supabaseAnonKey)
  
  // Test a simple query (this should fail without auth, which is expected)
  const { data, error } = await anonClient.from('users').select('count', { count: 'exact', head: true })
  
  if (error) {
    console.log('  ⚠️  Query failed (expected without auth):', error.message)
  } else {
    console.log('  ✅ Connection successful')
  }
} catch (error) {
  console.error('  ❌ Connection failed:', error.message)
}
console.log('')

// Test service role client if available
if (serviceRoleKey) {
  console.log('🔑 Testing Service Role Client Connection...')
  try {
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    // Test admin query
    const { data, error, count } = await adminClient
      .from('users')
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.error('  ❌ Query failed:', error.message)
    } else {
      console.log('  ✅ Connection successful')
      console.log('  📊 Total users in table:', count)
    }
  } catch (error) {
    console.error('  ❌ Connection failed:', error.message)
  }
} else {
  console.log('⚠️  Service role key not available - skipping admin client test')
}
console.log('')

// Check URL format
console.log('🌐 URL Configuration:')
if (supabaseUrl) {
  try {
    const url = new URL(supabaseUrl)
    console.log('  Protocol:', url.protocol)
    console.log('  Host:', url.host)
    console.log('  ✅ URL format is valid')
  } catch (error) {
    console.error('  ❌ Invalid URL format')
  }
}
console.log('')

console.log('✅ Configuration check complete!')
console.log('')
console.log('📝 Next Steps:')
console.log('  1. If connection failed, check your environment variables')
console.log('  2. Verify the Supabase URL is correct')
console.log('  3. Verify the keys match your Supabase project')
console.log('  4. Run the SQL diagnostic scripts in Supabase SQL Editor')
