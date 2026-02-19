import { type NextRequest, NextResponse } from "next/server"
import { createServerClient, createAdminClient } from "@/lib/supabase/server"
import { isSuperAdminRole } from "@/lib/auth-utils"

async function authorize() {
  const supabase = await createServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { error: "Unauthorized", status: 401, adminClient: null }
  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()
  if (!isSuperAdminRole(userData?.role)) return { error: "Forbidden", status: 403, adminClient: null }
  const adminClient = await createAdminClient()
  return { error: null, status: 200, adminClient }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { error, status, adminClient } = await authorize()
    if (error || !adminClient) return NextResponse.json({ error }, { status })

    const body = await request.json()
    const { name, description, category, steps, is_active, hide_items_from_other_users } = body

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() }
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (category !== undefined) updateData.category = category
    if (is_active !== undefined) updateData.is_active = is_active
    if (hide_items_from_other_users !== undefined) updateData.hide_items_from_other_users = hide_items_from_other_users

    const { data: template, error: updateError } = await adminClient
      .from("workflows")
      .update(updateData)
      .eq("id", id)
      .eq("is_template", true)
      .select()
      .single()

    if (updateError) throw updateError

    // Update steps in workflow_steps table
    if (steps !== undefined && Array.isArray(steps)) {
      // Delete old steps
      await adminClient.from("workflow_steps").delete().eq("workflow_id", id)

      // Insert new steps
      if (steps.length > 0) {
        const stepInserts = steps.map((step: any, idx: number) => ({
          workflow_id: id,
          title: step.title || step.name || "",
          description: step.description || "",
          responsible_role: step.assignedTo || null,
          estimated_minutes: step.estimatedDuration || 5,
          step_order: idx + 1,
          status: "pending",
        }))

        const { error: stepsError } = await adminClient.from("workflow_steps").insert(stepInserts)
        if (stepsError) console.error("Error updating workflow steps:", stepsError)
      }
    }

    return NextResponse.json({ template })
  } catch (error: any) {
    console.error("[v0] Error updating workflow template:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { error, status, adminClient } = await authorize()
    if (error || !adminClient) return NextResponse.json({ error }, { status })

    // Soft delete
    const { error: deleteError } = await adminClient
      .from("workflows")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("is_template", true)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error deleting workflow template:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
