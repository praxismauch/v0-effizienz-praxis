import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - Fetch all global KPI categories
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: categories, error } = await supabase
      .from("global_parameter_groups")
      .select("*")
      .eq("is_template", true)
      .is("practice_id", null)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Supabase error fetching global parameter groups:", error)
      return NextResponse.json(
        {
          error: "Database query failed",
          details: error.message,
          hint: error.hint,
          code: error.code,
        },
        { status: 500 },
      )
    }

    const parsedCategories = (categories || []).map((category: any) => ({
      ...category,
      parameters: category.parameters || [],
    }))

    return NextResponse.json({ categories: parsedCategories })
  } catch (error) {
    console.error("Error fetching global KPI categories:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch global KPI categories",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// POST - Create a new global KPI category
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { name, description, parameters, color, isActive, isTemplate } = body

    const id = `global-group-${Date.now()}`
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from("global_parameter_groups")
      .insert({
        id,
        name,
        description,
        parameters: parameters || [],
        color: color || "bg-blue-500",
        is_active: isActive ?? true,
        is_template: isTemplate ?? true,
        created_at: now,
        usage_count: 0,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      category: {
        ...data,
        parameters: data.parameters || [],
      },
    })
  } catch (error) {
    console.error("Error creating global KPI category:", error)
    return NextResponse.json({ error: "Failed to create global KPI category" }, { status: 500 })
  }
}
