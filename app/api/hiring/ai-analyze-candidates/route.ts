import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const { practiceId, jobPostingId } = await request.json()

    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID required" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    const query = supabase
      .from("candidates")
      .select("*")
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .neq("status", "archived")

    const { data: candidates, error } = await query

    if (error) {
      console.error("Error fetching candidates:", error)
      return NextResponse.json({ error: "Failed to fetch candidates" }, { status: 500 })
    }

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ summary: "Keine Kandidaten vorhanden.", recommendations: [] }, { status: 200 })
    }

    // Fetch job posting details if provided
    let jobPostingDetails = ""
    if (jobPostingId) {
      const { data: jobPosting } = await supabase
        .from("job_postings")
        .select("*")
        .eq("id", jobPostingId)
        .is("deleted_at", null)
        .maybeSingle()

      if (jobPosting) {
        jobPostingDetails = `
Stellenausschreibung: ${jobPosting.title}
Abteilung: ${jobPosting.department || "Nicht angegeben"}
Beschreibung: ${jobPosting.description || "Nicht angegeben"}
Anforderungen: ${jobPosting.requirements || "Nicht angegeben"}
Verantwortlichkeiten: ${jobPosting.responsibilities || "Nicht angegeben"}
`
      }
    }

    const candidatesSummary = await Promise.all(
      candidates.map(async (c, index) => {
        const documents = c.documents || []
        let documentContent = ""

        // Fetch content from uploaded documents with better error handling
        if (documents.length > 0) {
          const documentTexts = await Promise.all(
            documents.slice(0, 3).map(async (doc: any) => {
              try {
                if (doc.url && typeof doc.url === "string") {
                  // Use fetch with timeout and proper error handling
                  const controller = new AbortController()
                  const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

                  const response = await fetch(doc.url, {
                    signal: controller.signal,
                    headers: {
                      Accept: "text/plain, application/pdf, text/*, application/*",
                    },
                  })

                  clearTimeout(timeoutId)

                  if (!response.ok) {
                    console.warn(`Failed to fetch document ${doc.name}: ${response.status}`)
                    return `\n--- ${doc.type || "Dokument"} (${doc.name || "Unbenannt"}) ---\n[Dokument ist nicht verfügbar]\n`
                  }

                  const contentType = response.headers.get("content-type") || ""

                  // Only process text-based documents (skip images, videos, etc.)
                  if (
                    contentType.includes("text") ||
                    contentType.includes("json") ||
                    contentType.includes("application")
                  ) {
                    try {
                      const text = await response.text()
                      if (text && text.length > 0) {
                        return `\n--- ${doc.type || "Dokument"} (${doc.name || "Unbenannt"}) ---\n${text.substring(0, 2000)}${text.length > 2000 ? "..." : ""}\n`
                      }
                    } catch (textError) {
                      console.warn(`Error reading text from ${doc.name}:`, textError)
                    }
                  }
                }
              } catch (error: any) {
                // Handle timeout, network errors, CORS issues, etc.
                if (error.name === "AbortError") {
                  console.warn(`Timeout fetching document ${doc.name}`)
                } else {
                  console.warn(`Error fetching document ${doc.name}:`, error.message)
                }
              }
              // Return metadata only if content fetch failed
              return `\n--- ${doc.type || "Dokument"} (${doc.name || "Unbenannt"}) ---\n[Dokumentinhalt konnte nicht geladen werden, aber Datei ist vorhanden]\n`
            }),
          )
          documentContent = documentTexts.filter(Boolean).join("\n")
        }

        const documentList =
          documents.length > 0
            ? documents.map((doc: any) => `${doc.type || "Dokument"}: ${doc.name || "Unbenannt"}`).join(", ")
            : "Keine Dokumente"

        return {
          nummer: index + 1,
          name: `${c.first_name} ${c.last_name}`,
          alter: c.date_of_birth ? calculateAge(c.date_of_birth) : "n/a",
          position: c.current_position || "n/a",
          erfahrung: c.years_of_experience ? `${c.years_of_experience} Jahre` : "n/a",
          ausbildung: c.education || "n/a",
          status: c.status,
          notizen: c.notes || "Keine",
          dokumente: documentList,
          dokumentInhalt: documentContent,
          email: c.email,
          telefon: c.phone || c.mobile || "n/a",
          verfügbarkeit: c.availability_date || "n/a",
          gehaltsvorstellung: c.salary_expectation ? `${c.salary_expectation} €` : "n/a",
          wochenStunden: c.weekly_hours || "n/a",
          skills: c.skills ? JSON.stringify(c.skills) : "n/a",
          sprachen: c.languages ? JSON.stringify(c.languages) : "n/a",
          anschreiben: c.cover_letter || "",
        }
      }),
    )

    const prompt = `Du bist ein erfahrener HR-Experte und sollst eine professionelle Analyse von Bewerbern durchführen.

${jobPostingDetails ? `STELLENAUSSCHREIBUNG:\n${jobPostingDetails}` : ""}

KANDIDATEN (${candidates.length} insgesamt):
${candidatesSummary
  .map(
    (c) => `
Kandidat ${c.nummer}: ${c.name}
- Alter: ${c.alter}
- Aktuelle Position: ${c.position}
- Berufserfahrung: ${c.erfahrung}
- Ausbildung: ${c.ausbildung}
- Status: ${c.status}
- Kontakt: ${c.email}, ${c.telefon}
- Verfügbarkeit: ${c.verfügbarkeit}
- Gehaltsvorstellung: ${c.gehaltsvorstellung}
- Wochenstunden: ${c.wochenStunden}
- Skills: ${c.skills}
- Sprachen: ${c.sprachen}
- Dokumente: ${c.dokumente}
- Notizen: ${c.notizen}

${c.anschreiben ? `ANSCHREIBEN:\n${c.anschreiben}\n` : ""}
${c.dokumentInhalt ? `HOCHGELADENE DOKUMENTE:\n${c.dokumentInhalt}` : ""}
`,
  )
  .join("\n")}

Erstelle eine PROFESSIONELLE ANALYSE im folgenden Format:

## 📊 Übersicht
[2-3 Sätze: Kurze Zusammenfassung aller Kandidaten basierend auf ihren Lebensläufen und Unterlagen]

## 🏆 Top 3 Empfehlungen

### 1. [Kandidatenname]
**Stärken:** [Liste der Hauptstärken basierend auf Lebenslauf und Dokumenten]
**Begründung:** [Warum dieser Kandidat gut passt - beziehe dich auf spezifische Details aus den Dokumenten]
**Fehlende Informationen:** [Falls zutreffend]

### 2. [Kandidatenname]
**Stärken:** [Liste der Hauptstärken basierend auf Lebenslauf und Dokumenten]
**Begründung:** [Warum dieser Kandidat gut passt - beziehe dich auf spezifische Details aus den Dokumenten]
**Fehlende Informationen:** [Falls zutreffend]

### 3. [Kandidatenname]
**Stärken:** [Liste der Hauptstärken basierend auf Lebenslauf und Dokumenten]
**Begründung:** [Warum dieser Kandidat gut passt - beziehe dich auf spezifische Details aus den Dokumenten]
**Fehlende Informationen:** [Falls zutreffend]

## 💡 Weitere Empfehlungen
[Kurze Hinweise zu den anderen Kandidaten und nächsten Schritten]

Nutze deutsche Umlaute und professionelle Sprache. Sei präzise und konkret. WICHTIG: Beziehe dich auf die tatsächlichen Inhalte der hochgeladenen Lebensläufe und Dokumente in deiner Analyse.`

    const { text } = await generateText({
      model: "openai/gpt-4o", // Upgraded from gpt-4o-mini to gpt-4o for better candidate analysis
      prompt,
      maxTokens: 3000,
    })

    return NextResponse.json({
      summary: text,
      candidateCount: candidates.length,
      analyzedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error analyzing candidates:", error)
    return NextResponse.json({ error: "Failed to analyze candidates" }, { status: 500 })
  }
}

function calculateAge(dateOfBirth: string): number {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}
