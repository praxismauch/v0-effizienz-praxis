import { NextResponse } from "next/server"
import { generateText } from "ai"

export async function POST(request: Request) {
  try {
    const { transactions, practiceId } = await request.json()

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json({ error: "Invalid transactions data" }, { status: 400 })
    }

    // Prepare transaction summary for AI
    const transactionSummary = transactions.slice(0, 50).map((t) => ({
      date: t.date,
      partner: t.partner_name,
      description: t.purpose,
      amount: t.amount,
    }))

    const totalIncome = transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)
    const totalExpenses = transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const netCashFlow = totalIncome - totalExpenses

    const prompt = `Analysiere die folgenden Banktransaktionen einer medizinischen Praxis und erstelle einen detaillierten Bericht:

Zusammenfassung:
- Anzahl Transaktionen: ${transactions.length}
- Gesamteinnahmen: ${totalIncome.toFixed(2)} EUR
- Gesamtausgaben: ${totalExpenses.toFixed(2)} EUR
- Netto-Cashflow: ${netCashFlow.toFixed(2)} EUR

Transaktionen (erste 50):
${transactionSummary.map((t) => `${t.date}: ${t.partner} - ${t.description} (${t.amount.toFixed(2)} EUR)`).join("\n")}

Bitte erstelle eine strukturierte Analyse mit folgenden Abschnitten:

1. Finanzielle Übersicht
2. Ausgabenmuster und -kategorien
3. Einnahmequellen
4. Cashflow-Trends
5. Empfehlungen zur Optimierung

Schreibe die Analyse auf Deutsch und formatiere sie übersichtlich.`

    const { text } = await generateText({
      model: "openai/gpt-4o",
      prompt,
      maxTokens: 2000,
    })

    return NextResponse.json({ analysis: text })
  } catch (error) {
    console.error("[v0] Bank account AI analysis error:", error)

    return NextResponse.json(
      {
        error: "AI analysis failed",
        message: error instanceof Error ? error.message : "Unknown error",
        isPreviewLimitation: true,
      },
      { status: 500 },
    )
  }
}
