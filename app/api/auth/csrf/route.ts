import { getCsrfTokenForClient } from "@/lib/api/csrf"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * GET /api/auth/csrf
 * Returns a CSRF token for the client to use in subsequent requests
 */
export async function GET() {
  try {
    const { token } = await getCsrfTokenForClient()

    return NextResponse.json({ token }, { status: 200 })
  } catch (error) {
    console.error("[auth/csrf] Error generating CSRF token:", error)
    return NextResponse.json({ error: "Failed to generate CSRF token" }, { status: 500 })
  }
}
