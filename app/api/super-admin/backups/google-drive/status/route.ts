import { type NextRequest, NextResponse } from "next/server"

/**
 * GET /api/super-admin/backups/google-drive/status
 * 
 * Check Google Drive connection status for backup functionality
 * Returns connection status and configuration details
 */
export async function GET(request: NextRequest) {
  try {
    // Check if Google Drive credentials are configured
    const hasCredentials = !!(
      process.env.GOOGLE_DRIVE_CLIENT_ID &&
      process.env.GOOGLE_DRIVE_CLIENT_SECRET &&
      process.env.GOOGLE_DRIVE_REFRESH_TOKEN
    )

    if (!hasCredentials) {
      return NextResponse.json({
        connected: false,
        message: "Google Drive credentials not configured",
        requiresSetup: true,
      })
    }

    // For now, return basic connection status
    // In the future, this could make an actual API call to verify the connection
    return NextResponse.json({
      connected: true,
      message: "Google Drive credentials are configured",
      lastChecked: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("[v0] Error checking Google Drive status:", error)
    return NextResponse.json(
      { 
        connected: false, 
        error: error.message || "Failed to check Google Drive connection",
        requiresSetup: true,
      },
      { status: 200 } // Return 200 to prevent UI errors
    )
  }
}
