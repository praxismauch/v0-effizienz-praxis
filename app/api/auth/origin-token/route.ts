import { generateOriginToken } from "@/lib/api/origin-validation"
import { NextResponse } from "next/server"

/**
 * GET /api/auth/origin-token
 * 
 * Issues a signed origin token for client-side use
 * This endpoint is intentionally public as the token itself is the security measure
 */
export async function GET() {
  try {
    const token = generateOriginToken()
    
    return NextResponse.json(
      { token, expiresIn: 300 }, // 5 minutes
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Pragma": "no-cache",
        },
      }
    )
  } catch (error) {
    console.error("[v0] Error generating origin token:", error)
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    )
  }
}
