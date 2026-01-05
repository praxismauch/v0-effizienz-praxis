import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { ReactNode } from "react"
import { SuperAdminLayout } from "@/components/super-admin-layout"
import { isSuperAdminRole } from "@/lib/auth-utils"

export default async function SuperAdminRootLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()

  // Auth Check
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/super-admin")
  }

  // Super Admin Check
  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()

  if (!isSuperAdminRole(userData?.role)) {
    redirect("/dashboard?error=access_denied")
  }

  return <SuperAdminLayout>{children}</SuperAdminLayout>
}
