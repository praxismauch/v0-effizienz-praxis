import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { encryptPassword } from "@/lib/email/imap-processor"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; configId: string }> },
) {
  try {
    const { practiceId, configId } = await params
    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from("practice_email_configs")
      .select(`
        *,
        processed_emails:processed_emails(
          id,
          from_address,
          subject,
          received_at,
          processed_at,
          attachments_count,
          documents_created,
          status,
          error_message
        )
      `)
      .eq("id", configId)
      .eq("practice_id", practiceId)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Don't return the encrypted password
    if (data) {
      delete data.imap_password_encrypted
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching email config:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; configId: string }> },
) {
  try {
    const { practiceId, configId } = await params
    const body = await request.json()
    const supabase = await createAdminClient()

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    // Only update provided fields
    if (body.email_address !== undefined) updateData.email_address = body.email_address
    if (body.imap_host !== undefined) updateData.imap_host = body.imap_host
    if (body.imap_port !== undefined) updateData.imap_port = body.imap_port
    if (body.imap_user !== undefined) updateData.imap_user = body.imap_user
    if (body.imap_password !== undefined) {
      updateData.imap_password_encrypted = encryptPassword(body.imap_password)
    }
    if (body.use_ssl !== undefined) updateData.use_ssl = body.use_ssl
    if (body.target_folder_id !== undefined) updateData.target_folder_id = body.target_folder_id
    if (body.allowed_file_types !== undefined) updateData.allowed_file_types = body.allowed_file_types
    if (body.max_file_size_mb !== undefined) updateData.max_file_size_mb = body.max_file_size_mb
    if (body.auto_analyze_with_ai !== undefined) updateData.auto_analyze_with_ai = body.auto_analyze_with_ai
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    const { data, error } = await supabase
      .from("practice_email_configs")
      .update(updateData)
      .eq("id", configId)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error updating email config:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; configId: string }> },
) {
  try {
    const { practiceId, configId } = await params
    const supabase = await createAdminClient()

    const { error } = await supabase
      .from("practice_email_configs")
      .delete()
      .eq("id", configId)
      .eq("practice_id", practiceId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting email config:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
