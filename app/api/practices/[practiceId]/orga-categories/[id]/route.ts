import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(request: Request, { params }: { params: { practiceId: string; id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from("orga_categories")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Update orga category error:", error)
    return NextResponse.json({ error: "Failed to update orga category" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { practiceId: string; id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from("orga_categories")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Update orga category error:", error)
    return NextResponse.json({ error: "Failed to update orga category" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { practiceId: string; id: string } }) {
  try {
    const { id } = params
    const supabase = await createServerClient()

    const { error } = await supabase.from("orga_categories").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete orga category error:", error)
    return NextResponse.json({ error: "Failed to delete orga category" }, { status: 500 })
  }
}
