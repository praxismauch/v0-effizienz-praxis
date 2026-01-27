import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  const { practiceId } = await params
  const supabase = await createClient()

  try {
    const { data: surveys, error } = await supabase
      .from("anonymous_mood_surveys")
      .select("*")
      .eq("practice_id", practiceId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ surveys: surveys || [] })
  } catch (error) {
    console.error("Error fetching surveys:", error)
    return NextResponse.json({ surveys: [] })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  const { practiceId } = await params
  const supabase = await createClient()
  const body = await request.json()

  try {
    const { data, error } = await supabase
      .from("anonymous_mood_surveys")
      .insert({
        practice_id: practiceId,
        title: body.title || "Wöchentliche Stimmungsumfrage",
        description: body.description || "Anonyme Umfrage zur Team-Stimmung",
        survey_type: body.survey_type || "weekly",
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ survey: data })
  } catch (error) {
    console.error("Error creating survey:", error)
    return NextResponse.json({ error: "Failed to create survey" }, { status: 500 })
  }
}
