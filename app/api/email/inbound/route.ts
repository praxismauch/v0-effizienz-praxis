import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { put } from "@vercel/blob"

// This endpoint now handles generic webhook-based email inbound from any provider

interface InboundEmailEvent {
  type: string
  created_at: string
  data: {
    email_id: string
    created_at: string
    from: string
    to: string[]
    subject: string
    message_id: string
    html?: string
    text?: string
    attachments?: Array<{
      filename: string
      content_type: string
      content: string // base64 encoded
      size: number
    }>
  }
}

export async function POST(request: NextRequest) {
  try {
    const event: InboundEmailEvent = await request.json()

    if (event.type !== "email.received") {
      return NextResponse.json({ message: "Event ignored" })
    }

    const emailData = event.data

    // Extract practice ID from the email address
    // Format: documents-{practiceId}@yourdomain.com
    const toEmail = emailData.to[0]?.toLowerCase() || ""
    const practiceIdMatch = toEmail.match(/documents-([a-f0-9-]+)@/)

    if (!practiceIdMatch) {
      return NextResponse.json({ error: "Invalid email address format" }, { status: 400 })
    }

    const practiceId = practiceIdMatch[1]

    const supabase = await createAdminClient()

    // Verify practice exists
    const { data: practice, error: practiceError } = await supabase
      .from("practices")
      .select("id, name")
      .eq("id", practiceId)
      .single()

    if (practiceError || !practice) {
      console.error("Practice not found:", practiceId)
      return NextResponse.json({ error: "Practice not found" }, { status: 404 })
    }

    // Find or create "Email Dokumente" folder
    let { data: folder, error: folderError } = await supabase
      .from("document_folders")
      .select("id")
      .eq("practice_id", practiceId)
      .eq("name", "Email Dokumente")
      .is("parent_folder_id", null)
      .single()

    if (folderError || !folder) {
      // Get first user from practice to use as created_by
      const { data: user } = await supabase.from("users").select("id").eq("practice_id", practiceId).limit(1).single()

      if (!user) {
        return NextResponse.json({ error: "No user found for practice" }, { status: 500 })
      }

      const { data: newFolder, error: createError } = await supabase
        .from("document_folders")
        .insert({
          practice_id: practiceId,
          name: "Email Dokumente",
          description: "Automatisch hochgeladene Dokumente aus E-Mails",
          parent_folder_id: null,
          color: "#22c55e",
          created_by: user.id,
        })
        .select("id")
        .single()

      if (createError || !newFolder) {
        console.error("Error creating folder:", createError)
        return NextResponse.json({ error: "Failed to create folder" }, { status: 500 })
      }

      folder = newFolder
    }

    const folderId = folder.id

    // Check if email has attachments
    if (!emailData.attachments || emailData.attachments.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Email received but no attachments to process",
      })
    }

    const uploadedDocuments = []

    for (const attachment of emailData.attachments) {
      try {
        // Decode base64 content
        const buffer = Buffer.from(attachment.content, "base64")
        const file = new File([buffer], attachment.filename, { type: attachment.content_type })

        // Upload to Vercel Blob
        const blob = await put(attachment.filename, file, {
          access: "public",
          addRandomSuffix: true,
        })

        // Get first user from practice for created_by
        const { data: user } = await supabase.from("users").select("id").eq("practice_id", practiceId).limit(1).single()

        if (!user) {
          console.error("No user found for practice")
          continue
        }

        // Create document entry
        const { data: document, error: docError } = await supabase
          .from("documents")
          .insert({
            practice_id: practiceId,
            folder_id: folderId,
            name: attachment.filename,
            description: `Von: ${emailData.from}\nBetreff: ${emailData.subject}`,
            file_url: blob.url,
            file_type: attachment.content_type,
            file_size: buffer.length,
            created_by: user.id,
            version: 1,
            is_archived: false,
            tags: ["email", "auto-upload"],
          })
          .select()
          .single()

        if (docError) {
          console.error("Error creating document:", docError)
          continue
        }

        uploadedDocuments.push(document)
      } catch (error) {
        console.error("Error processing attachment:", attachment.filename, error)
        continue
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${uploadedDocuments.length} of ${emailData.attachments.length} attachments`,
      uploadedDocuments: uploadedDocuments.length,
    })
  } catch (error) {
    console.error("Error processing inbound email:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process email" },
      { status: 500 },
    )
  }
}
