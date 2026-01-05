import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { practiceId: string } }) {
  try {
    const supabase = await createAdminClient()
    const url = new URL(request.url)
    const userId = url.searchParams.get("userId")

    const query = supabase
      .from("custom_forms")
      .select(`
        id,
        name,
        description,
        status,
        is_template,
        category,
        created_at,
        updated_at,
        created_by,
        form_fields(id, parameter_id)
      `)
      .eq("practice_id", params.practiceId)

    // Filter by assigned user or created by user if userId is provided
    if (userId) {
      query.or(`created_by.eq.${userId}`)
    }

    const { data: forms, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(forms || [])
  } catch (error) {
    console.error("[v0] Error fetching forms:", error)
    return NextResponse.json({ error: "Failed to fetch forms" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { practiceId: string } }) {
  try {
    const supabase = await createAdminClient()
    const body = await request.json()

    const createdBy = body.createdBy || body.created_by

    const { data: form, error: formError } = await supabase
      .from("custom_forms")
      .insert({
        practice_id: params.practiceId,
        name: body.name,
        description: body.description,
        status: body.isActive ? "active" : "inactive",
        is_template: body.isTemplate || body.is_template || false,
        category: body.category || "general",
        created_by: createdBy,
      })
      .select()
      .single()

    if (formError) {
      return NextResponse.json({ error: formError.message }, { status: 500 })
    }

    // Create form fields for each parameter
    if (body.parameters && body.parameters.length > 0) {
      const fields = body.parameters.map((paramId: string, index: number) => ({
        form_id: form.id,
        parameter_id: paramId,
        field_type: "parameter",
        field_order: index,
        is_required: false,
      }))

      await supabase.from("form_fields").insert(fields)
    }

    return NextResponse.json(form)
  } catch (error) {
    console.error("[v0] Error creating form:", error)
    return NextResponse.json({ error: "Failed to create form" }, { status: 500 })
  }
}
