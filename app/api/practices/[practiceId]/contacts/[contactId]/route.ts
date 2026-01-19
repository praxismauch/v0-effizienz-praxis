import { NextRequest, NextResponse } from "next/server"
import { requirePracticeAccess, getEffectivePracticeId } from "@/lib/auth-helpers"

// GET - Fetch single contact
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; contactId: string }> }
) {
  try {
    const { practiceId: rawPracticeId, contactId } = await params
    const practiceId = getEffectivePracticeId(rawPracticeId)

    const access = await requirePracticeAccess(practiceId)
    const supabase = access.adminClient

    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", contactId)
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] Error fetching contact:", error)

    if (error.message?.includes("Not authenticated") || error.message?.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch contact" },
      { status: 500 }
    )
  }
}

// PATCH - Update contact
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; contactId: string }> }
) {
  try {
    const { practiceId: rawPracticeId, contactId } = await params
    const practiceId = getEffectivePracticeId(rawPracticeId)

    const access = await requirePracticeAccess(practiceId)
    const supabase = access.adminClient

    const body = await request.json()

    const { data, error } = await supabase
      .from("contacts")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contactId)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] Error updating contact:", error)

    if (error.message?.includes("Not authenticated") || error.message?.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update contact" },
      { status: 500 }
    )
  }
}

// DELETE - Soft delete contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; contactId: string }> }
) {
  try {
    const { practiceId: rawPracticeId, contactId } = await params
    const practiceId = getEffectivePracticeId(rawPracticeId)

    const access = await requirePracticeAccess(practiceId)
    const supabase = access.adminClient

    const { error } = await supabase
      .from("contacts")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", contactId)
      .eq("practice_id", practiceId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error deleting contact:", error)

    if (error.message?.includes("Not authenticated") || error.message?.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete contact" },
      { status: 500 }
    )
  }
}
