import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { isSuperAdminRole } from "@/lib/auth-utils"

export async function checkSuperAdmin(redirectOnFail = true) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    if (redirectOnFail) {
      redirect("/auth/login?redirect=/super-admin")
    }
    return { user: null, isSuperAdmin: false }
  }

  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()

  const isSuperAdmin = isSuperAdminRole(userData?.role)

  if (!isSuperAdmin && redirectOnFail) {
    redirect("/dashboard?error=access_denied")
  }

  return { user, isSuperAdmin }
}

export async function requireSuperAdmin() {
  const { user, isSuperAdmin } = await checkSuperAdmin(true)

  if (!isSuperAdmin) {
    throw new Error("Super Admin access required")
  }

  return user!
}
