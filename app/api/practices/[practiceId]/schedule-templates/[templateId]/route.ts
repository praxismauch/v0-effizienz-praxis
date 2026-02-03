import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ practiceId: string; templateId: string }> }
) {
  try {
    const { practiceId, templateId } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("schedule_templates")
      .select("*")
      .eq("id", templateId)
      .eq("practice_id", practiceId)
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error fetching schedule template:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ practiceId: string; templateId: string }> }
) {
  try {
    const { practiceId, templateId } = await params
    const body = await request.json()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("schedule_templates")
      .update({
        name: body.name,
        description: body.description,
        shifts: body.shifts,
        is_default: body.is_default,
        updated_at: new Date().toISOString(),
      })
      .eq("id", templateId)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error updating schedule template:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ practiceId: string; templateId: string }> }
) {
  try {
    const { practiceId, templateId } = await params
    const supabase = await createClient()

    const { error } = await supabase
      .from("schedule_templates")
      .delete()
      .eq("id", templateId)
      .eq("practice_id", practiceId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting schedule template:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
