import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const { searchParams } = new URL(request.url)

    const category = searchParams.get("category")
    const isActive = searchParams.get("active") !== "false"

    let query = supabase
      .from("brand_slogans")
      .select("*")
      .eq("is_active", isActive)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: false })

    if (category) {
      query = query.eq("category", category)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching brand slogans:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error in brand slogans GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const body = await request.json()

    const { data, error } = await supabase.from("brand_slogans").insert(body).select().single()

    if (error) {
      console.error("Error creating brand slogan:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in brand slogans POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
