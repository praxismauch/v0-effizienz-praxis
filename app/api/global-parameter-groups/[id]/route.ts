import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// PUT - Update a global KPI category
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, parameters, color, isActive, isTemplate } = body

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("global_parameter_groups")
      .update({
        name,
        description,
        parameters: parameters || [],
        color: color || "bg-blue-500",
        is_active: isActive ?? true,
        is_template: isTemplate ?? true,
      })
      .eq("id", id)
      .select()
      .maybeSingle()

    if (error) {
      console.error("[v0] Error updating global KPI category:", error)
      return NextResponse.json({ error: "Failed to update global KPI category" }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "KPI Kategorie nicht gefunden" }, { status: 404 })
    }

    return NextResponse.json({
      category: {
        ...data,
        parameters: data.parameters || [],
      },
    })
  } catch (error) {
    console.error("[v0] Error updating global KPI category:", error)
    return NextResponse.json({ error: "Failed to update global KPI category" }, { status: 500 })
  }
}

// DELETE - Delete a global KPI category
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data, error } = await supabase.from("global_parameter_groups").delete().eq("id", id).select()

    if (error) {
      console.error("[v0] Supabase delete error:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })
      throw error
    }

    return NextResponse.json({ success: true, deleted: data })
  } catch (error: any) {
    console.error("[v0] Error deleting global KPI category:", {
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
