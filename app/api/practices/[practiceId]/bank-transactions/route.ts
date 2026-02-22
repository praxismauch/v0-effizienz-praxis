import { NextResponse } from "next/server"
import { requirePracticeAccess, handleApiError } from "@/lib/api-helpers"

export async function GET(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  const { practiceId } = await params

  try {
    const { adminClient } = await requirePracticeAccess(practiceId)

    const { data, error } = await adminClient
      .from("bank_transactions")
      .select("*", { count: "exact" })
      .eq("practice_id", practiceId)
      .order("transaction_date", { ascending: false })

    if (error) {
      // Table does not exist yet - return empty array gracefully
      if (error.code === "PGRST205" || error.message?.includes("Could not find the table")) {
        return NextResponse.json([])
      }

      console.error("Bank transactions GET - Database error:", error)

      if (error.message?.includes("Too Many Requests") || error.message?.includes("rate limit")) {
        return NextResponse.json(
          { error: "Zu viele Anfragen. Bitte versuchen Sie es in einem Moment erneut." },
          { status: 429 },
        )
      }

      return NextResponse.json(
        {
          error: "Fehler beim Laden der Transaktionen",
          details: error.message || "Unbekannter Fehler",
        },
        { status: 500 },
      )
    }

    return NextResponse.json(data || [])
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    const { adminClient } = await requirePracticeAccess(practiceId)

    const { error } = await adminClient.from("bank_transactions").delete().eq("practice_id", practiceId)

    if (error) {
      console.error("Bank transactions DELETE - Error:", error)
      throw error
    }

    return NextResponse.json(
      {
        success: true,
        message: "Alle Transaktionen wurden gelöscht",
      },
      {
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    return handleApiError(error)
  }
}
