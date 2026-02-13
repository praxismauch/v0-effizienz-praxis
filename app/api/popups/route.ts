import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { createServerClient } from "@/lib/supabase/server"
import { isSuperAdminRole } from "@/lib/auth-utils"

// GET - Fetch all popups (or only active ones for public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get("active") === "true"

    const supabase = await createAdminClient()

    let query = supabase
      .from("popups")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false })

    if (activeOnly) {
      const now = new Date().toISOString()
      query = query
        .eq("is_active", true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching popups:", error)
      return NextResponse.json({ error: "Failed to fetch popups", details: error.message }, { status: 500 })
    }

    return NextResponse.json({ popups: data || [] })
  } catch (error: any) {
    console.error("[v0] Error in GET /api/popups:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

// POST - Create a new popup (super admin only)
export async function POST(request: Request) {
  try {
    const isDevMode =
      !process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_VERCEL_ENV !== "production" ||
      process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN === "true"

    if (!isDevMode) {
      const authSupabase = await createServerClient()
      const {
        data: { user },
      } = await authSupabase.auth.getUser()

      if (!user) {
        return NextResponse.json({ error: "Unauthorized - Authentication required" }, { status: 401 })
      }

      const supabase = await createAdminClient()
      const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

      if (!isSuperAdminRole(userData?.role)) {
        return NextResponse.json({ error: "Forbidden - Super admin access required" }, { status: 403 })
      }
    } else {
      // Dev mode - auth check skipped
    }

    const body = await request.json()
    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from("popups")
      .insert({
        title: body.title,
        content: body.content,
        button_text: body.button_text || null,
        button_link: body.button_link || null,
        image_url: body.image_url || null,
        background_color: body.background_color || "#ffffff",
        text_color: body.text_color || "#000000",
        is_active: body.is_active ?? true,
        display_frequency: body.display_frequency || "once",
        target_pages: body.target_pages || [],
        start_date: body.start_date || null,
        end_date: body.end_date || null,
        display_order: body.display_order ?? 0,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating popup:", error)
      return NextResponse.json({ error: "Failed to create popup", details: error.message }, { status: 500 })
    }

    return NextResponse.json({ popup: data }, { status: 201 })
  } catch (error: any) {
    console.error("[v0] Error in POST /api/popups:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
