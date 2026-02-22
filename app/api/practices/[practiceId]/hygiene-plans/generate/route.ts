import { NextRequest, NextResponse } from "next/server"
import { getApiClient } from "@/lib/supabase/admin"
import { generateText } from "ai"

const RKI_HYGIENE_CONTEXT = `
Robert Koch-Institut (RKI) Hygienerichtlinien für medizinische Praxen:

1. Händehygiene:
- Händedesinfektion vor und nach Patientenkontakt
- Händewaschen bei sichtbarer Verschmutzung
- Anwendung der WHO 5 Momente der Händehygiene

2. Flächendesinfektion:
- Regelmäßige Desinfektion von Kontaktflächen
- Desinfektion nach jedem Patienten bei Untersuchungsflächen
- Verwendung von RKI/VAH-gelisteten Desinfektionsmitteln

3. Sterilisation:
- Einhaltung der DIN EN ISO 13060 Standards
- Regelmäßige Validierung der Sterilisationsgeräte
- Dokumentation der Sterilisationszyklen

4. Abfallmanagement:
- Trennung von infektiösem und nicht-infektiösem Abfall
- Verwendung geeigneter Behälter
- Beachtung der lokalen Abfallentsorgungsvorschriften

5. Arbeitsschutz:
- Verwendung persönlicher Schutzausrüstung (PSA)
- Impfempfehlungen für das Personal
- Postexpositionsprotokolle

6. Qualitätsmanagement:
- Regelmäßige Hygienebegehungen
- Schulung und Dokumentation des Personals
- Compliance-Überwachung
`

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await getApiClient()
    const body = await request.json()

    const { category, practiceType, customRequirements, userId } = body

    console.log("[v0] Generating hygiene plan for category:", category)

    // Generate AI-based hygiene plan using RKI guidelines
    const prompt = `Erstelle basierend auf den Richtlinien des Robert Koch-Instituts (RKI) für medizinische Praxen in Deutschland einen umfassenden Hygieneplan für folgende Anforderungen:

Kategorie: ${category}
Praxistyp: ${practiceType || "Allgemeine Arztpraxis"}
Besondere Anforderungen: ${customRequirements || "Keine"}

${RKI_HYGIENE_CONTEXT}

WICHTIG: Antworte ausschließlich auf Deutsch. Alle Texte, Titel, Beschreibungen und Inhalte müssen in deutscher Sprache verfasst sein.

Erstelle einen detaillierten Hygieneplan im JSON-Format mit folgender Struktur:
{
  "title": "Klarer, beschreibender Titel auf Deutsch",
  "description": "Kurze Übersicht des Hygieneplans auf Deutsch",
  "category": "${category}",
  "frequency": "daily/weekly/monthly/as_needed",
  "responsible_role": "Verantwortliche Rolle (z.B. Praxisleitung, Gesamtes Personal)",
  "content": {
    "objective": "Hauptziel dieser Hygienemaßnahme",
    "materials": ["Liste der benötigten Materialien und Produkte"],
    "steps": [
      {"step": 1, "description": "Detaillierte Schritt-Beschreibung", "critical": true/false}
    ],
    "documentation": "Was dokumentiert werden muss",
    "quality_indicators": ["Wie die Einhaltung gemessen wird"],
    "references": ["Spezifische RKI-Richtlinien-Referenzen"]
  },
  "rki_reference_url": "URL zur relevanten RKI-Richtlinie falls verfügbar",
  "tags": ["relevante", "schlagwörter"]
}

Stelle sicher, dass der Plan:
- Den aktuellen RKI-Richtlinien entspricht
- Praxistauglich und umsetzbar ist
- Klar und leicht verständlich formuliert ist
- Spezifische Produktempfehlungen enthält, wo relevant
- Qualitäts- und Sicherheitsstandards berücksichtigt`

    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      prompt,
      temperature: 0.7,
      maxOutputTokens: 2000,
    })

    console.log("[v0] AI generated hygiene plan")

    // Parse the AI response
    let parsedPlan
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedPlan = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("No JSON found in response")
      }
    } catch (parseError) {
      console.error("[v0] Error parsing AI response:", parseError)
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 })
    }

    // Save the generated plan to the database
    console.log("[v0] Saving AI-generated hygiene plan to DB for practice:", practiceId)
    const insertPayload = {
      practice_id: practiceId,
      title: parsedPlan.title,
      description: parsedPlan.description || "",
      area: parsedPlan.category || category,
      category: parsedPlan.category || category,
      frequency: parsedPlan.frequency || "daily",
      responsible_user_id: userId || null,
      responsible_role: parsedPlan.responsible_role || null,
      status: "active",
      ai_generated: true,
      is_rki_template: false,
      generated_at: new Date().toISOString(),
      content: parsedPlan.content || {},
      tags: parsedPlan.tags || [],
      rki_reference_url: parsedPlan.rki_reference_url || null,
      products_used: parsedPlan.content?.materials ? JSON.stringify(parsedPlan.content.materials) : null,
    }
    console.log("[v0] Insert payload:", JSON.stringify(insertPayload))

    const { data: hygienePlan, error } = await supabase
      .from("hygiene_plans")
      .insert(insertPayload)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error saving generated hygiene plan:", error)
      return NextResponse.json({ error: error.message, details: JSON.stringify(error) }, { status: 500 })
    }

    if (!hygienePlan) {
      console.log("[v0] DB insert returned no data, returning AI plan directly")
      const fallbackPlan = {
        id: crypto.randomUUID(),
        ...insertPayload,
        content: parsedPlan.content || {},
        tags: parsedPlan.tags || [],
        is_rki_template: false,
        rki_reference_url: parsedPlan.rki_reference_url || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      return NextResponse.json({ hygienePlan: fallbackPlan }, { status: 201 })
    }

    return NextResponse.json({ hygienePlan }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error generating hygiene plan:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
