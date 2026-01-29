#!/usr/bin/env node
/**
 * ========================================
 * FIX SCRIPT: Create Missing Profiles
 * ========================================
 * This script creates profiles for users who exist in auth.users but not in public.users
 */

import { createClient } from '@supabase/supabase-js'
import readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

console.log('🔧 FIX SCRIPT: Create Missing Profiles\n')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ ERROR: Missing required environment variables')
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function findOrphanedUsers() {
  console.log('🔍 Step 1: Finding users without profiles...\n')
  
  try {
    // Get all auth users
    const { data: authData, error: authError } = await adminClient.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError.message)
      return []
    }
    
    console.log(`✅ Found ${authData.users.length} authenticated users`)
    
    // Get all profiles
    const { data: profiles, error: profileError } = await adminClient
      .from('users')
      .select('id')
    
    if (profileError) {
      console.error('❌ Error fetching profiles:', profileError.message)
      return []
    }
    
    console.log(`✅ Found ${profiles.length} existing profiles`)
    
    // Find orphaned users
    const profileIds = new Set(profiles.map(p => p.id))
    const orphanedUsers = authData.users.filter(user => !profileIds.has(user.id))
    
    console.log(`\n📊 Result: ${orphanedUsers.length} users need profiles\n`)
    
    return orphanedUsers
  } catch (error) {
    console.error('❌ Error:', error.message)
    return []
  }
}

async function createProfile(user) {
  console.log(`\n  Creating profile for: ${user.email}`)
  console.log(`  User ID: ${user.id}`)
  
  const profile = {
    id: user.id,
    email: user.email,
    name: user.user_metadata?.name || user.email.split('@')[0],
    first_name: user.user_metadata?.first_name || null,
    last_name: user.user_metadata?.last_name || null,
    role: user.user_metadata?.role || 'member',
    avatar: user.user_metadata?.avatar || null,
    practice_id: user.user_metadata?.practice_id || null,
    is_active: true,
    preferred_language: user.user_metadata?.preferred_language || 'de',
    created_at: user.created_at,
    updated_at: new Date().toISOString()
  }
  
  const { data, error } = await adminClient
    .from('users')
    .insert([profile])
    .select()
  
  if (error) {
    console.error(`  ❌ Failed to create profile:`, error.message)
    return false
  }
  
  console.log(`  ✅ Profile created successfully`)
  return true
}

async function run() {
  const orphanedUsers = await findOrphanedUsers()
  
  if (orphanedUsers.length === 0) {
    console.log('✅ All users have profiles! Nothing to fix.')
    rl.close()
    return
  }
  
  console.log('📋 Users without profiles:')
  orphanedUsers.forEach((user, index) => {
    console.log(`  ${index + 1}. ${user.email} (ID: ${user.id})`)
  })
  
  const answer = await question('\n⚠️  Do you want to create profiles for these users? (yes/no): ')
  
  if (answer.toLowerCase() !== 'yes') {
    console.log('\n❌ Operation cancelled')
    rl.close()
    return
  }
  
  console.log('\n🔧 Creating profiles...')
  
  let successCount = 0
  let failCount = 0
  
  for (const user of orphanedUsers) {
    const success = await createProfile(user)
    if (success) {
      successCount++
    } else {
      failCount++
    }
  }
  
  console.log('\n📊 Summary:')
  console.log(`  ✅ Successfully created: ${successCount}`)
  console.log(`  ❌ Failed: ${failCount}`)
  console.log('')
  
  if (successCount > 0) {
    console.log('✅ Profiles created! Users should now be able to log in.')
    console.log('   Please refresh your application and try logging in again.')
  }
  
  rl.close()
}

run().catch(error => {
  console.error('❌ Fatal error:', error)
  rl.close()
  process.exit(1)
})
