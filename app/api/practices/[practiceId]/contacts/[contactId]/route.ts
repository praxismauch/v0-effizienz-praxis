import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// GET - Fetch single contact
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; contactId: string }> }
) {
  try {
    const { practiceId, contactId } = await params

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = await createAdminClient()

    const { data, error } = await adminClient
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
    const { practiceId, contactId } = await params

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = await createAdminClient()
    const body = await request.json()

    const { data, error } = await adminClient
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
    const { practiceId, contactId } = await params

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = await createAdminClient()

    const { error } = await adminClient
      .from("contacts")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", contactId)
      .eq("practice_id", practiceId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error deleting contact:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete contact" },
      { status: 500 }
    )
  }
}
