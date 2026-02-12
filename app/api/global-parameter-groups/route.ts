import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - List all global KPI categories/groups
export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("global_parameter_groups")
      .select("*")
      .order("name", { ascending: true })

    if (error) {
      console.error("Error fetching global parameter groups:", error)
      // Return empty array instead of error so the UI still works
      return NextResponse.json({ categories: [] })
    }

    // Transform to match frontend expected format
    const categories = (data || []).map((group) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      color: group.color || "bg-blue-500",
      is_active: group.is_active ?? true,
      isActive: group.is_active ?? true,
      is_template: group.is_template ?? true,
      isTemplate: group.is_template ?? true,
      parameters: group.parameters || [],
      usage_count: group.usage_count || 0,
      usageCount: group.usage_count || 0,
      created_at: group.created_at,
      createdAt: group.created_at,
    }))

    return NextResponse.json({ categories })
  } catch (error) {
    console.error("Error fetching global parameter groups:", error)
    return NextResponse.json({ categories: [] })
  }
}

// POST - Create a new global KPI category/group
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, parameters, color, isActive, isTemplate } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name ist erforderlich" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("global_parameter_groups")
      .insert({
        name: name.trim(),
        description: description?.trim() || "",
        parameters: parameters || [],
        color: color || "bg-blue-500",
        is_active: isActive ?? true,
        is_template: isTemplate ?? true,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating global KPI category:", error)
      return NextResponse.json({ error: "Failed to create global KPI category" }, { status: 500 })
    }

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
