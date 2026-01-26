import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET all anweisungen for an arbeitsplatz
export async function GET(
  request: Request,
  { params }: { params: Promise<{ practiceId: string; id: string }> }
) {
  const { practiceId, id } = await params

  try {
    const supabase = await createClient()

    const { data: anweisungen, error } = await supabase
      .from("arbeitsplatz_anweisungen")
      .select("*")
      .eq("arbeitsplatz_id", id)
      .order("sort_order", { ascending: true })

    if (error) throw error

    return NextResponse.json({ anweisungen: anweisungen || [] })
  } catch (error: any) {
    console.error("Error fetching anweisungen:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST create new anweisung
export async function POST(
  request: Request,
  { params }: { params: Promise<{ practiceId: string; id: string }> }
) {
  const { practiceId, id } = await params

  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data: anweisung, error } = await supabase
      .from("arbeitsplatz_anweisungen")
      .insert({
        arbeitsplatz_id: id,
        title: body.title,
        content: body.content || "",
        sort_order: body.sort_order || 0,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(anweisung)
  } catch (error: any) {
    console.error("Error creating anweisung:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
