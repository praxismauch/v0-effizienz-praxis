/**
 * CSRF Token API
 * GET: Returns CSRF token for client-side use
 */
import { NextResponse } from "next/server"
import { getCsrfTokenForClient } from "@/lib/api/csrf"

export async function GET() {
  try {
    const { token } = await getCsrfTokenForClient()

    return NextResponse.json({ csrfToken: token })
  } catch (error) {
    console.error("CSRF token error:", error)
    return NextResponse.json({ error: "Failed to generate CSRF token" }, { status: 500 })
  }
}
