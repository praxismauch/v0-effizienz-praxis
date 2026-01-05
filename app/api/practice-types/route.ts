import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const DEFAULT_PRACTICE_TYPES = [
  { id: "1", name: "Familienmedizin", display_order: 1, is_active: true },
  { id: "2", name: "Innere Medizin", display_order: 2, is_active: true },
  { id: "3", name: "Pädiatrie", display_order: 3, is_active: true },
  { id: "4", name: "Kardiologie", display_order: 4, is_active: true },
  { id: "5", name: "Dermatologie", display_order: 5, is_active: true },
  { id: "6", name: "Orthopädie", display_order: 6, is_active: true },
]

export async function GET() {
  try {
    const supabase = await createAdminClient()

    const { data: tableCheck, error: tableError } = await supabase.from("practice_types").select("id").limit(1)

    if (tableError && tableError.code === "42P01") {
      return NextResponse.json(DEFAULT_PRACTICE_TYPES)
    }

    const { data, error } = await supabase
      .from("practice_types")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })

    if (error) {
      if (error.message.includes("Could not find the table")) {
        return NextResponse.json(DEFAULT_PRACTICE_TYPES)
      }
      console.error("Unexpected error fetching practice types:", error.message)
      return NextResponse.json(DEFAULT_PRACTICE_TYPES)
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    if (!error.message?.includes("Could not find the table")) {
      console.error("Unexpected error fetching practice types:", error)
    }
    return NextResponse.json(DEFAULT_PRACTICE_TYPES)
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createAdminClient()

    const body = await request.json()
    const { name } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const { data: maxOrder } = await supabase
      .from("practice_types")
      .select("display_order")
      .order("display_order", { ascending: false })
      .limit(1)
      .single()

    const newOrder = (maxOrder?.display_order || 0) + 1

    const { data, error } = await supabase
      .from("practice_types")
      .insert({
        name,
        display_order: newOrder,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      if (error.message.includes("Could not find the table") || error.code === "42P01") {
        return NextResponse.json(
          { error: "Please run the SQL migration script to create the practice_types table" },
          { status: 503 },
        )
      }
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error creating practice type:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
