import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(request: NextRequest, { params }: { params: { adminId: string } }) {
  try {
    const supabase = await createClient()
    const { adminId } = params
    const body = await request.json()

    console.log("[v0] Patching super admin:", adminId, body)

    // Build update object
    const updateData: any = {}

    if (body.default_practice_id !== undefined) {
      updateData.default_practice_id = body.default_practice_id
    }
    if (body.defaultPracticeId !== undefined) {
      updateData.default_practice_id = body.defaultPracticeId
    }
    if (body.is_active !== undefined) {
      updateData.is_active = body.is_active
    }
    if (body.name !== undefined) {
      updateData.name = body.name
    }
    if (body.email !== undefined) {
      updateData.email = body.email
    }
    if (body.preferred_language !== undefined) {
      updateData.preferred_language = body.preferred_language
    }

    // Update the super admin in the database
    const { data, error } = await supabase.from("users").update(updateData).eq("id", adminId).select().single()

    if (error) {
      console.error("[v0] Error patching super admin:", error)
      throw error
    }

    console.log("[v0] Super admin patched successfully")

    return NextResponse.json({ admin: data })
  } catch (error: any) {
    console.error("[v0] Error in PATCH /api/super-admin/admins/[adminId]:", error)
    return NextResponse.json({ error: error.message || "Failed to update super admin" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { adminId: string } }) {
  try {
    const supabase = await createClient()
    const { adminId } = params
    const body = await request.json()

    console.log("[v0] Updating super admin:", adminId, body)

    const updateData: any = {
      is_active: body.is_active,
      name: body.name,
      email: body.email,
      preferred_language: body.preferred_language,
    }

    // Handle default_practice_id in both formats
    if (body.defaultPracticeId !== undefined) {
      updateData.default_practice_id = body.defaultPracticeId
    } else if (body.default_practice_id !== undefined) {
      updateData.default_practice_id = body.default_practice_id
    }

    // Update the super admin in the database
    const { data, error } = await supabase.from("users").update(updateData).eq("id", adminId).select().single()

    if (error) {
      console.error("[v0] Error updating super admin:", error)
      throw error
    }

    console.log("[v0] Super admin updated successfully")

    return NextResponse.json({ admin: data })
  } catch (error: any) {
    console.error("[v0] Error in PUT /api/super-admin/admins/[adminId]:", error)
    return NextResponse.json({ error: error.message || "Failed to update super admin" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { adminId: string } }) {
  try {
    const supabase = await createClient()
    const { adminId } = params

    console.log("[v0] Deleting super admin:", adminId)

    const { data: admins, error: countError } = await supabase.from("users").select("id").eq("role", "superadmin")

    if (countError) {
      throw countError
    }

    if (admins.length <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the last super admin. At least one super admin must remain." },
        { status: 400 },
      )
    }

    // Delete the super admin from the database
    const { error } = await supabase.from("users").delete().eq("id", adminId)

    if (error) {
      console.error("[v0] Error deleting super admin:", error)
      throw error
    }

    console.log("[v0] Super admin deleted successfully")

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error in DELETE /api/super-admin/admins/[adminId]:", error)
    return NextResponse.json({ error: error.message || "Failed to delete super admin" }, { status: 500 })
  }
}
