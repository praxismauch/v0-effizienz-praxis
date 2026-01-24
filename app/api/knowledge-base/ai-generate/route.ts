import { generateText } from "ai"

export const runtime = "edge"

export async function POST(request: Request) {
  let prompt = ""
  let action = "generate"
  let context = ""

  try {
    const body = await request.json()
    prompt = body.prompt || ""
    action = body.action || "generate"
    context = body.context || ""

    if (!process.env.OPENAI_API_KEY) {
      const fallbackText = getFallbackText(action, prompt)
      return new Response(
        JSON.stringify({
          text: fallbackText,
          isFallback: true,
          message:
            "KI-Assistent ist in der Vorschau nicht verfügbar. Hier ist ein Platzhaltertext, den Sie anpassen können.",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
    }

    let systemPrompt = "Sie sind ein hilfreicher Assistent für medizinische Dokumentation in einer Arztpraxis."
    let userPrompt = ""

    switch (action) {
      case "generate":
        userPrompt = `Erstellen Sie einen gut strukturierten Dokumentationstext über: ${prompt}\n\nDer Text sollte professionell, klar und für medizinisches Personal verständlich sein. Verwenden Sie Markdown-Formatierung mit Überschriften (##), Listen und Absätzen.`
        break
      case "improve":
        systemPrompt +=
          " Verbessern Sie den folgenden Text, indem Sie ihn klarer, präziser und professioneller formulieren."
        userPrompt = `Aktueller Text:\n${context}\n\n${prompt ? `Zusätzliche Anweisungen: ${prompt}` : ""}\n\nBitte verbessern Sie diesen Text.`
        break
      case "expand":
        systemPrompt += " Erweitern Sie den folgenden Text mit zusätzlichen Details und Hintergrundinformationen."
        userPrompt = `Aktueller Text:\n${context}\n\n${prompt ? `Zusätzliche Anweisungen: ${prompt}` : ""}\n\nBitte erweitern Sie diesen Text.`
        break
      case "summarize":
        systemPrompt += " Erstellen Sie eine prägnante Zusammenfassung des folgenden Textes."
        userPrompt = `Aktueller Text:\n${context}\n\n${prompt ? `Zusätzliche Anweisungen: ${prompt}` : ""}\n\nBitte fassen Sie diesen Text zusammen.`
        break
      default:
        userPrompt = prompt
    }

    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
      maxOutputTokens: 2000,
    })

    return new Response(
      JSON.stringify({
        text,
        isFallback: false,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  } catch (error) {
    console.error("[v0] AI generation error:", error)

    const fallbackText = getFallbackText(action, prompt)

    return new Response(
      JSON.stringify({
        text: fallbackText,
        isFallback: true,
        message: "Fehler bei der KI-Generierung. Hier ist ein Platzhaltertext, den Sie anpassen können.",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}

function getFallbackText(action: string, prompt: string): string {
  switch (action) {
    case "generate":
      return `# ${prompt}\n\n[Der KI-Assistent ist derzeit nicht verfügbar. Bitte schreiben Sie Ihren Text hier manuell.]\n\n## Einleitung\n\nBeschreiben Sie hier die wichtigsten Punkte zu "${prompt}".\n\n## Hauptteil\n\nFügen Sie hier detaillierte Informationen hinzu.\n\n## Zusammenfassung\n\nFassen Sie die wichtigsten Erkenntnisse zusammen.`
    case "improve":
      return `[Der KI-Assistent ist derzeit nicht verfügbar. Bitte überarbeiten Sie Ihren Text manuell.]\n\nHier sind einige Tipps zur Verbesserung:\n- Verwenden Sie klare und präzise Formulierungen\n- Strukturieren Sie den Text mit Überschriften\n- Fügen Sie konkrete Beispiele hinzu`
    case "expand":
      return `[Der KI-Assistent ist derzeit nicht verfügbar. Bitte erweitern Sie Ihren Text manuell.]\n\nHier sind einige Vorschläge zur Erweiterung:\n- Fügen Sie mehr Details und Hintergrundinformationen hinzu\n- Ergänzen Sie praktische Beispiele\n- Erläutern Sie die Bedeutung für die Praxis`
    case "summarize":
      return `[Der KI-Assistent ist derzeit nicht verfügbar. Bitte erstellen Sie eine Zusammenfassung manuell.]\n\nEine gute Zusammenfassung sollte:\n- Die Hauptpunkte hervorheben\n- Prägnant und klar formuliert sein\n- Die wichtigsten Erkenntnisse enthalten`
    default:
      return `[Der KI-Assistent ist derzeit nicht verfügbar. Bitte schreiben Sie Ihren Text hier manuell.]`
  }
}
