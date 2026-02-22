import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createAdminClient()

    const { data: templates, error } = await supabase
      .from("test_checklist_templates")
      .select(`
        *,
        testing_categories (
          id,
          name,
          color
        )
      `)
      .order("display_order", { ascending: true })

    if (error) throw error

    return NextResponse.json(templates)
  } catch (error) {
    console.error("[v0] Error fetching test templates:", error)
    return NextResponse.json({ error: "Failed to fetch test templates" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createAdminClient()
    const body = await request.json()

    if (body.category_id && typeof body.category_id === "string") {
      // Check if it's a UUID format, if not try to find the category by name
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(body.category_id)) {
        const { data: category, error: categoryError } = await supabase
          .from("testing_categories")
          .select("id")
          .eq("name", body.category_id)
          .single()

        if (categoryError || !category) {
          console.error("[v0] Could not find category with name:", body.category_id)
          return NextResponse.json({ error: `Category not found: ${body.category_id}` }, { status: 400 })
        }

        body.category_id = category.id
      }
    }

    const { data, error } = await supabase
      .from("test_checklist_templates")
      .insert({
        title: body.title,
        description: body.description,
        category_id: body.category_id || null,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Supabase error creating template:", error)
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error creating test template:", error)
    return NextResponse.json({ error: "Failed to create test template" }, { status: 500 })
  }
}
