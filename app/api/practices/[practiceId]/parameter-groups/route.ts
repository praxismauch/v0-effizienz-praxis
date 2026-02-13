import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/practices/[practiceId]/parameter-groups - Fetch practice-specific parameter groups
export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  console.log("[v0] GET /api/practices/[practiceId]/parameter-groups called")
  try {
    const supabase = await createClient()
    const { practiceId } = await params
    console.log("[v0] Fetching categories for practice:", practiceId)

    const { data: categories, error } = await supabase
      .from("global_parameter_groups")
      .select("*")
      .eq("practice_id", practiceId)
      .order("name")

    if (error) {
      console.error("[v0] Error fetching practice categories:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Successfully fetched", categories?.length || 0, "practice-specific categories")

    return NextResponse.json({ categories: categories || [] })
  } catch (error) {
    console.error("[v0] Error in GET /api/practices/[practiceId]/parameter-groups:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

// POST /api/practices/[practiceId]/parameter-groups - Create a new practice-specific parameter group
export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const supabase = await createClient()
    const { practiceId } = await params
    const body = await request.json()

    const { name, description, color, parameters, isActive } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const categoryId = `practice-group-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

    const { data: category, error } = await supabase
      .from("global_parameter_groups")
      .insert({
        id: categoryId,
        practice_id: practiceId,
        name,
        description: description || "",
        color: color || "bg-blue-500",
        parameters: parameters || [],
        is_active: isActive !== undefined ? isActive : true,
        is_template: false,
        usage_count: 0,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating practice parameter group:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ category })
  } catch (error) {
    console.error("[v0] Error in POST /api/practices/[practiceId]/parameter-groups:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

// DELETE /api/practices/[practiceId]/parameter-groups?id=<categoryId>
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  console.log("[v0] DELETE /api/practices/[practiceId]/parameter-groups called")
  try {
    const supabase = await createClient()
    const { practiceId } = await params
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get("id")

    console.log("[v0] DELETE params:", { practiceId, categoryId })

    if (!categoryId) {
      console.error("[v0] Missing category ID in query parameters")
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 })
    }

    // Delete the category - only if it belongs to this practice
    const { error } = await supabase
      .from("global_parameter_groups")
      .delete()
      .eq("id", categoryId)
      .eq("practice_id", practiceId)

    if (error) {
      console.error("[v0] Error deleting category:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Successfully deleted category:", categoryId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in DELETE /api/practices/[practiceId]/parameter-groups:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
