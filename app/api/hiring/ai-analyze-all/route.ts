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

    // DSGVO: Anonymize all personal data before sending to AI
    const anonymizedCandidates = (Array.isArray(candidates) ? candidates : []).map((c: any, i: number) => ({
      kennung: `Kandidat-${(i + 1).toString().padStart(2, "0")}`,
      position: c.current_position || "n/a",
      erfahrung: c.years_of_experience ? `${c.years_of_experience} Jahre` : "n/a",
      ausbildung: c.education || "n/a",
      status: c.status,
      skills: c.skills || [],
      sprachen: c.languages || [],
    }))
    
    const anonymizedApplications = (Array.isArray(applications) ? applications : []).map((a: any, i: number) => ({
      kennung: `Bewerbung-${(i + 1).toString().padStart(2, "0")}`,
      status: a.status,
      created_at: a.created_at,
      job_posting_title: a.job_posting?.title || "n/a",
    }))

    const anonymizedInterviews = (Array.isArray(interviews) ? interviews : []).map((iv: any, i: number) => ({
      kennung: `Interview-${(i + 1).toString().padStart(2, "0")}`,
      status: iv.status,
      scheduled_at: iv.scheduled_at,
      type: iv.type || "n/a",
    }))

    const prompt = `Analysiere die gesamten Recruiting-Daten einer medizinischen Praxis und erstelle einen umfassenden Bericht auf Deutsch.
WICHTIG: Alle Personendaten sind aus DSGVO-Gründen anonymisiert. Verwende nur die Kennungen.

STELLENAUSSCHREIBUNGEN (${jobPostings.length} gesamt):
${JSON.stringify(jobPostings, null, 2)}

KANDIDATEN (${anonymizedCandidates.length} gesamt, anonymisiert):
${JSON.stringify(anonymizedCandidates, null, 2)}

BEWERBUNGEN (${anonymizedApplications.length} gesamt, anonymisiert):
${JSON.stringify(anonymizedApplications, null, 2)}

INTERVIEWS (${anonymizedInterviews.length} gesamt, anonymisiert):
${JSON.stringify(anonymizedInterviews, null, 2)}

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
      model: "anthropic/claude-sonnet-4-20250514",
      prompt,
      maxOutputTokens: 4000,
    })

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error("[v0] Error analyzing recruiting data:", error)
    return NextResponse.json({ error: "Failed to analyze recruiting data" }, { status: 500 })
  }
}
