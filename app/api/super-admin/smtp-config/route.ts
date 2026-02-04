import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createAdminClient } from "@/lib/supabase/server"
import { encrypt } from "@/lib/encryption"

export async function GET() {
  await cookies()

  try {
    const supabase = await createAdminClient()

    const { data: smtpSettings, error } = await supabase.from("smtp_settings").select("*").limit(1).maybeSingle()

    if (error) {
      console.error("Error fetching SMTP settings:", error)
      // Fallback to environment variables
      const config = {
        protocol: process.env.SMTP_PROTOCOL || "smtp",
        host: process.env.SMTP_HOST || "",
        port: process.env.SMTP_PORT || "587",
        username: process.env.SMTP_USERNAME || "",
        password: "", // Never send password to client
        secure: process.env.SMTP_USE_SSL === "true" || process.env.SMTP_USE_TLS === "true",
        emailSignature: "",
      }
      return NextResponse.json({ config })
    }

    // Return database settings (prefer these over env vars)
    const config = {
      protocol: smtpSettings?.protocol || "smtp",
      host: smtpSettings?.host || "",
      port: smtpSettings?.port || "587",
      username: smtpSettings?.username || "",
      password: "", // Never send password to client
      secure: smtpSettings?.use_ssl || smtpSettings?.use_tls || false,
      emailSignature: smtpSettings?.email_signature || "",
    }

    return NextResponse.json({ config })
  } catch (error) {
    console.error("Error fetching SMTP config:", error)
    return NextResponse.json({ error: "Failed to fetch SMTP config" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  await cookies()

  try {
    const supabase = await createAdminClient()

    const body = await request.json()
    const { protocol, host, port, username, password, secure, emailSignature } = body

    // Only save if at least one field has a value
    if (!host && !username && !password && !emailSignature) {
      return NextResponse.json({
        success: true,
        message: "Leere Konfiguration übersprungen - Sie können später konfigurieren",
      })
    }

    const { data: existingSettings } = await supabase.from("smtp_settings").select("id").limit(1).maybeSingle()

    // Encrypt password before storing
    const encryptedPassword = password ? await encrypt(password) : ""

    const settingsData = {
      protocol: protocol || "smtp",
      host: host || "",
      port: port || "587",
      username: username || "",
      password_encrypted: encryptedPassword,
      use_ssl: secure || false,
      use_tls: secure || false,
      email_signature: emailSignature || "",
      updated_at: new Date().toISOString(),
    }

    let error

    if (existingSettings) {
      // Update existing settings
      // Updating existing SMTP settings
      const result = await supabase.from("smtp_settings").update(settingsData).eq("id", existingSettings.id)
      error = result.error
    } else {
      // Insert new settings
      // Inserting new SMTP settings
      const result = await supabase.from("smtp_settings").insert(settingsData)
      error = result.error
    }

    if (error) {
      console.error("Error saving SMTP settings:", error)
      return NextResponse.json(
        {
          error: "Failed to save SMTP settings",
          details: error.message,
        },
        { status: 500 },
      )
    }

    
    return NextResponse.json({ success: true, message: "SMTP-Konfiguration erfolgreich gespeichert" })
  } catch (error) {
    console.error("Error saving SMTP config:", error)
    return NextResponse.json(
      {
        error: "Failed to save SMTP config",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
