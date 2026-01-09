import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SocialMediaPageClient } from "./page-client"

export default async function SocialMediaPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is super admin
  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

  if (userData?.role !== "super_admin") {
    redirect("/dashboard")
  }

  return <SocialMediaPageClient />
}
