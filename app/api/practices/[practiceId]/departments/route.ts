import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()

    const { data: departments, error } = await supabase
      .from("departments")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("is_active", true)
      .order("display_order", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching departments:", error)
      return NextResponse.json({ departments: [] }, { status: 200 })
    }

    return NextResponse.json({ departments: departments || [] })
  } catch (error) {
    console.error("[v0] Departments GET error:", error)
    return NextResponse.json({ departments: [] }, { status: 200 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()
    const body = await request.json()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get max display order
    const { data: maxOrder } = await supabase
      .from("departments")
      .select("display_order")
      .eq("practice_id", practiceId)
      .order("display_order", { ascending: false })
      .limit(1)
      .single()

    const newDisplayOrder = (maxOrder?.display_order || 0) + 1

    const { data: department, error } = await supabase
      .from("departments")
      .insert({
        practice_id: practiceId,
        name: body.name,
        description: body.description || null,
        color: body.color || "#3b82f6",
        icon: body.icon || null,
        display_order: newDisplayOrder,
        is_active: true,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating department:", error)
      return NextResponse.json({ error: "Failed to create department" }, { status: 500 })
    }

    return NextResponse.json({ department })
  } catch (error) {
    console.error("[v0] Departments POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
