import { generateObject } from "ai"
import { z } from "zod"

const contactResultSchema = z.object({
  results: z.array(z.object({
    id: z.string().describe("Eindeutige ID"),
    name: z.string().describe("Name der Person oder Einrichtung"),
    company: z.string().nullable().describe("Firmenname oder Praxisname"),
    specialty: z.string().nullable().describe("Fachrichtung oder Spezialisierung"),
    address: z.string().nullable().describe("Vollständige Adresse"),
    phone: z.string().nullable().describe("Telefonnummer"),
    email: z.string().nullable().describe("E-Mail-Adresse"),
    website: z.string().nullable().describe("Website URL"),
    distance: z.string().nullable().describe("Entfernung vom Standort, z.B. '5.2 km'"),
  })),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { query, location, radius, practice_id } = body

    if (!query) {
      return Response.json({ error: "Suchanfrage ist erforderlich" }, { status: 400 })
    }

    if (!practice_id) {
      return Response.json({ error: "Praxis-ID ist erforderlich" }, { status: 400 })
    }

    // Build the prompt for the AI
    const locationContext = location 
      ? `Der Standort ist: ${location}. Suche im Umkreis von ${radius || 20}km.`
      : `Suche in Deutschland. Radius: ${radius || 20}km.`

    const prompt = `Du bist ein Assistent für eine medizinische Praxis in Deutschland. 
Generiere eine Liste von 5-10 realistischen, aber fiktiven Kontakten basierend auf der folgenden Suchanfrage.

Suchanfrage: "${query}"
${locationContext}

Die Kontakte sollten für eine Arztpraxis relevant sein (z.B. Überweiser, Labore, Apotheken, Fachärzte, Therapeuten, etc.).

Generiere realistische deutsche Namen, Adressen, Telefonnummern und E-Mail-Adressen.
Die Adressen sollten plausibel für die angegebene Region sein.

WICHTIG: Dies sind simulierte Kontakte für Demonstrationszwecke. In einer Produktionsumgebung würde hier eine echte Datenbanksuche oder API-Anbindung stattfinden.`

    const result = await generateObject({
      model: "openai/gpt-4o-mini",
      prompt,
      schema: contactResultSchema,
    })

    return Response.json(result.object)
  } catch (error: any) {
    console.error("[AI Search Error]", error)
    return Response.json(
      { error: error.message || "Fehler bei der KI-Suche" },
      { status: 500 }
    )
  }
}
