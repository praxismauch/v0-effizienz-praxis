import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string }> },
) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("practice_invites")
      .select("*")
      .eq("practice_id", practiceId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error fetching invites:", error)
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string }> },
) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()
    const body = await request.json()

    const { email, role } = body

    if (!email) {
      return NextResponse.json({ error: "E-Mail ist erforderlich" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("practice_invites")
      .insert({
        practice_id: practiceId,
        email,
        role: role || "employee",
        status: "pending",
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error creating invite:", error)
    return NextResponse.json({ error: "Fehler beim Erstellen" }, { status: 500 })
  }
}
