import { type NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    const supabase = await createClient()

    const { data: categories, error } = await supabase
      .from("orga_categories")
      .select("*")
      .or(`practice_id.eq.${practiceId},practice_id.is.null`)
      .eq("is_active", true)
      .order("display_order", { ascending: true })

    if (error) {
      console.error("[v0] Supabase query error:", error)
      return NextResponse.json([], { status: 200 })
    }

    const sortedCategories = (categories || []).sort((a, b) => {
      const isABenutzerdefiniert = a.name === "Benutzerdefiniert"
      const isBBenutzerdefiniert = b.name === "Benutzerdefiniert"

      if (isABenutzerdefiniert && !isBBenutzerdefiniert) return 1
      if (!isABenutzerdefiniert && isBBenutzerdefiniert) return -1
      return a.display_order - b.display_order
    })

    return NextResponse.json(sortedCategories, { status: 200 })
  } catch (error: any) {
    console.error("[v0] Workflow categories API error:", error?.message || error)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createAdminClient()
    const body = await req.json()

    const { count } = await supabase
      .from("orga_categories")
      .select("*", { count: "exact", head: true })
      .eq("practice_id", practiceId)

    const { data: category, error } = await supabase
      .from("orga_categories")
      .insert({
        ...body,
        practice_id: practiceId,
        created_by: body.created_by || "system",
        display_order: (count || 0) + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("[API] Error creating workflow category:", error)
      throw error
    }

    return NextResponse.json(category)
  } catch (error: any) {
    console.error("[API] Error creating workflow category:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
