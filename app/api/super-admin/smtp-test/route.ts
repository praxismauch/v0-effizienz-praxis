import { NextResponse } from "next/server"
import { testSmtpConnection } from "@/lib/email/send-email"

export async function POST() {
  try {
    const result = await testSmtpConnection()
    return NextResponse.json(result)
  } catch (error) {
    console.error("SMTP test error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Verbindungstest fehlgeschlagen" },
      { status: 500 }
    )
  }
}
