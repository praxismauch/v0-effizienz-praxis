import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { practiceId: string } }) {
  const practiceId = String(params.practiceId)

  try {
    const supabase = await createAdminClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from("bank_transactions")
      .select("*", { count: "exact" })
      .eq("practice_id", practiceId)
      .order("transaction_date", { ascending: false })

    if (error) {
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
  } catch (error: any) {
    console.error("Bank transactions GET - Error:", error)

    if (error?.message?.includes("Too Many Requests") || error?.message?.includes("rate limit")) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte versuchen Sie es in einem Moment erneut." },
        { status: 429 },
      )
    }

    return NextResponse.json(
      {
        error: "Fehler beim Laden der Transaktionen",
        details: error?.message || "Unbekannter Fehler",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request, { params }: { params: { practiceId: string } }) {
  try {
    const practiceId = String(params.practiceId)

    const supabase = await createAdminClient()

    const { error } = await supabase.from("bank_transactions").delete().eq("practice_id", practiceId)

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
  } catch (error: any) {
    console.error("Bank transactions DELETE - Error:", error?.message || error)
    return NextResponse.json(
      { error: error?.message || "Failed to delete transactions" },
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
