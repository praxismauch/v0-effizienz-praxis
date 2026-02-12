import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

// PUT - Update a global KPI category
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, parameters, color, isActive, isTemplate } = body

    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from("global_parameter_groups")
      .update({
        name,
        description,
        parameters: parameters || [],
        color: color || "bg-blue-500",
        is_active: isActive ?? true,
        is_template: isTemplate ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .maybeSingle()

    if (error) {
      console.error("Error updating global KPI category:", error)
      return NextResponse.json({ error: "Failed to update global KPI category" }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "KPI Kategorie nicht gefunden" }, { status: 404 })
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
    console.error("Error updating global KPI category:", error)
    return NextResponse.json({ error: "Failed to update global KPI category" }, { status: 500 })
  }
}

// DELETE - Delete a global KPI category
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createAdminClient()

    const { data, error } = await supabase.from("global_parameter_groups").delete().eq("id", id).select()

    if (error) {
      console.error("Supabase delete error:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })
      throw error
    }

    return NextResponse.json({ success: true, deleted: data })
  } catch (error: any) {
    console.error("Error deleting global KPI category:", {
      message: error?.message,
      stack: error?.stack,
    })
    return NextResponse.json(
      {
        error: "Failed to delete global KPI category",
        details: error?.message,
      },
      { status: 500 },
    )
  }
}
