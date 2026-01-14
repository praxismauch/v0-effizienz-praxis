import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; contractId: string }> },
) {
  try {
    const { practiceId, contractId } = await params
    const supabase = await createServerClient()

    const { data: files, error } = await supabase
      .from("contract_files")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("contract_id", contractId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json(files || [])
  } catch (error: any) {
    console.error("Error fetching contract files:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; contractId: string }> },
) {
  try {
    const { practiceId, contractId } = await params
    const supabase = await createServerClient()
    const body = await request.json()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: file, error } = await supabase
      .from("contract_files")
      .insert({
        contract_id: contractId,
        practice_id: practiceId,
        file_name: body.file_name,
        file_url: body.file_url,
        file_size: body.file_size,
        file_type: body.file_type,
        uploaded_by: user?.id,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(file)
  } catch (error: any) {
    console.error("Error creating contract file:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
