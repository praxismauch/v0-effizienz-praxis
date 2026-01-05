import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { practiceId, avgWaitTime, patientsPerDay, appointmentDuration, staffCount, peakHours } = body

    if (!avgWaitTime || !patientsPerDay) {
      return NextResponse.json({ error: "Fehlende Eingabedaten" }, { status: 400 })
    }

    const currentWait = Number.parseInt(avgWaitTime)
    const patients = Number.parseInt(patientsPerDay)
    const duration = Number.parseInt(appointmentDuration) || 15
    const staff = Number.parseInt(staffCount) || 3

    // Generate AI analysis
    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      system: `Du bist ein Experte für Praxismanagement und Prozessoptimierung in Arztpraxen. 
Analysiere die gegebenen Wartezeit-Daten und generiere konkrete, umsetzbare Optimierungsvorschläge.
Antworte IMMER in validem JSON-Format ohne Markdown-Formatierung.`,
      prompt: `Analysiere folgende Wartezeit-Situation einer Arztpraxis:

- Durchschnittliche Wartezeit: ${currentWait} Minuten
- Patienten pro Tag: ${patients}
- Durchschnittliche Termindauer: ${duration} Minuten
- Anzahl MFA/Ärzte: ${staff}
- Bekannte Stoßzeiten: ${peakHours || "Nicht angegeben"}

Generiere eine detaillierte Analyse im folgenden JSON-Format:
{
  "currentAvgWait": ${currentWait},
  "targetAvgWait": <realistisches Ziel in Minuten>,
  "peakHours": ["<Stoßzeit 1>", "<Stoßzeit 2>"],
  "bottlenecks": [
    {
      "area": "<Bereich>",
      "impact": "high|medium|low",
      "description": "<Beschreibung des Problems>",
      "suggestion": "<Konkrete Lösungsempfehlung>"
    }
  ],
  "optimizations": [
    {
      "title": "<Maßnahme>",
      "description": "<Detaillierte Beschreibung>",
      "expectedImprovement": "<z.B. -5 Min. Wartezeit>",
      "effort": "low|medium|high",
      "priority": 1
    }
  ],
  "weeklyPattern": [
    {"dayOfWeek": "Montag", "hour": 8, "avgWaitMinutes": 20, "patientCount": 15, "peakTime": true}
  ],
  "estimatedSavings": {
    "timePerDay": <eingesparte Minuten pro Tag>,
    "patientsPerWeek": <zusätzliche Patienten durch Effizienz>,
    "satisfactionIncrease": <prozentuale Steigerung der Zufriedenheit>
  }
}

Berücksichtige typische Engpässe wie:
- Anmeldung/Check-in Prozess
- Dokumentation und Vorbereitung
- Behandlungszimmer-Wechsel
- Laboruntersuchungen
- Terminplanung und No-Shows
- Kommunikation zwischen MFA und Arzt

Gib 3-5 Engpässe und 5-7 Optimierungsvorschläge an, priorisiert nach Aufwand-Nutzen-Verhältnis.
Generiere realistische Wochenmuster basierend auf typischen Praxisabläufen.`,
    })

    // Parse AI response
    let analysis
    try {
      // Remove potential markdown code blocks
      const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim()
      analysis = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error("Failed to parse AI response:", text)
      // Return fallback analysis
      analysis = generateFallbackAnalysis(currentWait, patients, duration, staff, peakHours)
    }

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error("Wait time analysis error:", error)
    return NextResponse.json({ error: "Analyse fehlgeschlagen" }, { status: 500 })
  }
}

function generateFallbackAnalysis(
  currentWait: number,
  patients: number,
  duration: number,
  staff: number,
  peakHours?: string,
) {
  const targetWait = Math.max(10, Math.round(currentWait * 0.6))
  const improvement = currentWait - targetWait

  return {
    currentAvgWait: currentWait,
    targetAvgWait: targetWait,
    peakHours: peakHours ? peakHours.split(",").map((h) => h.trim()) : ["8:00-10:00 Uhr", "16:00-18:00 Uhr"],
    bottlenecks: [
      {
        area: "Anmeldung & Check-in",
        impact: "high" as const,
        description: "Patienten warten oft an der Anmeldung, besonders zu Stoßzeiten.",
        suggestion: "Digitaler Check-in per App oder Tablet im Wartezimmer einführen.",
      },
      {
        area: "Terminplanung",
        impact: "high" as const,
        description: "Ungleichmäßige Terminverteilung führt zu Überlastung zu bestimmten Zeiten.",
        suggestion: "Pufferzeiten zwischen Terminen einplanen und Stoßzeiten entzerren.",
      },
      {
        area: "Dokumentation",
        impact: "medium" as const,
        description: "Ärzte dokumentieren oft zwischen Patienten, was zu Verzögerungen führt.",
        suggestion: "Spracherkennung für Dokumentation oder Diktat-Service nutzen.",
      },
      {
        area: "Behandlungszimmer-Auslastung",
        impact: "medium" as const,
        description: "Zimmer werden nicht optimal genutzt, Wechselzeiten zu lang.",
        suggestion: "MFA bereitet nächsten Patienten parallel vor, Zimmer-Rotationssystem.",
      },
    ],
    optimizations: [
      {
        title: "Online-Terminbuchung mit Wartezeit-Prognose",
        description:
          "Patienten können online buchen und sehen die voraussichtliche Wartezeit. Das System verteilt Termine automatisch optimal.",
        expectedImprovement: `-${Math.round(improvement * 0.3)} Min. Wartezeit`,
        effort: "medium" as const,
        priority: 1,
      },
      {
        title: "Digitale Anamnese vor dem Termin",
        description:
          "Patienten füllen Anamnese-Bögen vorab digital aus. Spart Zeit bei der Anmeldung und Vorbereitung.",
        expectedImprovement: `-${Math.round(improvement * 0.25)} Min. Wartezeit`,
        effort: "low" as const,
        priority: 2,
      },
      {
        title: "SMS/WhatsApp Benachrichtigung",
        description:
          "Patienten werden benachrichtigt, wenn sie an der Reihe sind. Sie können später ankommen und draußen warten.",
        expectedImprovement: "Gefühlte Wartezeit -50%",
        effort: "low" as const,
        priority: 3,
      },
      {
        title: "Parallele Behandlungsvorbereitung",
        description:
          "MFA bereitet im nächsten Zimmer bereits den folgenden Patienten vor, während der Arzt noch behandelt.",
        expectedImprovement: `-${Math.round(improvement * 0.2)} Min. Wartezeit`,
        effort: "low" as const,
        priority: 4,
      },
      {
        title: "No-Show Management",
        description:
          "Automatische Terminerinnerungen 24h und 2h vor Termin. Absagen automatisch mit Warteliste nachbesetzen.",
        expectedImprovement: `+${Math.round(patients * 0.05)} Patienten/Tag`,
        effort: "medium" as const,
        priority: 5,
      },
      {
        title: "Stoßzeiten-Entzerrung",
        description:
          "Anreize für Termine außerhalb der Stoßzeiten (z.B. kürzere Wartezeit-Garantie für frühe/späte Termine).",
        expectedImprovement: "-30% Spitzenbelastung",
        effort: "low" as const,
        priority: 6,
      },
    ],
    weeklyPattern: [
      {
        dayOfWeek: "Montag",
        hour: 8,
        avgWaitMinutes: Math.round(currentWait * 1.3),
        patientCount: Math.round(patients * 0.25),
        peakTime: true,
      },
      {
        dayOfWeek: "Montag",
        hour: 11,
        avgWaitMinutes: Math.round(currentWait * 0.8),
        patientCount: Math.round(patients * 0.15),
        peakTime: false,
      },
      {
        dayOfWeek: "Montag",
        hour: 16,
        avgWaitMinutes: Math.round(currentWait * 1.2),
        patientCount: Math.round(patients * 0.2),
        peakTime: true,
      },
      {
        dayOfWeek: "Dienstag",
        hour: 9,
        avgWaitMinutes: Math.round(currentWait * 1.1),
        patientCount: Math.round(patients * 0.22),
        peakTime: true,
      },
      {
        dayOfWeek: "Dienstag",
        hour: 14,
        avgWaitMinutes: Math.round(currentWait * 0.7),
        patientCount: Math.round(patients * 0.12),
        peakTime: false,
      },
      {
        dayOfWeek: "Mittwoch",
        hour: 8,
        avgWaitMinutes: Math.round(currentWait * 1.0),
        patientCount: Math.round(patients * 0.18),
        peakTime: false,
      },
      {
        dayOfWeek: "Mittwoch",
        hour: 12,
        avgWaitMinutes: Math.round(currentWait * 0.6),
        patientCount: Math.round(patients * 0.1),
        peakTime: false,
      },
      {
        dayOfWeek: "Donnerstag",
        hour: 8,
        avgWaitMinutes: Math.round(currentWait * 1.25),
        patientCount: Math.round(patients * 0.24),
        peakTime: true,
      },
      {
        dayOfWeek: "Donnerstag",
        hour: 17,
        avgWaitMinutes: Math.round(currentWait * 1.15),
        patientCount: Math.round(patients * 0.18),
        peakTime: true,
      },
      {
        dayOfWeek: "Freitag",
        hour: 8,
        avgWaitMinutes: Math.round(currentWait * 1.4),
        patientCount: Math.round(patients * 0.28),
        peakTime: true,
      },
      {
        dayOfWeek: "Freitag",
        hour: 12,
        avgWaitMinutes: Math.round(currentWait * 0.9),
        patientCount: Math.round(patients * 0.15),
        peakTime: false,
      },
    ],
    estimatedSavings: {
      timePerDay: Math.round(improvement * patients * 0.3),
      patientsPerWeek: Math.round(patients * 0.1),
      satisfactionIncrease: Math.round(((currentWait - targetWait) / currentWait) * 100 * 0.8),
    },
  }
}
