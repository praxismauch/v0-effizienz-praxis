import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { practiceId: string; goalId: string } }) {
  try {
    const supabase = await createServerClient()

    const { data: attachments, error } = await supabase
      .from("goal_attachments")
      .select("*")
      .eq("practice_id", params.practiceId)
      .eq("goal_id", params.goalId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })

    if (error) throw error

    return NextResponse.json(attachments)
  } catch (error) {
    console.error("Error fetching goal attachments:", error)
    return NextResponse.json({ error: "Failed to fetch attachments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { practiceId: string; goalId: string } }) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: attachment, error } = await supabase
      .from("goal_attachments")
      .insert({
        practice_id: params.practiceId,
        goal_id: params.goalId,
        attachment_type: body.attachment_type,
        file_url: body.file_url,
        file_name: body.file_name,
        file_size: body.file_size,
        file_type: body.file_type,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(attachment)
  } catch (error) {
    console.error("Error creating goal attachment:", error)
    return NextResponse.json({ error: "Failed to create attachment" }, { status: 500 })
  }
}
