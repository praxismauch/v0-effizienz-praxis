#!/usr/bin/env node
/**
 * ========================================
 * DIAGNOSTIC SCRIPT 6: Simulate Auth Flow
 * ========================================
 * This script simulates the authentication flow to identify where it breaks
 */

import { createClient } from '@supabase/supabase-js'

console.log('🔍 DIAGNOSTIC 6: Simulating Authentication Flow\n')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERROR: Missing Supabase environment variables')
  process.exit(1)
}

// Create clients
const anonClient = createClient(supabaseUrl, supabaseAnonKey)
const adminClient = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
}) : null

console.log('Step 1: Check if there are any authenticated users\n')

if (adminClient) {
  try {
    // Get the most recent user from auth.users
    const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError.message)
    } else {
      console.log(`✅ Found ${authUsers.users.length} authenticated users`)
      
      if (authUsers.users.length > 0) {
        const testUser = authUsers.users[0]
        console.log(`\nStep 2: Testing with user: ${testUser.email} (ID: ${testUser.id})\n`)
        
        // Check if this user has a profile
        console.log('Step 3: Checking if user has a profile in public.users table...')
        const { data: profile, error: profileError } = await adminClient
          .from('users')
          .select('*')
          .eq('id', testUser.id)
          .single()
        
        if (profileError) {
          if (profileError.code === 'PGRST116') {
            console.error('❌ PROBLEM FOUND: User exists in auth but has NO profile in public.users')
            console.error('   This is exactly the issue described in the analysis!')
            console.error('   User ID:', testUser.id)
            console.error('   User Email:', testUser.email)
            console.log('\n📋 Root Cause:')
            console.log('   - User authenticated successfully in Supabase Auth')
            console.log('   - BUT no corresponding row in public.users table')
            console.log('   - The middleware/auth code tries to query users table')
            console.log('   - Query returns PGRST116 (no rows) or an error')
            console.log('   - Auto-create logic NEVER runs because error throws first')
            console.log('\n✅ Solution:')
            console.log('   - Run the fix script to create missing profiles')
            console.log('   - Add a database trigger to auto-create profiles on signup')
          } else {
            console.error('❌ Error querying profile:', profileError.message)
            console.error('   Code:', profileError.code)
            console.error('   Details:', profileError.details)
          }
        } else if (!profile) {
          console.error('❌ PROBLEM FOUND: Query succeeded but returned null')
          console.error('   User exists in auth but has NO profile')
        } else {
          console.log('✅ User has a profile:')
          console.log('   ID:', profile.id)
          console.log('   Email:', profile.email)
          console.log('   Name:', profile.name)
          console.log('   Role:', profile.role)
          console.log('   Created:', profile.created_at)
          console.log('\n✅ This user should be able to log in successfully')
        }
        
        // Test RLS policies
        console.log('\nStep 4: Testing RLS policies...')
        const { data: allProfiles, error: rlsError } = await adminClient
          .from('users')
          .select('count', { count: 'exact', head: true })
        
        if (rlsError) {
          console.error('❌ RLS policy error:', rlsError.message)
        } else {
          console.log(`✅ RLS policies working - can query users table`)
        }
      } else {
        console.log('⚠️  No authenticated users found in auth.users')
        console.log('   No one has signed up yet, or auth.users is empty')
      }
    }
  } catch (error) {
    console.error('❌ Error during simulation:', error.message)
  }
} else {
  console.log('⚠️  Service role key not available')
  console.log('   Cannot check auth users without service role key')
  console.log('   Please add SUPABASE_SERVICE_ROLE_KEY to your environment variables')
}

console.log('\n📊 Summary:')
console.log('   This script simulates what happens when a user tries to log in')
console.log('   It checks if authenticated users have profiles in public.users')
console.log('   If profiles are missing, that explains the redirect loop')
