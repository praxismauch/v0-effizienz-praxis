import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  const { practiceId } = await params
  const supabase = await createServerClient()

  try {
    const { data: fields, error } = await supabase
      .from("recruiting_form_fields")
      .select("*")
      .eq("practice_id", String(practiceId))
      .order("display_order", { ascending: true })

    if (error) throw error

    return NextResponse.json(fields || [])
  } catch (error) {
    console.error("[v0] Error fetching recruiting fields:", error)
    return NextResponse.json({ error: "Failed to fetch recruiting fields" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  const { practiceId } = await params
  const supabase = await createServerClient()

  try {
    const body = await request.json()
    const { fields } = body

    // Delete all existing fields for this practice
    await supabase.from("recruiting_form_fields").delete().eq("practice_id", String(practiceId))

    // Insert all fields with proper ordering
    const fieldsToInsert = fields.map((field: any, index: number) => ({
      id: field.id,
      practice_id: String(practiceId),
      field_key: field.key,
      field_type: field.type,
      label: field.label,
      required: field.required,
      enabled: field.enabled !== false, // Default to true if not specified
      options: field.options || null,
      display_order: index,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    const { data, error } = await supabase.from("recruiting_form_fields").insert(fieldsToInsert).select()

    if (error) throw error

    return NextResponse.json({ success: true, fields: data })
  } catch (error) {
    console.error("[v0] Error saving recruiting fields:", error)
    return NextResponse.json({ error: "Failed to save recruiting fields" }, { status: 500 })
  }
}
