import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createAdminClient()

    const { data: categories, error } = await supabase
      .from("testing_categories")
      .select("*")
      .order("display_order", { ascending: true })

    if (error) throw error

    return NextResponse.json(categories)
  } catch (error) {
    console.error("[v0] Error fetching testing categories:", error)
    return NextResponse.json({ error: "Failed to fetch testing categories" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createAdminClient()
    const body = await request.json()

    console.log("[v0] Creating testing category:", body)

    const { data, error } = await supabase
      .from("testing_categories")
      .insert({
        name: body.name,
        description: body.description,
        color: body.color,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Supabase error creating category:", error)
      throw error
    }

    console.log("[v0] Successfully created testing category:", data)
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error creating testing category:", error)
    return NextResponse.json({ error: "Failed to create testing category" }, { status: 500 })
  }
}
