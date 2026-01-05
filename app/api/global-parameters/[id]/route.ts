import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// PUT - Update a global KPI template
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const {
      name,
      description,
      type,
      category,
      defaultValue,
      options,
      formula,
      dependencies,
      unit,
      interval,
      isActive,
      isTemplate,
      groupIds,
    } = body

    const supabase = await createClient()
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from("global_parameter_templates")
      .update({
        name,
        description,
        type,
        category,
        default_value: defaultValue || null,
        options: options || null,
        formula: formula || null,
        dependencies: dependencies || null,
        unit: unit || null,
        interval: interval || "monthly",
        is_active: isActive ?? true,
        is_template: isTemplate ?? true,
        group_ids: groupIds && groupIds.length > 0 ? groupIds : null,
        updated_at: now,
      })
      .eq("id", id)
      .select()
      .maybeSingle()

    if (error) {
      console.error("[v0] Supabase update error:", error)
      return NextResponse.json({ error: "Failed to update global KPI" }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "KPI Parameter nicht gefunden" }, { status: 404 })
    }

    return NextResponse.json({
      parameter: {
        ...data,
        options: data.options || undefined,
        dependencies: data.dependencies || undefined,
        groupIds: data.group_ids || [],
        unit: data.unit || undefined,
        interval: data.interval || "monthly",
      },
    })
  } catch (error) {
    console.error("[v0] Error updating global KPI:", error)
    return NextResponse.json(
      {
        error: "Failed to update global KPI",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// DELETE - Delete a global KPI template
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const supabase = await createClient()

    // Check if parameter is being used by any practices
    const { data: usage, error: usageError } = await supabase
      .from("parameter_template_usage")
      .select("id", { count: "exact" })
      .eq("template_id", id)

    if (usageError) throw usageError

    if (usage && usage.length > 0) {
      return NextResponse.json({ error: "Cannot delete KPI template that is in use by practices" }, { status: 400 })
    }

    const { error } = await supabase.from("global_parameter_templates").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting global KPI:", error)
    return NextResponse.json({ error: "Failed to delete global KPI" }, { status: 500 })
  }
}
