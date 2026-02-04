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

    // If table doesn't exist, return empty array gracefully
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('contract_files')) {
        // Table doesn't exist yet - return empty array
        return NextResponse.json([])
      }
      throw error
    }

    return NextResponse.json(files || [])
  } catch (error: any) {
    console.error("Error fetching contract files:", error)
    // Return empty array instead of error for missing table
    if (error.code === 'PGRST205') {
      return NextResponse.json([])
    }
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

    if (error) {
      // If table doesn't exist, return a message
      if (error.code === 'PGRST205' || error.message?.includes('contract_files')) {
        return NextResponse.json({ 
          error: "Datei-Upload ist derzeit nicht verfügbar. Die Tabelle 'contract_files' muss erst erstellt werden." 
        }, { status: 503 })
      }
      throw error
    }

    return NextResponse.json(file)
  } catch (error: any) {
    console.error("Error creating contract file:", error)
    if (error.code === 'PGRST205') {
      return NextResponse.json({ 
        error: "Datei-Upload ist derzeit nicht verfügbar" 
      }, { status: 503 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
