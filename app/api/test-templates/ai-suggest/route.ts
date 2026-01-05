import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("[v0] AI suggest templates request:", {
      existingCount: body.existingTemplates?.length,
      categoriesCount: body.categories?.length,
      hasCustomPrompt: !!body.customPrompt,
    })

    const { existingTemplates = [], categories = [], customPrompt } = body

    if (!categories || categories.length === 0) {
      console.error("[v0] No categories provided for AI suggestions")
      return NextResponse.json({ error: "No categories available. Please create categories first." }, { status: 400 })
    }

    const categoryList = categories.map((c: any) => `${c.name} (ID: ${c.id})`).join(", ")

    let prompt: string

    if (customPrompt && customPrompt.trim()) {
      // User provided a custom prompt
      prompt = `Du bist ein Experte für Softwaretest-Management in einer Praxismanagement Software.

Bestehende Test-Items: ${existingTemplates.length > 0 ? existingTemplates.join(", ") : "Keine"}

Verfügbare Kategorien: ${categoryList}

Der Benutzer möchte Test-Items für folgendes Thema: "${customPrompt.trim()}"

Generiere 10-15 konkrete, praxisnahe Test-Items basierend auf der Anfrage des Benutzers.
Die Items sollten die Anfrage detailliert abdecken und wichtige Aspekte berücksichtigen.

Gib die Antwort als JSON-Array zurück mit diesem Format:
[
  {
    "title": "Kurzer Test-Item-Titel",
    "description": "Detaillierte Testanweisung was und wie getestet werden soll",
    "category_id": "passende Kategorie-ID aus der Liste"
  }
]

Verteile die Test-Items sinnvoll auf verschiedene Kategorien.`
    } else {
      // No custom prompt - use default generic suggestions
      prompt = `Du bist ein Experte für Softwaretest-Management in einer Praxismanagement Software.

Bestehende Test-Items: ${existingTemplates.length > 0 ? existingTemplates.join(", ") : "Keine"}

Verfügbare Kategorien: ${categoryList}

Generiere 10-15 konkrete, praxisnahe Test-Items für eine medizinische Praxismanagement Software. 
Die Items sollten wichtige Funktionen und Aspekte abdecken, die noch nicht getestet werden.

Beispiele für Test-Items:
- "Login-Funktionalität mit korrekten Credentials"
- "Patienten-Stammdaten erfassen und speichern"
- "Termine buchen und stornieren"
- "Abrechnungen erstellen und exportieren"
- "DSGVO-konforme Datenlöschung"
- "Backup-Wiederherstellung testen"

Gib die Antwort als JSON-Array zurück mit diesem Format:
[
  {
    "title": "Kurzer Test-Item-Titel",
    "description": "Detaillierte Testanweisung was und wie getestet werden soll",
    "category_id": "passende Kategorie-ID aus der Liste"
  }
]

Verteile die Test-Items sinnvoll auf verschiedene Kategorien.`
    }

    console.log("[v0] Generating AI suggestions with prompt length:", prompt.length)

    const { text } = await generateText({
      model: "openai/gpt-4o",
      prompt,
    })

    console.log("[v0] AI response received, length:", text.length)

    // Parse JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.error("[v0] No valid JSON found in AI response:", text)
      throw new Error("Keine gültige JSON-Antwort erhalten")
    }

    const suggestions = JSON.parse(jsonMatch[0])
    console.log("[v0] Parsed AI suggestions:", suggestions.length)

    return NextResponse.json(
      { suggestions },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  } catch (error) {
    console.error("[v0] Error generating AI suggestions:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate suggestions" },
      { status: 500 },
    )
  }
}
