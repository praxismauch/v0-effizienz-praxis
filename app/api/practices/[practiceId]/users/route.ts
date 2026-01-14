import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  const { practiceId } = await params
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, role")
    .eq("practice_id", practiceId)
    .eq("is_active", true)
    .order("name")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
