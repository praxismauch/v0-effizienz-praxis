import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { processEmailConfig } from "@/lib/email/imap-processor"

export const dynamic = "force-dynamic"
export const maxDuration = 300 // 5 minutes max

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createAdminClient()

    // Get all active email configs
    const { data: configs, error: configsError } = await supabase
      .from("practice_email_configs")
      .select("*")
      .eq("is_active", true)
      .eq("email_type", "imap")

    if (configsError) {
      console.error("Error fetching email configs:", configsError)
      return NextResponse.json({ error: configsError.message }, { status: 500 })
    }

    if (!configs || configs.length === 0) {
      return NextResponse.json({ message: "No active email configs found", processed: 0 })
    }

    const results = []

    for (const config of configs) {
      try {
        const result = await processEmailConfig(config)

        // Update config with last check info
        await supabase
          .from("practice_email_configs")
          .update({
            last_check_at: new Date().toISOString(),
            last_error: result.errors.length > 0 ? result.errors.join("; ") : null,
            emails_processed: (config.emails_processed || 0) + result.emailsProcessed,
            documents_uploaded: (config.documents_uploaded || 0) + result.documentsUploaded,
            updated_at: new Date().toISOString(),
          })
          .eq("id", config.id)

        results.push({
          configId: config.id,
          practiceId: config.practice_id,
          emailAddress: config.email_address,
          ...result,
        })
      } catch (processError: any) {
        console.error(`Error processing config ${config.id}:`, processError)

        await supabase
          .from("practice_email_configs")
          .update({
            last_check_at: new Date().toISOString(),
            last_error: processError.message,
            updated_at: new Date().toISOString(),
          })
          .eq("id", config.id)

        results.push({
          configId: config.id,
          practiceId: config.practice_id,
          emailAddress: config.email_address,
          success: false,
          error: processError.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      processed: configs.length,
      results,
    })
  } catch (error) {
    console.error("Cron job error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
