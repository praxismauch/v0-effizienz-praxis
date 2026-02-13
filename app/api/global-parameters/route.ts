import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

// GET - Fetch all global KPI templates
export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminClient()

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")

    let query = supabase
      .from("global_parameter_templates")
      .select("*")
      .eq("is_template", true)
      .order("created_at", { ascending: false })

    if (category && category !== "all") {
      query = query.eq("category", category)
    }

    const { data: parameters, error } = await query

    if (error) {
      console.error("Database error:", error.message)
      return NextResponse.json({ error: "Database query failed", details: error.message }, { status: 500 })
    }

    const parsedParameters = (parameters || []).map((param: any) => ({
      ...param,
      options: param.options || undefined,
      dependencies: param.dependencies || undefined,
      groupIds: param.group_ids || [],
    }))

    return NextResponse.json({ parameters: parsedParameters })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch global KPIs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// POST - Create a new global KPI template
export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient()

    const body = await request.json()
    const {
      name,
      description,
      type,
      category,
      unit,
      interval,
      defaultValue,
      options,
      formula,
      dependencies,
      isActive,
      isTemplate,
      groupIds,
    } = body

    const id = `global-${Date.now()}`
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from("global_parameter_templates")
      .insert({
        id,
        name,
        description,
        type,
        category,
        unit: unit || null,
        interval: interval || "monthly",
        default_value: defaultValue || null,
        options: options || null,
        formula: formula || null,
        dependencies: dependencies || null,
        is_active: isActive ?? true,
        is_template: isTemplate ?? true,
        group_ids: groupIds && groupIds.length > 0 ? groupIds : null,
        created_at: now,
        updated_at: now,
        usage_count: 0,
      })
      .select()
      .single()

    if (error) {
      console.error("Insert error:", error.message)
      return NextResponse.json({ error: "Failed to create KPI", details: error.message }, { status: 500 })
    }

    return NextResponse.json({
      parameter: {
        ...data,
        options: data.options || undefined,
        dependencies: data.dependencies || undefined,
        groupIds: data.group_ids || [],
        unit: data.unit || undefined,
      },
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      {
        error: "Failed to create global KPI",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
