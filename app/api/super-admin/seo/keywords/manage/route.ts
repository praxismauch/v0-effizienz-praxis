import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient, createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createAdminClient()

    const { data: keywords, error } = await supabase
      .from("seo_keywords")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ keywords: keywords || [] })
  } catch (error: any) {
    console.error("[v0] Error fetching SEO keywords:", error)
    return NextResponse.json({ error: "Failed to fetch SEO keywords", details: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminSupabase = await createAdminClient()
    const userSupabase = await createClient()
    const body = await req.json()

    let userId = null
    try {
      const {
        data: { user },
      } = await userSupabase.auth.getUser()
      userId = user?.id || null
    } catch {
      // If no user session, leave userId as null
    }

    const insertData: any = {
      ...body,
    }

    // Only add created_by if we have a user ID
    if (userId) {
      insertData.created_by = userId
    }

    const { data: keyword, error } = await adminSupabase.from("seo_keywords").insert(insertData).select().single()

    if (error) {
      console.error("[v0] Database error creating keyword:", error)
      throw error
    }

    return NextResponse.json({ keyword })
  } catch (error: any) {
    console.error("[v0] Error creating SEO keyword:", error)
    return NextResponse.json({ error: "Failed to create SEO keyword", details: error.message }, { status: 500 })
  }
}
