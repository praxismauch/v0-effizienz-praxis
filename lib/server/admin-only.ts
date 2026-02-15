import "server-only"

/**
 * Server-only admin utilities
 * 
 * This file ensures admin functions are never accidentally imported on the client.
 * If client code tries to import this, the build will fail with a clear error.
 */

import { createAdminClient } from "@/lib/supabase/admin"
import { isSuperAdminRole, isPracticeAdminRole } from "@/lib/auth-utils"

/**
 * Verify the user is a super admin
 * Throws an error if not authenticated or not a super admin
 */
export async function requireSuperAdmin(userId: string) {
  const supabase = await createAdminClient()
  
  const { data: userData, error } = await supabase
    .from("users")
    .select("role, is_active")
    .eq("id", userId)
    .single()
  
  if (error || !userData) {
    throw new Error("User not found")
  }
  
  if (!userData.is_active) {
    throw new Error("User account is inactive")
  }
  
  if (!isSuperAdminRole(userData.role)) {
    throw new Error("Super admin access required")
  }
  
  return userData
}

/**
 * Verify the user is an admin (super admin or practice admin)
 */
export async function requireAdmin(userId: string) {
  const supabase = await createAdminClient()
  
  const { data: userData, error } = await supabase
    .from("users")
    .select("role, is_active, practice_id")
    .eq("id", userId)
    .single()
  
  if (error || !userData) {
    throw new Error("User not found")
  }
  
  if (!userData.is_active) {
    throw new Error("User account is inactive")
  }
  
  if (!isSuperAdminRole(userData.role) && !isPracticeAdminRole(userData.role)) {
    throw new Error("Admin access required")
  }
  
  return userData
}

/**
 * Get admin Supabase client
 * Only usable in server components/actions
 */
export async function getAdminClient() {
  return createAdminClient()
}
