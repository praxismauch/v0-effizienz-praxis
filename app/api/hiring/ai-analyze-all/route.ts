import { NextResponse } from "next/server"
import { generateText } from "ai"

export async function POST(request: Request) {
  try {
    const { practiceId } = await request.json()

    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID is required" }, { status: 400 })
    }

    // Fetch all recruiting data
    const [
      jobPostingsRes,
      candidatesRes,
      applicationsRes,
      interviewsRes,
      pipelineStagesRes,
      questionnairesRes,
      recruitingFieldsRes,
    ] = await Promise.all([
      fetch(
        `${request.url.replace("/api/hiring/ai-analyze-all", "")}/api/hiring/job-postings?practiceId=${practiceId}`,
        {
          headers: request.headers,
        },
      ),
      fetch(`${request.url.replace("/api/hiring/ai-analyze-all", "")}/api/hiring/candidates?practiceId=${practiceId}`, {
        headers: request.headers,
      }),
      fetch(
        `${request.url.replace("/api/hiring/ai-analyze-all", "")}/api/hiring/applications?practiceId=${practiceId}`,
        {
          headers: request.headers,
        },
      ),
      fetch(`${request.url.replace("/api/hiring/ai-analyze-all", "")}/api/hiring/interviews?practiceId=${practiceId}`, {
        headers: request.headers,
      }),
      fetch(
        `${request.url.replace("/api/hiring/ai-analyze-all", "")}/api/hiring/pipeline-stages?practiceId=${practiceId}`,
        {
          headers: request.headers,
        },
      ),
      fetch(
        `${request.url.replace("/api/hiring/ai-analyze-all", "")}/api/hiring/questionnaires?practiceId=${practiceId}`,
        {
          headers: request.headers,
        },
      ),
      fetch(
        `${request.url.replace("/api/hiring/ai-analyze-all", "")}/api/hiring/recruiting-fields?practiceId=${practiceId}`,
        {
          headers: request.headers,
        },
      ),
    ])

    const jobPostings = jobPostingsRes.ok ? await jobPostingsRes.json() : []
    const candidates = candidatesRes.ok ? await candidatesRes.json() : []
    const applications = applicationsRes.ok ? await applicationsRes.json() : []
    const interviews = interviewsRes.ok ? await interviewsRes.json() : []
    const pipelineStages = pipelineStagesRes.ok ? await pipelineStagesRes.json() : []
    const questionnaires = questionnairesRes.ok ? await questionnairesRes.json() : []
    const recruitingFields = recruitingFieldsRes.ok ? await recruitingFieldsRes.json() : []

    const prompt = `Analysiere die gesamten Recruiting-Daten einer medizinischen Praxis und erstelle einen umfassenden Bericht auf Deutsch.

STELLENAUSSCHREIBUNGEN (${jobPostings.length} gesamt):
${JSON.stringify(jobPostings, null, 2)}

KANDIDATEN (${candidates.length} gesamt):
${JSON.stringify(candidates, null, 2)}

BEWERBUNGEN (${applications.length} gesamt):
${JSON.stringify(applications, null, 2)}

INTERVIEWS (${interviews.length} gesamt):
${JSON.stringify(interviews, null, 2)}

PIPELINE-PHASEN (${pipelineStages.length} gesamt):
${JSON.stringify(pipelineStages, null, 2)}

FRAGEBÖGEN (${questionnaires.length} gesamt):
${JSON.stringify(questionnaires, null, 2)}

RECRUITING-FELDER UND EINSTELLUNGEN:
${JSON.stringify(recruitingFields, null, 2)}

Erstelle eine detaillierte Analyse mit folgenden Abschnitten:

1. ÜBERBLICK
   - Zusammenfassung der aktuellen Recruiting-Situation
   - Wichtigste Kennzahlen (Conversion Rates, Durchlaufzeiten, etc.)
   - Allgemeiner Gesundheitsstatus des Recruiting-Prozesses

2. STELLENAUSSCHREIBUNGEN
   - Aktive vs. geschlossene Stellen
   - Stellentypen (MFA, Arzt, Sonstiges) und deren Verteilung
   - Durchschnittliche Zeit bis zur Besetzung
   - Attraktivität der Stellenbeschreibungen
   - Empfohlene Optimierungen

3. KANDIDATENQUALITÄT
   - Qualifikationsniveau der Bewerber
   - Passung zur Praxis (Skills, Erfahrung, etc.)
   - Diversität im Kandidatenpool
   - Top-Kandidaten, die besondere Aufmerksamkeit verdienen

4. PIPELINE-ANALYSE
   - Konversionsraten zwischen den Phasen
   - Engpässe im Prozess
   - Durchschnittliche Verweildauer pro Phase
   - Abbruchquoten und mögliche Gründe
   - Effektivität der einzelnen Pipeline-Phasen

5. INTERVIEW-PERFORMANCE
   - Interview-Durchführungsrate
   - Zeitliche Planung und Effizienz
   - Feedback-Qualität
   - Verbesserungsvorschläge

6. FRAGEBOGEN-NUTZUNG
   - Anzahl und Qualität der eingesetzten Fragebögen
   - Rücklaufquoten
   - Aussagekraft der gesammelten Daten
   - Empfehlungen für Optimierungen

7. HANDLUNGSEMPFEHLUNGEN
   - Top 5 Prioritäten für die nächsten 30 Tage
   - Quick Wins für sofortige Verbesserungen
   - Langfristige strategische Empfehlungen
   - Ressourcenbedarf und -optimierung

Formatiere die Antwort als strukturiertes Markdown mit Überschriften, Aufzählungen und wichtigen Kennzahlen hervorgehoben.`

    const { text: analysis } = await generateText({
      model: "openai/gpt-4o",
      prompt,
      maxTokens: 4000,
    })

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error("[v0] Error analyzing recruiting data:", error)
    return NextResponse.json({ error: "Failed to analyze recruiting data" }, { status: 500 })
  }
}
