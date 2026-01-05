import Imap from "imap"
import { simpleParser, type ParsedMail, type Attachment } from "mailparser"
import { put } from "@vercel/blob"
import { createAdminClient } from "@/lib/supabase/server"

interface EmailConfig {
  id: string
  practice_id: string
  email_address: string
  imap_host: string
  imap_port: number
  imap_user: string
  imap_password_encrypted: string
  use_ssl: boolean
  target_folder_id: string | null
  allowed_file_types: string[]
  max_file_size_mb: number
  auto_analyze_with_ai: boolean
}

interface ProcessedResult {
  success: boolean
  emailsProcessed: number
  documentsUploaded: number
  errors: string[]
}

// Decrypt password using environment key
function decryptPassword(encrypted: string): string {
  const key = process.env.ENCRYPTION_KEY || ""
  if (!key) {
    console.warn("No ENCRYPTION_KEY set, using raw value")
    return encrypted
  }

  try {
    // Simple XOR decryption - in production use proper encryption like AES
    const encryptedBuffer = Buffer.from(encrypted, "base64")
    const keyBuffer = Buffer.from(key)
    const decrypted = Buffer.alloc(encryptedBuffer.length)

    for (let i = 0; i < encryptedBuffer.length; i++) {
      decrypted[i] = encryptedBuffer[i] ^ keyBuffer[i % keyBuffer.length]
    }

    return decrypted.toString("utf8")
  } catch (error) {
    console.error("Decryption error:", error)
    return encrypted
  }
}

// Encrypt password for storage
export function encryptPassword(password: string): string {
  const key = process.env.ENCRYPTION_KEY || ""
  if (!key) {
    console.warn("No ENCRYPTION_KEY set, storing raw value")
    return password
  }

  try {
    const passwordBuffer = Buffer.from(password, "utf8")
    const keyBuffer = Buffer.from(key)
    const encrypted = Buffer.alloc(passwordBuffer.length)

    for (let i = 0; i < passwordBuffer.length; i++) {
      encrypted[i] = passwordBuffer[i] ^ keyBuffer[i % keyBuffer.length]
    }

    return encrypted.toString("base64")
  } catch (error) {
    console.error("Encryption error:", error)
    return password
  }
}

// Check if file type is allowed
function isFileTypeAllowed(contentType: string, allowedTypes: string[]): boolean {
  // Also allow by extension patterns
  const extensionMap: Record<string, string[]> = {
    "application/pdf": ["pdf"],
    "application/msword": ["doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
    "application/vnd.ms-excel": ["xls"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ["xlsx"],
  }

  return allowedTypes.some((type) => {
    if (contentType.includes(type)) return true
    // Check by content type start
    if (contentType.startsWith(type.split("/")[0])) return true
    return false
  })
}

// Process a single email config
export async function processEmailConfig(config: EmailConfig): Promise<ProcessedResult> {
  const result: ProcessedResult = {
    success: true,
    emailsProcessed: 0,
    documentsUploaded: 0,
    errors: [],
  }

  const supabase = await createAdminClient()
  const password = decryptPassword(config.imap_password_encrypted)

  return new Promise((resolve) => {
    const imap = new Imap({
      user: config.imap_user,
      password: password,
      host: config.imap_host,
      port: config.imap_port,
      tls: config.use_ssl,
      tlsOptions: { rejectUnauthorized: false },
      connTimeout: 30000,
      authTimeout: 15000,
    })

    imap.once("ready", () => {
      imap.openBox("INBOX", false, async (err, box) => {
        if (err) {
          result.success = false
          result.errors.push(`Failed to open inbox: ${err.message}`)
          imap.end()
          resolve(result)
          return
        }

        // Search for unseen messages
        imap.search(["UNSEEN"], async (searchErr, uids) => {
          if (searchErr) {
            result.success = false
            result.errors.push(`Search error: ${searchErr.message}`)
            imap.end()
            resolve(result)
            return
          }

          if (!uids || uids.length === 0) {
            imap.end()
            resolve(result)
            return
          }

          const fetch = imap.fetch(uids, { bodies: "", markSeen: true })
          const emailPromises: Promise<void>[] = []

          fetch.on("message", (msg, seqno) => {
            const emailPromise = new Promise<void>((resolveEmail) => {
              let buffer = ""

              msg.on("body", (stream) => {
                stream.on("data", (chunk) => {
                  buffer += chunk.toString("utf8")
                })
              })

              msg.once("end", async () => {
                try {
                  const parsed = await simpleParser(buffer)
                  await processEmail(parsed, config, supabase, result)
                  result.emailsProcessed++
                } catch (parseErr: any) {
                  result.errors.push(`Parse error: ${parseErr.message}`)
                }
                resolveEmail()
              })
            })

            emailPromises.push(emailPromise)
          })

          fetch.once("error", (fetchErr) => {
            result.errors.push(`Fetch error: ${fetchErr.message}`)
          })

          fetch.once("end", async () => {
            await Promise.all(emailPromises)
            imap.end()
            resolve(result)
          })
        })
      })
    })

    imap.once("error", (imapErr) => {
      result.success = false
      result.errors.push(`IMAP error: ${imapErr.message}`)
      resolve(result)
    })

    imap.once("end", () => {
      // Connection ended
    })

    // Set timeout
    setTimeout(() => {
      try {
        imap.end()
      } catch (e) {
        // Ignore
      }
      if (result.emailsProcessed === 0 && result.errors.length === 0) {
        result.errors.push("Connection timeout")
      }
      resolve(result)
    }, 60000)

    imap.connect()
  })
}

async function processEmail(
  parsed: ParsedMail,
  config: EmailConfig,
  supabase: any,
  result: ProcessedResult,
): Promise<void> {
  const messageId = parsed.messageId || `${Date.now()}-${Math.random()}`

  // Check if already processed
  const { data: existing } = await supabase
    .from("processed_emails")
    .select("id")
    .eq("config_id", config.id)
    .eq("message_id", messageId)
    .single()

  if (existing) {
    return // Already processed
  }

  // Get attachments
  const attachments = parsed.attachments || []
  const validAttachments = attachments.filter((att: Attachment) => {
    const contentType = att.contentType || "application/octet-stream"
    const size = att.size || 0
    const maxSize = config.max_file_size_mb * 1024 * 1024

    return isFileTypeAllowed(contentType, config.allowed_file_types) && size <= maxSize
  })

  if (validAttachments.length === 0) {
    // Record that we processed this email but no valid attachments
    await supabase.from("processed_emails").insert({
      config_id: config.id,
      message_id: messageId,
      from_address: parsed.from?.text || "unknown",
      subject: parsed.subject || "No subject",
      received_at: parsed.date || new Date(),
      attachments_count: attachments.length,
      documents_created: 0,
      status: "success",
    })
    return
  }

  // Get or create target folder
  let folderId = config.target_folder_id

  if (!folderId) {
    // Create or get "Email Uploads" folder
    const { data: folder } = await supabase
      .from("document_folders")
      .select("id")
      .eq("practice_id", config.practice_id)
      .eq("name", "Email Uploads")
      .is("parent_folder_id", null)
      .single()

    if (folder) {
      folderId = folder.id
    } else {
      // Get first user from practice
      const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("practice_id", config.practice_id)
        .limit(1)
        .single()

      if (user) {
        const { data: newFolder } = await supabase
          .from("document_folders")
          .insert({
            practice_id: config.practice_id,
            name: "Email Uploads",
            description: "Automatisch aus E-Mails hochgeladene Dokumente",
            color: "#3b82f6",
            created_by: user.id,
          })
          .select("id")
          .single()

        if (newFolder) {
          folderId = newFolder.id
        }
      }
    }
  }

  // Get a user for created_by
  const { data: practiceUser } = await supabase
    .from("users")
    .select("id")
    .eq("practice_id", config.practice_id)
    .limit(1)
    .single()

  const createdBy = practiceUser?.id || config.created_by

  let documentsCreated = 0

  for (const attachment of validAttachments) {
    try {
      // Upload to Vercel Blob
      const blob = await put(
        `email-uploads/${config.practice_id}/${Date.now()}-${attachment.filename}`,
        attachment.content,
        { access: "public", addRandomSuffix: true },
      )

      // Create document record
      const { error: docError } = await supabase.from("documents").insert({
        practice_id: config.practice_id,
        folder_id: folderId,
        name: attachment.filename || "Unnamed attachment",
        description: `Von: ${parsed.from?.text || "Unbekannt"}\nBetreff: ${parsed.subject || "Kein Betreff"}\nDatum: ${parsed.date?.toLocaleDateString("de-DE") || "Unbekannt"}`,
        file_url: blob.url,
        file_type: attachment.contentType || "application/octet-stream",
        file_size: attachment.size || 0,
        created_by: createdBy,
        tags: ["email-upload", "automatisch"],
        version: 1,
        is_archived: false,
      })

      if (!docError) {
        documentsCreated++
        result.documentsUploaded++
      }
    } catch (uploadErr: any) {
      result.errors.push(`Upload error for ${attachment.filename}: ${uploadErr.message}`)
    }
  }

  // Record processed email
  await supabase.from("processed_emails").insert({
    config_id: config.id,
    message_id: messageId,
    from_address: parsed.from?.text || "unknown",
    subject: parsed.subject || "No subject",
    received_at: parsed.date || new Date(),
    attachments_count: validAttachments.length,
    documents_created: documentsCreated,
    status: documentsCreated > 0 ? "success" : "partial",
  })
}

// This module handles IMAP email processing for document uploads
