import nodemailer from "nodemailer"
import { createAdminClient } from "@/lib/supabase/server"
import { Resend } from "resend"

let resendInstance: Resend | null = null

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return null
  }

  if (!resendInstance) {
    resendInstance = new Resend(apiKey)
  }

  return resendInstance
}

interface SmtpConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

let cachedTransporter: nodemailer.Transporter | null = null
let lastConfigFetch = 0
const CONFIG_CACHE_TTL = 60000 // 1 minute

async function getSmtpConfig(): Promise<SmtpConfig | null> {
  try {
    // Check environment variables first for Hostinger SMTP
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      return {
        host: process.env.SMTP_HOST, // smtp.hostinger.com
        port: Number.parseInt(process.env.SMTP_PORT || "465"),
        secure: process.env.SMTP_PORT === "465" || process.env.SMTP_USE_SSL === "true", // Port 465 uses SSL
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD || "",
        },
      }
    }

    // Fallback to database config
    const supabase = await createAdminClient()
    const { data: smtpSettings } = await supabase.from("smtp_settings").select("*").limit(1).maybeSingle()

    if (smtpSettings?.host && smtpSettings?.username) {
      return {
        host: smtpSettings.host,
        port: Number.parseInt(smtpSettings.port || "587"),
        secure: smtpSettings.use_ssl || false,
        auth: {
          user: smtpSettings.username,
          pass: smtpSettings.password_encrypted || "",
        },
      }
    }

    return null
  } catch (error) {
    console.error("Error fetching SMTP config:", error)
    return null
  }
}

async function getTransporter(): Promise<nodemailer.Transporter | null> {
  const now = Date.now()

  // Return cached transporter if still valid
  if (cachedTransporter && now - lastConfigFetch < CONFIG_CACHE_TTL) {
    return cachedTransporter
  }

  const config = await getSmtpConfig()
  if (!config) {
    return null
  }

  cachedTransporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
    tls: {
      rejectUnauthorized: false, // Allow self-signed certificates
    },
  })

  lastConfigFetch = now
  return cachedTransporter
}

export interface SendEmailParams {
  to: string | string[]
  subject: string
  html: string
  from?: string
  replyTo?: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send an email using native SMTP
 */
export async function sendEmail({
  to,
  subject,
  html,
  from,
  replyTo,
  attachments,
}: SendEmailParams): Promise<SendEmailResult> {
  try {
    const transporter = await getTransporter()

    if (!transporter) {
      return {
        success: false,
        error: "E-Mail-Service nicht konfiguriert. Bitte SMTP-Einstellungen in den Systemeinstellungen konfigurieren.",
      }
    }

    const fromEmail =
      from || process.env.SMTP_FROM || `Effizienz Praxis <${process.env.SMTP_USER || "noreply@effizienz-praxis.de"}>`
    const recipients = Array.isArray(to) ? to.join(", ") : to

    const mailOptions: nodemailer.SendMailOptions = {
      from: fromEmail,
      to: recipients,
      subject,
      html,
      ...(replyTo && { replyTo }),
      ...(attachments && { attachments }),
    }

    const info = await transporter.sendMail(mailOptions)

    console.log(`Email sent successfully to ${recipients} - MessageID: ${info.messageId}`)

    return {
      success: true,
      messageId: info.messageId,
    }
  } catch (error) {
    console.error("Error sending email:", {
      error: error instanceof Error ? error.message : "Unknown error",
      to: Array.isArray(to) ? to : [to],
      subject,
      // Never log SMTP credentials
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unbekannter Fehler beim E-Mail-Versand",
    }
  }
}

/**
 * Check if email service is properly configured
 */
export async function isEmailConfigured(): Promise<boolean> {
  const smtpConfigured = await getSmtpConfig()
  const resendConfigured = !!process.env.RESEND_API_KEY

  return smtpConfigured !== null || resendConfigured
}

/**
 * Get email configuration status for debugging
 */
export async function getEmailConfigStatus() {
  const smtpConfig = await getSmtpConfig()

  return {
    configured: smtpConfig !== null || !!process.env.RESEND_API_KEY,
    smtpHost: smtpConfig?.host || "",
    smtpPort: smtpConfig?.port || 587,
    smtpHasAuth: !!(smtpConfig?.auth.user && smtpConfig?.auth.pass),
    smtpSource: smtpConfig ? "configured" : "none",
    resendProvider: !!process.env.RESEND_API_KEY,
    resendFromEmail: process.env.RESEND_FROM_EMAIL || "not configured",
  }
}

/**
 * Test SMTP connection
 */
export async function testSmtpConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = await getTransporter()

    if (!transporter) {
      return {
        success: false,
        error: "SMTP nicht konfiguriert",
      }
    }

    await transporter.verify()

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Verbindungsfehler",
    }
  }
}

/**
 * Clear cached transporter (useful after config changes)
 */
export function clearEmailCache(): void {
  cachedTransporter = null
  lastConfigFetch = 0
}

/**
 * Send an email using Resend (edge-compatible)
 */
export async function sendEmailWithResend({
  to,
  subject,
  html,
  from,
  replyTo,
  attachments,
}: SendEmailParams): Promise<SendEmailResult> {
  try {
    const resend = getResendClient()
    
    if (!resend) {
      console.warn("RESEND_API_KEY not configured - skipping email send")
      return {
        success: false,
        error: "E-Mail-Service nicht konfiguriert. Bitte RESEND_API_KEY in den Umgebungsvariablen konfigurieren.",
      }
    }

    const fromEmail = from || process.env.RESEND_FROM_EMAIL || "Effizienz Praxis <noreply@effizienz-praxis.de>"
    const recipients = Array.isArray(to) ? to : [to]

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: recipients,
      subject,
      html,
      ...(replyTo && { reply_to: replyTo }),
      ...(attachments && {
        attachments: attachments.map((a) => ({
          filename: a.filename,
          content: typeof a.content === "string" ? a.content : a.content.toString("base64"),
        })),
      }),
    })

    if (error) {
      console.error("Resend error:", error)
      return {
        success: false,
        error: error.message || "Fehler beim E-Mail-Versand",
      }
    }

    console.log(`Email sent successfully to ${recipients.join(", ")} - MessageID: ${data?.id}`)

    return {
      success: true,
      messageId: data?.id,
    }
  } catch (error) {
    console.error("Error sending email:", {
      error: error instanceof Error ? error.message : "Unknown error",
      to: Array.isArray(to) ? to : [to],
      subject,
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unbekannter Fehler beim E-Mail-Versand",
    }
  }
}
