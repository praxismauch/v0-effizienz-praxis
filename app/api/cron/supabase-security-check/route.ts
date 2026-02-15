export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { runSecurityMonitor } from "@/lib/api/supabase-monitor"
import { sendSecurityAlert } from "@/lib/api/alerts"
import { appLogger } from "@/lib/logger"

/**
 * GET /api/cron/supabase-security-check
 * 
 * Cron job that runs daily security checks on the Supabase database:
 * - Verifies RLS is enabled on all critical tables
 * - Checks for missing RLS policies
 * - Detects anomalous user patterns
 * 
 * Schedule: Daily at 03:00 UTC
 * Vercel cron config: "0 3 * * *"
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    appLogger.info("cron", "Starting Supabase security check cron job")

    // Run the security monitor
    const result = await runSecurityMonitor()

    // Send summary alert if there are issues
    if (!result.overallSecure || result.warnings.length > 0) {
      await sendSecurityAlert({
        severity: result.tablesWithoutRLS.length > 0 ? "critical" : "warning",
        title: "Taglicher Sicherheitsbericht",
        message: result.overallSecure
          ? `Sicherheitscheck bestanden mit ${result.warnings.length} Warnung(en)`
          : `Sicherheitsprobleme erkannt: ${result.tablesWithoutRLS.length} Tabellen ohne RLS`,
        details: {
          tables_without_rls: result.tablesWithoutRLS.join(", ") || "Keine",
          tables_without_policies: result.tablesWithoutPolicies.join(", ") || "Keine",
          warnings: result.warnings.join("; ") || "Keine",
          scan_time: result.timestamp,
        },
      })
    }

    appLogger.info("cron", "Supabase security check completed", {
      overallSecure: result.overallSecure,
      warnings: result.warnings.length,
    })

    return NextResponse.json({
      success: true,
      result: {
        overallSecure: result.overallSecure,
        tablesChecked: result.rlsChecks.length,
        tablesWithoutRLS: result.tablesWithoutRLS.length,
        tablesWithoutPolicies: result.tablesWithoutPolicies.length,
        warnings: result.warnings.length,
        timestamp: result.timestamp,
      },
    })
  } catch (error) {
    appLogger.error("cron", "Supabase security check failed", {
      error: error instanceof Error ? error.message : String(error),
    })

    return NextResponse.json(
      { error: "Security check failed", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
