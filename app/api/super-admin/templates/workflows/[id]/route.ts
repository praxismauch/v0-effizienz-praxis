import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { isSuperAdminRole } from "@/lib/auth-utils"

async function authorize() {
  const supabase = await createServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { error: "Unauthorized", status: 401, supabase: null }
  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()
  if (!isSuperAdminRole(userData?.role)) return { error: "Forbidden", status: 403, supabase: null }
  return { error: null, status: 200, supabase }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { error, status, supabase } = await authorize()
    if (error || !supabase) return NextResponse.json({ error }, { status })

    const body = await request.json()
    const { name, description, category, steps, is_active, hide_items_from_other_users } = body

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() }
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (category !== undefined) updateData.category = category
    if (steps !== undefined) updateData.steps = steps
    if (is_active !== undefined) updateData.is_active = is_active
    if (hide_items_from_other_users !== undefined) updateData.hide_items_from_other_users = hide_items_from_other_users

    const { data: template, error: updateError } = await supabase
      .from("workflow_templates")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({ template })
  } catch (error: any) {
    console.error("[v0] Error updating workflow template:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { error, status, supabase } = await authorize()
    if (error || !supabase) return NextResponse.json({ error }, { status })

    // Soft delete
    const { error: deleteError } = await supabase
      .from("workflow_templates")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error deleting workflow template:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
