import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)

    const assetType = searchParams.get("type")
    const category = searchParams.get("category")
    const isActive = searchParams.get("active") !== "false"

    let query = supabase
      .from("brand_assets")
      .select("*")
      .eq("is_active", isActive)
      .order("created_at", { ascending: false })

    if (assetType) {
      query = query.eq("asset_type", assetType)
    }

    if (category) {
      query = query.eq("category", category)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching brand assets:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error in brand assets GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    const { data, error } = await supabase.from("brand_assets").insert(body).select().single()

    if (error) {
      console.error("Error creating brand asset:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in brand assets POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
