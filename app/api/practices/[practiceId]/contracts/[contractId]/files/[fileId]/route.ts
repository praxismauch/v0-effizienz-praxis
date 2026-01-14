import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ practiceId: string; contractId: string; fileId: string }> },
) {
  try {
    const { practiceId, contractId, fileId } = await params
    const supabase = await createServerClient()

    // Soft delete by setting deleted_at timestamp
    const { error } = await supabase
      .from("contract_files")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", fileId)
      .eq("contract_id", contractId)
      .eq("practice_id", practiceId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting contract file:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
