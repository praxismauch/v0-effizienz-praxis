"use server"

import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"

export async function updateTeamMember(memberId: string, data: any) {
  try {
    const supabase = await createServerClient()
    
    const { data: updated, error } = await supabase
      .from("team_members")
      .update(data)
      .eq("id", memberId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating team member:", error)
      return { success: false, error: error.message }
    }

    // Revalidate relevant paths
    revalidatePath("/team")
    revalidatePath(`/team/${memberId}`)
    revalidatePath(`/team/${memberId}/edit`)
    
    return { success: true, data: updated }
  } catch (error: any) {
    console.error("[v0] Error in updateTeamMember action:", error)
    return { success: false, error: error.message }
  }
}

export async function deleteTeamMember(memberId: string) {
  try {
    const supabase = await createServerClient()
    
    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("id", memberId)

    if (error) {
      console.error("[v0] Error deleting team member:", error)
      return { success: false, error: error.message }
    }

    // Revalidate team page
    revalidatePath("/team")
    
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error in deleteTeamMember action:", error)
    return { success: false, error: error.message }
  }
}
