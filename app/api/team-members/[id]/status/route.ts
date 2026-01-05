import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { is_active } = body

    if (typeof is_active !== "boolean") {
      return NextResponse.json({ error: "is_active muss ein Boolean sein" }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Update team member status
    const { error: teamError } = await supabase
      .from("team_members")
      .update({
        status: is_active ? "active" : "inactive",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (teamError) throw teamError

    // Get the user_id from team_members
    const { data: teamMember } = await supabase.from("team_members").select("user_id").eq("id", id).single()

    // Also update the user's is_active field if user_id exists
    if (teamMember?.user_id) {
      const { error: userError } = await supabase
        .from("users")
        .update({
          is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", teamMember.user_id)

      if (userError) throw userError
    }

    return NextResponse.json({ success: true, is_active })
  } catch (error) {
    console.error("Error updating team member status:", error)
    return NextResponse.json({ error: "Status konnte nicht aktualisiert werden" }, { status: 500 })
  }
}
