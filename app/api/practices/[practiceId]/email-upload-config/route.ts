import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { encryptPassword } from "@/lib/email/imap-processor"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from("practice_email_configs")
      .select(`
        id,
        practice_id,
        email_address,
        email_type,
        imap_host,
        imap_port,
        imap_user,
        use_ssl,
        target_folder_id,
        allowed_file_types,
        max_file_size_mb,
        auto_analyze_with_ai,
        is_active,
        last_check_at,
        last_error,
        emails_processed,
        documents_uploaded,
        created_at,
        updated_at
      `)
      .eq("practice_id", practiceId)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error fetching email configs:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const body = await request.json()
    const supabase = await createAdminClient()

    // Encrypt password before storing
    const encryptedPassword = body.imap_password ? encryptPassword(body.imap_password) : null

    const { data, error } = await supabase
      .from("practice_email_configs")
      .insert({
        practice_id: practiceId,
        email_address: body.email_address,
        email_type: body.email_type || "imap",
        imap_host: body.imap_host,
        imap_port: body.imap_port || 993,
        imap_user: body.imap_user,
        imap_password_encrypted: encryptedPassword,
        use_ssl: body.use_ssl !== false,
        target_folder_id: body.target_folder_id,
        allowed_file_types: body.allowed_file_types || [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
        max_file_size_mb: body.max_file_size_mb || 25,
        auto_analyze_with_ai: body.auto_analyze_with_ai || false,
        is_active: body.is_active !== false,
        created_by: body.created_by,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error creating email config:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
