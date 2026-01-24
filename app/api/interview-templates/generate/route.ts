import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"

const DEFAULT_TEMPLATES: Record<string, string> = {
  MFA: `# INTERVIEWLEITFADEN - MFA (Medizinische Fachangestellte)

## 1. EINLEITUNG & KENNENLERNEN (5-10 Minuten)

**Begrüßung:**
- Herzlich willkommen! Schön, dass Sie heute hier sind.
- Kurze Vorstellung des Interviewers und der Praxis

**Eisbrecher:**
- Wie war Ihre Anreise?
- Haben Sie uns gut gefunden?

**Überblick:**
- Kurze Erläuterung des Gesprächsablaufs
- "Das Gespräch dauert ca. 45-60 Minuten"

---

## 2. FACHLICHE KOMPETENZ (15-20 Minuten)

**Ausbildung & Qualifikation:**
- Erzählen Sie von Ihrer Ausbildung zur MFA. Was waren die Schwerpunkte?
- Welche zusätzlichen Qualifikationen haben Sie erworben?
- In welchen Bereichen haben Sie bisher praktische Erfahrung gesammelt?

**Fachfragen:**
- Beschreiben Sie den typischen Ablauf einer Blutentnahme.
- Wie gehen Sie bei der Aufnahme eines neuen Patienten vor?
- Welche Erfahrungen haben Sie mit Praxisverwaltungssoftware?
- Wie dokumentieren Sie Patientendaten korrekt?
- Was verstehen Sie unter den Begriffen IGeL-Leistungen?

**Situative Fragen:**
- Wie würden Sie reagieren, wenn ein Patient ohne Termin dringend behandelt werden möchte?
- Was tun Sie, wenn Sie einen Fehler in der Patientenakte bemerken?

---

## 3. SOFT SKILLS & PERSÖNLICHKEIT (10-15 Minuten)

**Teamfähigkeit:**
- Beschreiben Sie Ihre Rolle in einem Team.
- Wie gehen Sie mit Meinungsverschiedenheiten im Team um?

**Kommunikation:**
- Wie erklären Sie einem ängstlichen Patienten einen bevorstehenden Eingriff?
- Wie gehen Sie mit schwierigen Patientengesprächen um?

**Stressresistenz:**
- Wie reagieren Sie, wenn mehrere dringende Aufgaben gleichzeitig anfallen?
- Erzählen Sie von einer besonders stressigen Situation und wie Sie damit umgegangen sind.

**Motivation:**
- Was motiviert Sie an der Arbeit als MFA?
- Warum möchten Sie gerade in unserer Praxis arbeiten?

---

## 4. PRAXISBEZUG (10 Minuten)

**Patientenumgang:**
- Wie schaffen Sie eine angenehme Atmosphäre für Patienten?
- Wie gehen Sie mit Beschwerden von Patienten um?

**Teamarbeit:**
- Wie stellen Sie sich die Zusammenarbeit mit Ärzten und Kollegen vor?
- Wie wichtig ist Ihnen der Austausch im Team?

**Konfliktmanagement:**
- Wie würden Sie reagieren, wenn ein Kollege wiederholt Aufgaben nicht erledigt?

---

## 5. ORGANISATORISCHES (5-10 Minuten)

- Ab wann könnten Sie bei uns beginnen?
- Wie sehen Ihre Gehaltsvorstellungen aus?
- Welche Arbeitszeiten stellen Sie sich vor? (Vollzeit/Teilzeit)
- Wie lang ist Ihre aktuelle Kündigungsfrist?

---

## 6. ABSCHLUSS (5 Minuten)

**Fragen des Bewerbers:**
- Welche Fragen haben Sie an uns?
- Gibt es etwas, das Sie gerne noch wissen möchten?

**Nächste Schritte:**
- Erklärung des weiteren Auswahlprozesses
- Zeitrahmen für die Entscheidung nennen

**Verabschiedung:**
- Vielen Dank für das Gespräch!
- Wir melden uns bis zum [Datum] bei Ihnen.`,

  Arzt: `# INTERVIEWLEITFADEN - ARZT/ÄRZTIN

## 1. EINLEITUNG & KENNENLERNEN (5-10 Minuten)

**Begrüßung und Vorstellung**
- Willkommen in unserer Praxis
- Vorstellung der Gesprächsteilnehmer
- Kurze Praxispräsentation

**Eisbrecher:**
- Wie haben Sie von unserer Stelle erfahren?
- Was hat Sie an unserer Praxis besonders angesprochen?

---

## 2. FACHLICHE KOMPETENZ (20-25 Minuten)

**Ausbildung & Werdegang:**
- Beschreiben Sie Ihren medizinischen Werdegang.
- Welche Facharztausbildung haben Sie absolviert?
- Welche Zusatzqualifikationen bringen Sie mit?

**Klinische Erfahrung:**
- In welchen Bereichen liegt Ihre klinische Expertise?
- Welche diagnostischen Verfahren beherrschen Sie?
- Wie halten Sie sich fachlich auf dem Laufenden?

**Patientenversorgung:**
- Wie gestalten Sie typischerweise eine Patientenkonsultation?
- Wie gehen Sie mit komplexen Diagnosen um?
- Wie treffen Sie Behandlungsentscheidungen?

---

## 3. SOFT SKILLS & FÜHRUNG (15 Minuten)

**Kommunikation:**
- Wie erklären Sie Patienten komplexe medizinische Sachverhalte?
- Wie gehen Sie mit schwierigen Patientengesprächen um?

**Teamführung:**
- Wie würden Sie Ihren Führungsstil beschreiben?
- Wie motivieren Sie Ihr Team?

**Stressmanagement:**
- Wie gehen Sie mit hoher Arbeitsbelastung um?
- Wie treffen Sie unter Druck Entscheidungen?

---

## 4. PRAXISORGANISATION (10 Minuten)

- Welche Erfahrungen haben Sie mit Praxismanagement?
- Wie stellen Sie sich die Zusammenarbeit mit dem Praxisteam vor?
- Welche Verbesserungsideen haben Sie für Praxisabläufe?

---

## 5. ORGANISATORISCHES (10 Minuten)

- Verfügbarkeit und Eintrittsdatum
- Gehaltsvorstellungen
- Gewünschte Arbeitszeiten und Dienstregelung
- Kündigungsfrist

---

## 6. ABSCHLUSS (5 Minuten)

- Ihre Fragen an uns
- Nächste Schritte im Auswahlprozess
- Zeitrahmen für Rückmeldung`,

  Verwaltung: `# INTERVIEWLEITFADEN - VERWALTUNG/PRAXISMANAGEMENT

## 1. EINLEITUNG (5 Minuten)

- Begrüßung und Vorstellung
- Überblick über das Gespräch
- Kurze Praxisvorstellung

---

## 2. FACHLICHE KOMPETENZ (15-20 Minuten)

**Ausbildung & Erfahrung:**
- Welche kaufmännische/administrative Ausbildung haben Sie?
- Welche Erfahrungen im Gesundheitswesen bringen Sie mit?

**Kenntnisse:**
- Erfahrung mit Praxisverwaltungssystemen?
- Kenntnisse in der Abrechnung (EBM, GOÄ)?
- MS Office Kenntnisse?

**Organisatorische Fähigkeiten:**
- Wie organisieren Sie Ihren Arbeitstag?
- Wie priorisieren Sie bei mehreren gleichzeitigen Aufgaben?

---

## 3. SOFT SKILLS (10-15 Minuten)

- Teamarbeit und Kommunikation
- Umgang mit Stress und Deadlines
- Serviceorientierung gegenüber Patienten

---

## 4. ORGANISATORISCHES (5-10 Minuten)

- Verfügbarkeit
- Gehaltsvorstellungen
- Arbeitszeit

---

## 5. ABSCHLUSS (5 Minuten)

- Fragen des Bewerbers
- Nächste Schritte`,

  default: `# ALLGEMEINER INTERVIEWLEITFADEN

## 1. EINLEITUNG & KENNENLERNEN (5-10 Minuten)

**Begrüßung:**
- Herzlich willkommen! 
- Vorstellung der Gesprächsteilnehmer
- Überblick über den Gesprächsablauf

---

## 2. FACHLICHE KOMPETENZ (15-20 Minuten)

**Beruflicher Werdegang:**
- Erzählen Sie von Ihrem bisherigen Werdegang.
- Was waren Ihre wichtigsten beruflichen Stationen?
- Welche Qualifikationen bringen Sie mit?

**Fachfragen:**
- Welche Erfahrungen haben Sie in diesem Bereich?
- Was sind Ihre fachlichen Stärken?
- Wo sehen Sie noch Entwicklungspotenzial?

---

## 3. SOFT SKILLS & PERSÖNLICHKEIT (10-15 Minuten)

**Teamfähigkeit:**
- Wie arbeiten Sie am liebsten - im Team oder eigenständig?
- Beschreiben Sie Ihre Rolle in einem Team.

**Kommunikation:**
- Wie gehen Sie mit schwierigen Gesprächen um?
- Wie stellen Sie sicher, dass Sie richtig verstanden werden?

**Motivation:**
- Was motiviert Sie bei der Arbeit?
- Warum haben Sie sich bei uns beworben?

---

## 4. ORGANISATORISCHES (5-10 Minuten)

- Ab wann könnten Sie bei uns beginnen?
- Wie sehen Ihre Gehaltsvorstellungen aus?
- Welche Arbeitszeiten bevorzugen Sie?
- Wie lang ist Ihre aktuelle Kündigungsfrist?

---

## 5. ABSCHLUSS (5 Minuten)

- Welche Fragen haben Sie an uns?
- Erklärung der nächsten Schritte
- Zeitrahmen für die Entscheidung
- Verabschiedung`,
}

export async function POST(request: NextRequest) {
  try {
    const { category, position, candidateData } = await request.json()

    let candidateContext = ""
    if (candidateData) {
      candidateContext = `

KANDIDATEN-KONTEXT:
${candidateData.name ? `- Name: ${candidateData.name}` : ""}
${candidateData.position_type ? `- Angestrebte Position: ${candidateData.position_type}` : ""}
${candidateData.current_position ? `- Aktuelle Position: ${candidateData.current_position}` : ""}
${candidateData.salary_expectation ? `- Gehaltsvorstellung: ${candidateData.salary_expectation.toLocaleString("de-DE")} €/Monat` : ""}
${candidateData.weekly_hours ? `- Gewünschte Wochenstunden: ${candidateData.weekly_hours}` : ""}
${candidateData.experience_years ? `- Berufserfahrung: ${candidateData.experience_years} Jahre` : ""}
${candidateData.education ? `- Ausbildung/Qualifikation: ${candidateData.education}` : ""}
${candidateData.skills && candidateData.skills.length > 0 ? `- Fähigkeiten: ${candidateData.skills.join(", ")}` : ""}

Berücksichtige diese Informationen bei der Erstellung der Interviewfragen und passe sie an das Profil des Kandidaten an.`
    }

    const prompt = `Du bist ein professioneller HR-Experte im medizinischen Bereich. Erstelle einen strukturierten Interviewleitfaden für ein Bewerbungsgespräch.

Position: ${position}
Kategorie: ${category}${candidateContext}

Erstelle einen umfassenden Gesprächsleitfaden mit folgenden Abschnitten:

1. EINLEITUNG & KENNENLERNEN
   - Begrüßung und Vorstellung
   - Eisbrecher-Fragen
   - Überblick über das Gespräch

2. FACHLICHE KOMPETENZ
   - 5-7 spezifische Fachfragen zur Position
   - Fragen zu Qualifikationen und Erfahrungen
   - Situative Fragen (Wie würden Sie...?)
   ${candidateData?.education ? `- Fragen zur genannten Ausbildung/Qualifikation` : ""}
   ${candidateData?.experience_years ? `- Fragen zur bisherigen Berufserfahrung` : ""}

3. SOFT SKILLS & PERSÖNLICHKEIT
   - Teamfähigkeit
   - Kommunikationsfähigkeit
   - Stressresistenz
   - Motivation und Werte

4. PRAXISBEZUG
   - Umgang mit Patienten
   - Arbeit im Team
   - Umgang mit Konfliktsituationen

5. ORGANISATORISCHES
   - Verfügbarkeit
   ${!candidateData?.salary_expectation ? "- Gehaltsvorstellungen" : "- Gehaltsverhandlung (Kandidat wünscht " + candidateData.salary_expectation.toLocaleString("de-DE") + " €)"}
   ${!candidateData?.weekly_hours ? "- Gewünschte Arbeitszeit" : "- Arbeitszeit-Abstimmung (Kandidat wünscht " + candidateData.weekly_hours + " Std./Woche)"}
   - Kündigungsfrist

6. ABSCHLUSS
   - Fragen des Bewerbers
   - Nächste Schritte
   - Verabschiedung

Erstelle den Leitfaden klar strukturiert, professionell und praxisnah. Verwende konkrete Beispielfragen.${candidateData ? " Passe die Fragen gezielt an die bereitgestellten Kandidateninformationen an." : ""}`

    let suggestions: string

    try {
      const { text } = await generateText({
        model: "anthropic/claude-sonnet-4-20250514",
        prompt,
        temperature: 0.7,
        maxOutputTokens: 2000,
      })

      suggestions = text
    } catch (aiError) {
      console.error("[v0] AI generation failed, using fallback:", aiError)

      const categoryKey = category?.toLowerCase() || "default"
      if (categoryKey.includes("mfa") || categoryKey.includes("medizinische")) {
        suggestions = DEFAULT_TEMPLATES.MFA
      } else if (categoryKey.includes("arzt") || categoryKey.includes("ärztin") || categoryKey.includes("doctor")) {
        suggestions = DEFAULT_TEMPLATES.Arzt
      } else if (
        categoryKey.includes("verwaltung") ||
        categoryKey.includes("admin") ||
        categoryKey.includes("management")
      ) {
        suggestions = DEFAULT_TEMPLATES.Verwaltung
      } else {
        suggestions = DEFAULT_TEMPLATES[categoryKey] || DEFAULT_TEMPLATES.default
      }

      suggestions = suggestions.replace(/# INTERVIEWLEITFADEN/g, `# INTERVIEWLEITFADEN - ${position || category}`)
    }

    return NextResponse.json(
      { suggestions },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  } catch (error) {
    console.error("[v0] Interview template generation error:", error)

    return NextResponse.json(
      {
        suggestions: DEFAULT_TEMPLATES.default,
        error: "AI-Generierung fehlgeschlagen, Standard-Vorlage wird verwendet",
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}
