import { generateText, Output } from "ai"
import { z } from "zod"

export async function POST(req: Request) {
  try {
    const { url } = await req.json()

    if (!url) {
      return Response.json({ error: "URL ist erforderlich" }, { status: 400 })
    }

    // Normalize URL
    let normalizedUrl = url.trim()
    if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
      normalizedUrl = "https://" + normalizedUrl
    }

    // Fetch the website content
    let websiteText = ""
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)

      const response = await fetch(normalizedUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; PraxisBot/1.0)",
          Accept: "text/html,application/xhtml+xml",
        },
      })

      clearTimeout(timeout)

      if (!response.ok) {
        return Response.json(
          { error: `Website konnte nicht geladen werden (Status ${response.status})` },
          { status: 400 },
        )
      }

      const html = await response.text()

      // Extract text content from HTML - strip tags, scripts, styles
      websiteText = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, " FOOTER: ")
        .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, " HEADER: ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&#\d+;/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 12000) // Limit to ~12k chars to stay within AI context

      if (websiteText.length < 50) {
        return Response.json(
          { error: "Die Website enthält zu wenig Text zur Analyse." },
          { status: 400 },
        )
      }
    } catch (fetchError: any) {
      if (fetchError.name === "AbortError") {
        return Response.json({ error: "Zeitüberschreitung beim Laden der Website." }, { status: 400 })
      }
      return Response.json(
        { error: `Website konnte nicht geladen werden: ${fetchError.message}` },
        { status: 400 },
      )
    }

    // DSGVO: We only send the publicly available website text to AI, no personal data
    const result = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      output: Output.object({
        schema: z.object({
          name: z.string().nullable().describe("Full practice name"),
          praxisArt: z
            .enum(["einzelpraxis", "bag", "mvz", "praxisgemeinschaft", "facharzt", "zahnarzt", "other"])
            .nullable()
            .describe("Type of practice"),
          fachrichtungen: z
            .array(z.string())
            .nullable()
            .describe("Medical specialties/departments, e.g. Allgemeinmedizin, Kardiologie"),
          street: z.string().nullable().describe("Street and house number"),
          zipCode: z.string().nullable().describe("Postal/ZIP code"),
          city: z.string().nullable().describe("City name"),
          bundesland: z
            .enum([
              "Baden-Württemberg",
              "Bayern",
              "Berlin",
              "Brandenburg",
              "Bremen",
              "Hamburg",
              "Hessen",
              "Mecklenburg-Vorpommern",
              "Niedersachsen",
              "Nordrhein-Westfalen",
              "Rheinland-Pfalz",
              "Saarland",
              "Sachsen",
              "Sachsen-Anhalt",
              "Schleswig-Holstein",
              "Thüringen",
            ])
            .nullable()
            .describe("German federal state, inferred from city/zip if not explicit"),
          phone: z.string().nullable().describe("Phone number"),
          email: z.string().nullable().describe("Email address"),
          website: z.string().nullable().describe("Website URL"),
        }),
      }),
      prompt: `Analysiere den folgenden Webseiteninhalt einer deutschen Arztpraxis und extrahiere alle verfügbaren Informationen.
DSGVO-HINWEIS: Die Daten stammen von einer öffentlichen Website.

Regeln:
- Extrahiere NUR Informationen, die tatsächlich im Text vorhanden sind.
- Für "praxisArt": Bestimme ob es eine Einzelpraxis, BAG, MVZ, Praxisgemeinschaft, Facharztpraxis, Zahnarztpraxis oder Sonstige ist.
- Für "fachrichtungen": Liste alle medizinischen Fachrichtungen auf (z.B. "Allgemeinmedizin", "Innere Medizin", "Kardiologie", "Orthopädie", "Dermatologie", etc.)
- Für "bundesland": Leite es aus der Stadt oder PLZ ab, wenn es nicht explizit genannt wird.
- Gib null zurück für Felder, die nicht gefunden werden können.
- Die URL der Praxis-Website ist: ${normalizedUrl}

WEBSEITENINHALT:
${websiteText}`,
    })

    return Response.json({
      success: true,
      data: result.output,
      websiteUrl: normalizedUrl,
    })
  } catch (error: any) {
    console.error("AI extraction error:", error)
    return Response.json(
      { error: error.message || "Fehler bei der KI-Analyse der Website" },
      { status: 500 },
    )
  }
}
