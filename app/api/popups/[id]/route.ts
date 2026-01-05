import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient, createServerClient } from "@/lib/supabase/server"
import { isSuperAdminRole } from "@/lib/auth-utils"

// GET - Fetch a single popup
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()
    const { id } = params

    const { data, error } = await supabase.from("popups").select("*").eq("id", id).maybeSingle()

    if (error) {
      console.error("[v0] Error fetching popup:", error)
      return NextResponse.json({ error: "Failed to fetch popup", details: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Popup not found" }, { status: 404 })
    }

    return NextResponse.json({ popup: data })
  } catch (error: any) {
    console.error("[v0] Error in GET /api/popups/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update a popup (super admin only)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createAdminClient()
    const { id } = params
    const body = await request.json()

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
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

      if (!isSuperAdminRole(userData?.role)) {
        return NextResponse.json({ error: "Forbidden - Super admin access required" }, { status: 403 })
      }
    }

    const { data, error } = await supabase
      .from("popups")
      .update({
        title: body.title,
        content: body.content,
        button_text: body.button_text || null,
        button_link: body.button_link || null,
        image_url: body.image_url || null,
        background_color: body.background_color || "#ffffff",
        text_color: body.text_color || "#000000",
        is_active: body.is_active,
        display_frequency: body.display_frequency,
        target_pages: body.target_pages || [],
        start_date: body.start_date || null,
        end_date: body.end_date || null,
        display_order: body.display_order || 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating popup:", error)
      return NextResponse.json({ error: "Failed to update popup", details: error.message }, { status: 500 })
    }

    return NextResponse.json({ popup: data })
  } catch (error: any) {
    console.error("[v0] Error in PUT /api/popups/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Delete a popup (super admin only)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createAdminClient()
    const { id } = params

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
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

      if (!isSuperAdminRole(userData?.role)) {
        return NextResponse.json({ error: "Forbidden - Super admin access required" }, { status: 403 })
      }
    }

    const { error } = await supabase.from("popups").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting popup:", error)
      return NextResponse.json({ error: "Failed to delete popup", details: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Popup deleted successfully" })
  } catch (error: any) {
    console.error("[v0] Error in DELETE /api/popups/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
