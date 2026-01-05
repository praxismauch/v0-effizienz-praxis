import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { ReactNode } from "react"

export default async function TicketsLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()

  // Auth & Super Admin Check (additional layer)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/super-admin/tickets")
  }

  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()

  const isSuperAdmin = userData?.role === "super_admin" || userData?.role === "superadmin"

  if (!isSuperAdmin) {
    redirect("/dashboard?error=access_denied")
  }

  return <>{children}</>
}
