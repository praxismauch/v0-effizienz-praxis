import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ practiceId: string; documentId: string }> },
) {
  try {
    const { practiceId, documentId } = await params
    const body = await request.json()
    const { signature_data, signer_name, signer_role, signed_by } = body

    if (!signature_data || !signer_name || !signed_by) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()
    const headersList = await headers()

    // Verify the document exists and belongs to the practice
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("id, name, practice_id")
      .eq("id", documentId)
      .eq("practice_id", practiceId)
      .single()

    if (docError || !document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Create the signature record
    const { data: signature, error: signError } = await supabase
      .from("document_signatures")
      .insert({
        document_id: documentId,
        practice_id: practiceId,
        signed_by,
        signer_name,
        signer_role: signer_role || null,
        signature_data,
        signature_type: "handwritten",
        ip_address: headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown",
        user_agent: headersList.get("user-agent") || "unknown",
        signed_at: new Date().toISOString(),
        is_valid: true,
      })
      .select()
      .single()

    if (signError) {
      console.error("Error creating signature:", signError)
      return NextResponse.json({ error: "Failed to save signature" }, { status: 500 })
    }

    // Update document signature status if signature_required is true
    const { data: docData } = await supabase
      .from("documents")
      .select("signature_required, required_signers")
      .eq("id", documentId)
      .single()

    if (docData?.signature_required) {
      // Count signatures
      const { count } = await supabase
        .from("document_signatures")
        .select("*", { count: "exact", head: true })
        .eq("document_id", documentId)
        .eq("is_valid", true)

      const requiredCount = docData.required_signers?.length || 0
      let newStatus = "pending"

      if (requiredCount === 0 || (count && count >= requiredCount)) {
        newStatus = "fully_signed"
      } else if (count && count > 0) {
        newStatus = "partially_signed"
      }

      await supabase.from("documents").update({ signature_status: newStatus }).eq("id", documentId)
    }

    return NextResponse.json(signature)
  } catch (error) {
    console.error("Error in sign document:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
