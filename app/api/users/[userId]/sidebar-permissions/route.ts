import { createClient, createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId: paramUserId } = await params
    let userId = paramUserId

    if (!userId) {
      const urlParts = request.nextUrl.pathname.split("/")
      userId = urlParts[urlParts.indexOf("users") + 1]
    }

    if (!userId || userId === "undefined") {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    let supabase
    try {
      supabase = await createAdminClient()
    } catch (clientError) {
      console.error("Error creating admin client:", clientError)
      return NextResponse.json({ permissions: ["dashboard"] }, { status: 200 })
    }

    try {
      const { data: user } = await supabase.from("users").select("role").eq("id", userId).maybeSingle()

      const permissions =
        user?.role === "superadmin"
          ? ["dashboard", "users", "practices", "teams", "settings", "billing", "analytics"]
          : ["dashboard", "profile"]

      return NextResponse.json({ permissions })
    } catch (queryError) {
      console.error("Sidebar perms query error:", queryError)
      return NextResponse.json({ permissions: ["dashboard"] }, { status: 200 })
    }
  } catch (error) {
    console.error("Sidebar perms unexpected error:", error)
    return NextResponse.json({ permissions: ["dashboard"] }, { status: 200 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { permissions } = body

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("practice_id")
      .eq("id", userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    await supabase.from("sidebar_permissions").delete().eq("user_id", userId)

    const permissionsToInsert = Object.entries(permissions).map(([sidebar_item, is_visible]) => ({
      user_id: userId,
      practice_id: userData.practice_id,
      sidebar_item,
      is_visible: is_visible as boolean,
    }))

    if (permissionsToInsert.length > 0) {
      const { error: insertError } = await supabase.from("sidebar_permissions").insert(permissionsToInsert)

      if (insertError) {
        console.error("Error inserting sidebar permissions:", insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in sidebar permissions PUT:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
