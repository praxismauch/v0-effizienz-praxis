import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - Fetch all global KPI categories
export async function GET() {
  try {
    const supabase = await createClient()

    // Fetch global KPI categories (templates without practice_id)
    const { data: categories, error } = await supabase
      .from("global_parameter_groups")
      .select("*")
      .is("practice_id", null)
      .order("display_order", { ascending: true })

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

    // Transform database fields to match frontend expected format
    const parsedCategories = (categories || []).map((category: any) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      color: category.color || "bg-blue-500",
      icon: category.icon,
      display_order: category.display_order,
      is_active: category.is_active ?? true,
      isActive: category.is_active ?? true,
      is_template: category.is_template ?? true,
      isTemplate: category.is_template ?? true,
      parameters: category.parameters || [],
      usage_count: category.usage_count || 0,
      usageCount: category.usage_count || 0,
      created_at: category.created_at,
      createdAt: category.created_at,
      updated_at: category.updated_at,
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
        practice_id: null,
        usage_count: 0,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single()

    if (error) {
      console.error("Supabase error creating global KPI category:", error)
      throw error
    }

    // Transform to match frontend expected format
    return NextResponse.json({
      category: {
        id: data.id,
        name: data.name,
        description: data.description,
        color: data.color || "bg-blue-500",
        is_active: data.is_active ?? true,
        isActive: data.is_active ?? true,
        is_template: data.is_template ?? true,
        isTemplate: data.is_template ?? true,
        parameters: data.parameters || [],
        usage_count: data.usage_count || 0,
        usageCount: data.usage_count || 0,
        created_at: data.created_at,
        createdAt: data.created_at,
      },
    })
  } catch (error) {
    console.error("Error creating global KPI category:", error)
    return NextResponse.json({ error: "Failed to create global KPI category" }, { status: 500 })
  }
}
