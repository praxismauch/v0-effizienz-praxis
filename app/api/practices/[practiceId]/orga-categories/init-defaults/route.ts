import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Initialize default organizational categories for a practice
export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    const supabase = await createClient()

    // Check if categories already exist
    const { data: existing, error: checkError } = await supabase
      .from("orga_categories")
      .select("id")
      .eq("practice_id", practiceId)
      .limit(1)

    if (checkError) {
      console.error("[v0] init-defaults - Error checking existing:", checkError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (existing && existing.length > 0) {
      return NextResponse.json({
        message: "Categories already exist",
        created: false,
      })
    }

    const { data: templateCategories, error: templateError } = await supabase
      .from("orga_categories")
      .select("*")
      .is("practice_id", null)
      .order("display_order", { ascending: true })

    if (templateError) {
      console.error("[v0] init-defaults - Template fetch error:", templateError)
      return NextResponse.json({ error: "Failed to fetch template categories" }, { status: 500 })
    }

    if (!templateCategories || templateCategories.length === 0) {
      console.error("[v0] init-defaults - No template categories found")
      return NextResponse.json({ error: "No template categories available" }, { status: 500 })
    }

    const defaultCategories = templateCategories.map((cat) => ({
      name: cat.name,
      description: cat.description,
      color: cat.color,
      icon: cat.icon,
      is_active: true,
      practice_id: practiceId,
      display_order: cat.display_order, // Preserve template order
    }))

    const { data, error } = await supabase.from("orga_categories").insert(defaultCategories).select()

    if (error) {
      console.error("[v0] init-defaults - Insert error:", error)
      return NextResponse.json({ error: "Failed to create categories" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Default categories created",
      created: true,
      categories: data,
    })
  } catch (err) {
    console.error("[v0] init-defaults - Exception:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
