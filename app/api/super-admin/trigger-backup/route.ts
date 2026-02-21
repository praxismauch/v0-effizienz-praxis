import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * Manually trigger the daily backup cron job from the super-admin UI.
 * This calls the cron endpoint internally, bypassing the Vercel cron scheduler.
 */
export async function POST(request: NextRequest) {
  try {
    // Get the base URL from the request
    const url = new URL("/api/cron/daily-backup", request.url)

    console.log("[v0] Manually triggering daily backup cron at:", url.toString())

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        // Pass the cron secret if available
        ...(process.env.CRON_SECRET ? { authorization: `Bearer ${process.env.CRON_SECRET}` } : {}),
      },
    })

    const result = await response.json()

    if (!response.ok) {
      console.error("[v0] Trigger backup failed:", result)
      return NextResponse.json(
        { error: result.error || "Backup fehlgeschlagen" },
        { status: response.status }
      )
    }

    console.log("[v0] Trigger backup completed:", result)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[v0] Error triggering backup:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Starten des Backups" },
      { status: 500 }
    )
  }
}
