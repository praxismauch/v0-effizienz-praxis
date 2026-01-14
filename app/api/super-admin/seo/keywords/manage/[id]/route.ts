import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const body = await req.json()
    const { id } = await params

    const { data: keyword, error } = await supabase
      .from("seo_keywords")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ keyword })
  } catch (error: any) {
    console.error("[v0] Error updating SEO keyword:", error)
    return NextResponse.json({ error: "Failed to update SEO keyword", details: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { error } = await supabase.from("seo_keywords").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error deleting SEO keyword:", error)
    return NextResponse.json({ error: "Failed to delete SEO keyword", details: error.message }, { status: 500 })
  }
}
