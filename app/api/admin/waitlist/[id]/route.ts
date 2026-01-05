import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createAdminClient()

    const body = await request.json()
    const { status } = body

    if (!status || !["pending", "contacted", "converted"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Update waitlist entry
    const { data, error } = await supabase
      .from("waitlist")
      .update({
        status,
        updated_at: new Date().toISOString(),
        ...(status === "contacted" && { notified_at: new Date().toISOString() }),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating waitlist entry:", error)
      return NextResponse.json({ error: "Failed to update waitlist entry" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in waitlist PATCH route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createAdminClient()

    // Delete waitlist entry
    const { error } = await supabase.from("waitlist").delete().eq("id", id)

    if (error) {
      console.error("Error deleting waitlist entry:", error)
      return NextResponse.json({ error: "Failed to delete waitlist entry" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in waitlist DELETE route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
