import { createAdminClient } from "@/lib/supabase/server"
import { isRateLimitError } from "@/lib/supabase/safe-query"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params

    let supabase
    try {
      supabase = await createAdminClient()
    } catch (clientError) {
      if (isRateLimitError(clientError)) {
        console.warn("[v0] Rate limited when creating admin client for user fetch")
        return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 })
      }
      throw clientError
    }

    let data, error
    try {
      const result = await supabase
        .from("users")
        .select(
          "id, name, email, role, practice_id, avatar, phone, specialization, preferred_language, is_active, last_login, created_at, updated_at, default_practice_id, mfa_enabled",
        )
        .eq("id", userId)
        .maybeSingle()

      data = result.data
      error = result.error
    } catch (queryError) {
      if (isRateLimitError(queryError)) {
        console.warn("[v0] Rate limited when fetching user:", userId)
        return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 })
      }
      throw queryError
    }

    if (error) {
      console.error("[v0] Error fetching user from database:", error)
      return NextResponse.json({ error: "Failed to fetch user", details: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user: data })
  } catch (error) {
    if (isRateLimitError(error)) {
      console.warn("[v0] Rate limit error in GET user")
      return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 })
    }
    console.error("[v0] Exception in GET user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params
    const supabase = await createAdminClient()
    const body = await request.json()

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    // Add basic fields if provided
    if (body.name !== undefined) updateData.name = body.name
    if (body.email !== undefined) updateData.email = body.email
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.avatar !== undefined) updateData.avatar = body.avatar
    if (body.specialization !== undefined) updateData.specialization = body.specialization
    if (body.preferred_language !== undefined) updateData.preferred_language = body.preferred_language

    // Update user in database
    const { data, error } = await supabase.from("users").update(updateData).eq("id", userId).select().single()

    if (error) {
      console.error("[v0] Error updating user:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ user: data, message: "Profile updated successfully" })
  } catch (error) {
    console.error("[v0] Error in PUT user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params
    const supabase = await createAdminClient()

    // Delete user from database
    const { error } = await supabase.from("users").delete().eq("id", userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
