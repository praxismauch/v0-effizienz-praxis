import { createServerClient } from "@/lib/supabase/server"

export async function checkAIEnabled(
  practiceId: string,
  userId: string,
): Promise<{ enabled: boolean; isSuperAdmin: boolean }> {
  const supabase = await createServerClient()

  // Check if user is super admin
  const { data: userData } = await supabase.from("users").select("role").eq("id", userId).maybeSingle()

  const isSuperAdmin = userData?.role === "super_admin"

  // Super admins always have AI access
  if (isSuperAdmin) {
    return { enabled: true, isSuperAdmin: true }
  }

  // Check practice AI setting from practice_settings table
  const { data: settingsData } = await supabase
    .from("practice_settings")
    .select("system_settings")
    .eq("practice_id", practiceId)
    .maybeSingle()

  // Default to enabled if no settings found
  const aiEnabled = settingsData?.system_settings?.aiEnabled ?? true

  return { enabled: aiEnabled, isSuperAdmin: false }
}
