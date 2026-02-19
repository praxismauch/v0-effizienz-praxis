import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ practiceId: string }> }
) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("shift_templates")
      .select("*")
      .eq("practice_id", practiceId)
      .order("created_at", { ascending: false })

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === "42P01" || error.code === "PGRST204") {
        return NextResponse.json({ templates: [] })
      }
      throw error
    }

    return NextResponse.json({ templates: data || [] })
  } catch (error: any) {
    console.error("Error fetching schedule templates:", error)
    return NextResponse.json({ templates: [], error: error.message }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ practiceId: string }> }
) {
  try {
    const { practiceId } = await params
    const body = await request.json()
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("shift_templates")
      .insert({
        practice_id: practiceId,
        name: body.name,
        description: body.description,
        shifts: body.shifts,
        is_default: body.is_default || false,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating schedule template:", error)
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error creating schedule template:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
