import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// GET - Get billing history for practice
export async function GET(request: Request, { params }: { params: { practiceId: string } }) {
  try {
    const supabase = await createServerClient()

    const { data: history, error } = await supabase
      .from("billing_history")
      .select("*")
      .eq("practice_id", params.practiceId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json(history || [])
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
