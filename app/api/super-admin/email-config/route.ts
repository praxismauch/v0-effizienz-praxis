import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {

    const supabase = await createAdminClient()

    // Check if SMTP settings exist in database
    const { data: smtpSettings, error } = await supabase.from("smtp_settings").select("*").limit(1).maybeSingle()

    const hasSmtpConfig = !error && smtpSettings !== null

    const result = {
      hasApiKey: hasSmtpConfig, // Reusing this field to indicate SMTP is configured
      hasFromEmail: hasSmtpConfig,
      apiKeyValid: hasSmtpConfig,
      fromEmail: smtpSettings?.from_email || null,
      apiKeyPrefix: hasSmtpConfig ? "SMTP konfiguriert" : null,
    }

    return NextResponse.json(result, {
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("[v0] Error checking email config:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}
