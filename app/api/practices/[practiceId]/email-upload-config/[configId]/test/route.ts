import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import Imap from "imap"

// Decrypt password using environment key
function decryptPassword(encrypted: string): string {
  const key = process.env.ENCRYPTION_KEY || ""
  if (!key) return encrypted

  try {
    const encryptedBuffer = Buffer.from(encrypted, "base64")
    const keyBuffer = Buffer.from(key)
    const decrypted = Buffer.alloc(encryptedBuffer.length)

    for (let i = 0; i < encryptedBuffer.length; i++) {
      decrypted[i] = encryptedBuffer[i] ^ keyBuffer[i % keyBuffer.length]
    }

    return decrypted.toString("utf8")
  } catch (error) {
    return encrypted
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; configId: string }> },
) {
  try {
    const { practiceId, configId } = await params
    const supabase = await createAdminClient()

    const { data: config, error } = await supabase
      .from("practice_email_configs")
      .select("*")
      .eq("id", configId)
      .eq("practice_id", practiceId)
      .single()

    if (error || !config) {
      return NextResponse.json({ error: "Config not found" }, { status: 404 })
    }

    const password = decryptPassword(config.imap_password_encrypted)

    return new Promise<NextResponse>((resolve) => {
      const imap = new Imap({
        user: config.imap_user,
        password: password,
        host: config.imap_host,
        port: config.imap_port,
        tls: config.use_ssl,
        tlsOptions: { rejectUnauthorized: false },
        connTimeout: 15000,
        authTimeout: 10000,
      })

      const timeout = setTimeout(() => {
        try {
          imap.end()
        } catch (e) {
          console.error("[v0] Error ending IMAP connection on timeout:", e)
        }
        resolve(
          NextResponse.json({
            success: false,
            error: "Verbindungs-Timeout - Server antwortet nicht",
          }),
        )
      }, 20000)

      imap.once("ready", () => {
        clearTimeout(timeout)
        imap.openBox("INBOX", true, (err, box) => {
          if (err) {
            imap.end()
            resolve(
              NextResponse.json({
                success: false,
                error: `Inbox konnte nicht geöffnet werden: ${err.message}`,
              }),
            )
            return
          }

          const messageCount = box.messages.total
          const unseenCount = box.messages.unseen

          imap.end()
          resolve(
            NextResponse.json({
              success: true,
              message: "Verbindung erfolgreich!",
              details: {
                totalMessages: messageCount,
                unseenMessages: unseenCount,
                mailbox: box.name,
              },
            }),
          )
        })
      })

      imap.once("error", (err) => {
        clearTimeout(timeout)
        resolve(
          NextResponse.json({
            success: false,
            error: `IMAP Fehler: ${err.message}`,
          }),
        )
      })

      imap.connect()
    })
  } catch (error) {
    console.error("Test connection error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
