import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Restore default organizational categories from super admin templates
export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()

    // 1. Fetch template categories (where practice_id IS NULL = super admin defaults)
    const { data: templateCategories, error: templateError } = await supabase
      .from("orga_categories")
      .select("*")
      .is("practice_id", null)
      .order("display_order", { ascending: true })

    if (templateError) {
      console.error("[restore-defaults] Template fetch error:", templateError)
      return NextResponse.json({ error: "Failed to fetch template categories" }, { status: 500 })
    }

    if (!templateCategories || templateCategories.length === 0) {
      return NextResponse.json({ error: "No template categories available" }, { status: 500 })
    }

    // 2. Delete all existing practice categories
    const { error: deleteError } = await supabase
      .from("orga_categories")
      .delete()
      .eq("practice_id", practiceId)

    if (deleteError) {
      console.error("[restore-defaults] Delete error:", deleteError)
      return NextResponse.json({ error: "Failed to delete existing categories" }, { status: 500 })
    }

    // 3. Re-create from templates
    const defaultCategories = templateCategories.map((cat) => ({
      name: cat.name,
      description: cat.description,
      color: cat.color,
      icon: cat.icon,
      is_active: true,
      practice_id: practiceId,
      display_order: cat.display_order,
    }))

    const { data, error: insertError } = await supabase
      .from("orga_categories")
      .insert(defaultCategories)
      .select()

    if (insertError) {
      console.error("[restore-defaults] Insert error:", insertError)
      return NextResponse.json({ error: "Failed to create default categories" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Default categories restored",
      categories: data,
    })
  } catch (err) {
    console.error("[restore-defaults] Exception:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
