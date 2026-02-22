import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@/lib/supabase/service-role"

const STRATEGY_STEPS = [
  {
    key: "vision_values",
    number: 1,
    name: "Vision & Werte",
    description: "Definieren Sie die Vision und Kernwerte Ihrer Praxis",
    detailedDescription:
      "Die Vision ist der Leitstern Ihrer Praxis – sie beschreibt, wohin Sie langfristig streben und welchen Unterschied Sie für Ihre Patienten machen wollen. Ihre Kernwerte bilden das Fundament für alle Entscheidungen und prägen die Kultur Ihres Teams.",
    keyQuestions: [
      "Welchen einzigartigen Beitrag leistet Ihre Praxis für die Gesundheit Ihrer Patienten?",
      "Wie soll Ihre Praxis in 5-10 Jahren wahrgenommen werden?",
      "Welche 3-5 Werte sind für Sie und Ihr Team nicht verhandelbar?",
      "Was unterscheidet Ihre Praxis von anderen in der Region?",
    ],
    actionItems: [
      "Führen Sie einen Workshop mit Ihrem Team durch, um gemeinsam Werte zu erarbeiten",
      "Formulieren Sie eine klare, inspirierende Vision in 1-2 Sätzen",
      "Erstellen Sie ein Werte-Manifest, das im Alltag gelebt werden kann",
      "Kommunizieren Sie Vision und Werte sichtbar – für Team und Patienten",
    ],
    tips: [
      "Eine gute Vision ist konkret genug, um zu inspirieren, aber flexibel genug für Veränderungen",
      "Involvieren Sie Ihr gesamtes Team – geteilte Werte werden auch gelebt",
      "Überprüfen Sie regelmäßig, ob Ihre Entscheidungen zu Ihren Werten passen",
    ],
    estimatedDuration: "2-4 Wochen",
    difficulty: "Mittel",
  },
  {
    key: "target_patient",
    number: 2,
    name: "Wunschpatient / Zielgruppe",
    description: "Identifizieren Sie Ihre idealen Patienten",
    detailedDescription:
      "Nicht jeder Patient passt optimal zu Ihrer Praxis – und das ist in Ordnung. Indem Sie Ihren Wunschpatienten klar definieren, können Sie Ihre Leistungen, Kommunikation und Prozesse gezielt ausrichten und so bessere Ergebnisse für alle erzielen.",
    keyQuestions: [
      "Welche Patienten behandeln Sie am liebsten und mit dem besten Erfolg?",
      "Welche demografischen Merkmale haben Ihre idealen Patienten?",
      "Welche Bedürfnisse und Erwartungen haben diese Patienten?",
      "Wo und wie erreichen Sie diese Zielgruppe am besten?",
    ],
    actionItems: [
      "Erstellen Sie 2-3 detaillierte Patienten-Personas mit Namen und Geschichte",
      "Analysieren Sie Ihre bestehende Patientenkartei nach Mustern",
      "Definieren Sie, welche Patienten Sie bewusst NICHT ansprechen möchten",
      "Passen Sie Ihre Marketingbotschaften an Ihre Zielgruppe an",
    ],
    tips: [
      "Seien Sie mutig bei der Fokussierung – Sie können nicht für jeden der Beste sein",
      "Befragen Sie Ihre besten Patienten, warum sie zu Ihnen kommen",
      "Die Zielgruppe darf sich mit der Zeit weiterentwickeln",
    ],
    estimatedDuration: "1-2 Wochen",
    difficulty: "Leicht",
  },
  {
    key: "services",
    number: 3,
    name: "Angebot / Leistungen",
    description: "Gestalten Sie Ihr Leistungsportfolio",
    detailedDescription:
      "Ihr Leistungsportfolio ist Ihr Versprechen an Ihre Patienten. Es sollte Ihre Stärken widerspiegeln, zu Ihrer Zielgruppe passen und wirtschaftlich tragfähig sein. Qualität vor Quantität – konzentrieren Sie sich auf das, was Sie wirklich gut können.",
    keyQuestions: [
      "Welche Leistungen sind Ihre Kernkompetenz?",
      "Welche Leistungen sind besonders profitabel und nachgefragt?",
      "Gibt es Leistungen, die Sie aufgeben oder ausbauen sollten?",
      "Welche neuen Behandlungsmethoden könnten Ihr Portfolio ergänzen?",
    ],
    actionItems: [
      "Erstellen Sie eine Matrix aller Leistungen nach Profitabilität und Nachfrage",
      "Definieren Sie 3-5 Fokus-Leistungen, die Sie besonders bewerben",
      "Entwickeln Sie Behandlungspakete oder -programme für häufige Anliegen",
      "Schulen Sie Ihr Team kontinuierlich in Ihren Kernleistungen",
    ],
    tips: [
      "Weniger ist oft mehr – Spezialisierung schafft Vertrauen",
      "Betrachten Sie die Patient Journey von A bis Z",
      "Kombinieren Sie klassische mit innovativen Leistungen",
    ],
    estimatedDuration: "2-3 Wochen",
    difficulty: "Mittel",
  },
  {
    key: "business_model",
    number: 4,
    name: "Geschäftsmodell & Wirtschaftlichkeit",
    description: "Optimieren Sie Ihre Wirtschaftlichkeit",
    detailedDescription:
      "Eine erfolgreiche Praxis braucht ein solides wirtschaftliches Fundament. Verstehen Sie Ihre Kostenstruktur, optimieren Sie Ihre Einnahmequellen und schaffen Sie finanzielle Stabilität, die Ihnen ermöglicht, in Qualität und Ihr Team zu investieren.",
    keyQuestions: [
      "Wie verteilen sich Ihre Einnahmen auf verschiedene Leistungsbereiche?",
      "Welche fixen und variablen Kosten haben Sie?",
      "Wie hoch ist Ihre Rentabilität pro Behandlungsart?",
      "Welche Wachstumspotenziale sehen Sie?",
    ],
    actionItems: [
      "Erstellen Sie eine detaillierte Kosten- und Ertragsanalyse",
      "Berechnen Sie den Break-Even für verschiedene Leistungen",
      "Entwickeln Sie eine Preisstrategie für IGeL-Leistungen",
      "Planen Sie Investitionen und deren Amortisation",
    ],
    tips: [
      "Regelmäßiges Controlling ist kein Luxus, sondern Notwendigkeit",
      "Trennen Sie private und betriebliche Finanzen konsequent",
      "Holen Sie sich professionelle Beratung für Steuern und Recht",
    ],
    estimatedDuration: "3-4 Wochen",
    difficulty: "Schwer",
  },
  {
    key: "processes",
    number: 5,
    name: "Prozesse & Organisation",
    description: "Verbessern Sie Ihre internen Abläufe",
    detailedDescription:
      "Effiziente Prozesse sparen Zeit, reduzieren Fehler und verbessern das Erlebnis für Patienten und Team. Dokumentieren Sie Ihre Abläufe, identifizieren Sie Engpässe und schaffen Sie Standards, die Qualität sichern.",
    keyQuestions: [
      "Welche Prozesse verursachen regelmäßig Probleme oder Verzögerungen?",
      "Wo entstehen Wartezeiten für Patienten oder Leerlauf für Mitarbeiter?",
      "Welche Aufgaben können delegiert oder automatisiert werden?",
      "Wie gut sind Ihre Prozesse dokumentiert und trainiert?",
    ],
    actionItems: [
      "Dokumentieren Sie alle Kernprozesse in einem Praxishandbuch",
      "Führen Sie eine Prozessanalyse mit Zeitmessung durch",
      "Implementieren Sie Checklisten für wiederkehrende Aufgaben",
      "Definieren Sie klare Verantwortlichkeiten und Vertretungsregelungen",
    ],
    tips: [
      "Beziehen Sie Ihr Team in die Prozessoptimierung ein – sie kennen die Details",
      "Kleine Verbesserungen täglich sind besser als große Umbrüche selten",
      "Nutzen Sie digitale Tools für Standardaufgaben",
    ],
    estimatedDuration: "4-6 Wochen",
    difficulty: "Mittel",
  },
  {
    key: "hr_strategy",
    number: 6,
    name: "Personalstrategie",
    description: "Entwickeln Sie Ihre Personalstrategie",
    detailedDescription:
      "Ihr Team ist Ihr wertvollstes Kapital. Eine durchdachte Personalstrategie umfasst Recruiting, Onboarding, Entwicklung, Bindung und Führung. Investieren Sie in Ihre Mitarbeiter – sie sind der Schlüssel zum Erfolg.",
    keyQuestions: [
      "Welche Kompetenzen brauchen Sie heute und in Zukunft?",
      "Wie attraktiv sind Sie als Arbeitgeber im Vergleich zu anderen?",
      "Wie fördern Sie die Entwicklung und Zufriedenheit Ihres Teams?",
      "Wie ist Ihre Nachfolgeplanung für Schlüsselpositionen?",
    ],
    actionItems: [
      "Erstellen Sie einen Personalentwicklungsplan für jeden Mitarbeiter",
      "Implementieren Sie regelmäßige Feedbackgespräche und Zielvereinbarungen",
      "Entwickeln Sie ein attraktives Arbeitgeberversprechen (Employer Branding)",
      "Schaffen Sie Karrierepfade und Aufstiegsmöglichkeiten",
    ],
    tips: [
      "Gute Mitarbeiter verlassen keine Unternehmen, sondern schlechte Führungskräfte",
      "Investitionen in Weiterbildung zahlen sich mehrfach aus",
      "Feiern Sie Erfolge und leben Sie eine Kultur der Wertschätzung",
    ],
    estimatedDuration: "Fortlaufend",
    difficulty: "Schwer",
  },
  {
    key: "communication",
    number: 7,
    name: "Kommunikation / Marke / Patientenerlebnis",
    description: "Stärken Sie Ihre Marke und Patientenkommunikation",
    detailedDescription:
      "Ihre Marke ist mehr als ein Logo – sie ist das Gefühl, das Patienten mit Ihrer Praxis verbinden. Gestalten Sie jeden Kontaktpunkt bewusst, kommunizieren Sie klar und schaffen Sie ein unvergessliches Patientenerlebnis.",
    keyQuestions: [
      "Wie nehmen Patienten Ihre Praxis beim ersten Kontakt wahr?",
      "Welche Emotionen soll Ihre Marke auslösen?",
      "Wie konsistent ist Ihre Kommunikation über alle Kanäle?",
      "Was erzählen Patienten anderen über Ihre Praxis?",
    ],
    actionItems: [
      "Entwickeln Sie eine visuelle Identität (Logo, Farben, Schriften)",
      "Optimieren Sie die Patient Journey von der Terminbuchung bis zur Nachsorge",
      "Implementieren Sie ein Bewertungsmanagement für Google & Co.",
      "Schulen Sie Ihr Team in empathischer Kommunikation",
    ],
    tips: [
      "Jeder Mitarbeiter ist ein Markenbotschafter",
      "Kleine Details machen den Unterschied – vom Wartezimmer bis zur Verabschiedung",
      "Authentizität schlägt Perfektion",
    ],
    estimatedDuration: "3-4 Wochen",
    difficulty: "Mittel",
  },
  {
    key: "quality",
    number: 8,
    name: "Qualität & Standards",
    description: "Etablieren Sie Qualitätsstandards",
    detailedDescription:
      "Qualität ist kein Zufall, sondern das Ergebnis systematischer Arbeit. Definieren Sie klare Standards, messen Sie Ihre Leistung kontinuierlich und schaffen Sie eine Kultur der ständigen Verbesserung.",
    keyQuestions: [
      "Welche Qualitätskriterien sind für Ihre Patienten am wichtigsten?",
      "Wie messen und dokumentieren Sie Behandlungsergebnisse?",
      "Wie gehen Sie mit Beschwerden und Fehlern um?",
      "Welche Zertifizierungen oder Akkreditierungen streben Sie an?",
    ],
    actionItems: [
      "Definieren Sie messbare Qualitätsstandards für alle Leistungen",
      "Implementieren Sie ein systematisches Beschwerdemanagement",
      "Führen Sie regelmäßige interne Audits durch",
      "Etablieren Sie eine Fehlerkultur mit Lerneffekt",
    ],
    tips: [
      "Qualität beginnt bei der Einstellung – stellen Sie die Richtigen ein",
      "Beschwerden sind Geschenke – sie zeigen Verbesserungspotenzial",
      "Feiern Sie Qualitätserfolge mit dem ganzen Team",
    ],
    estimatedDuration: "4-8 Wochen",
    difficulty: "Mittel",
  },
  {
    key: "digitalization",
    number: 9,
    name: "Digitalisierung",
    description: "Digitalisieren Sie Ihre Praxis",
    detailedDescription:
      "Digitalisierung ist kein Selbstzweck, sondern ein Werkzeug für bessere Patientenversorgung und effizientere Abläufe. Wählen Sie die richtigen Tools, schulen Sie Ihr Team und nutzen Sie Daten für bessere Entscheidungen.",
    keyQuestions: [
      "Welche Prozesse könnten durch Digitalisierung verbessert werden?",
      "Wie digital-affin sind Ihre Patienten und Ihr Team?",
      "Welche Software-Systeme nutzen Sie und wie gut sind diese integriert?",
      "Wie sicher sind Ihre Patientendaten?",
    ],
    actionItems: [
      "Führen Sie eine Digitalisierungs-Bestandsaufnahme durch",
      "Priorisieren Sie Digitalisierungsprojekte nach Aufwand und Nutzen",
      "Implementieren Sie Online-Terminbuchung und digitale Kommunikation",
      "Schulen Sie Ihr Team kontinuierlich in digitalen Tools",
    ],
    tips: [
      "Starten Sie klein und skalieren Sie erfolgreiche Lösungen",
      "Datenschutz und IT-Sicherheit sind nicht optional",
      "Die beste Software nützt nichts, wenn sie niemand nutzt – Change Management ist entscheidend",
    ],
    estimatedDuration: "6-12 Wochen",
    difficulty: "Schwer",
  },
  {
    key: "kpis",
    number: 10,
    name: "Steuerung & Kennzahlen",
    description: "Implementieren Sie KPIs und Controlling",
    detailedDescription:
      "Was Sie nicht messen, können Sie nicht steuern. Definieren Sie die richtigen Kennzahlen für Ihre Praxis, visualisieren Sie diese übersichtlich und treffen Sie datenbasierte Entscheidungen.",
    keyQuestions: [
      "Welche 5-7 Kennzahlen sind für Ihren Erfolg am wichtigsten?",
      "Wie oft und wie detailliert analysieren Sie Ihre Zahlen?",
      "Wer hat Zugang zu welchen Kennzahlen?",
      "Wie schnell erkennen Sie negative Trends?",
    ],
    actionItems: [
      "Definieren Sie Ihr KPI-Dashboard mit den wichtigsten Kennzahlen",
      "Etablieren Sie einen monatlichen Reporting-Rhythmus",
      "Setzen Sie Zielwerte und Warnschwellen für jede Kennzahl",
      "Schulen Sie Ihr Team im Verständnis und Nutzen von Kennzahlen",
    ],
    tips: [
      "Weniger ist mehr – fokussieren Sie auf wirklich aussagekräftige KPIs",
      "Vergleichen Sie sich mit Benchmarks Ihrer Fachrichtung",
      "Kennzahlen sind nur nützlich, wenn sie zu Handlungen führen",
    ],
    estimatedDuration: "2-3 Wochen",
    difficulty: "Mittel",
  },
  {
    key: "annual_goals",
    number: 11,
    name: "Jahresziele & Umsetzung",
    description: "Setzen Sie jährliche Ziele",
    detailedDescription:
      "Strategie ohne Umsetzung ist nur ein Wunsch. Übersetzen Sie Ihre langfristige Vision in konkrete Jahresziele, brechen Sie diese auf Quartale und Monate herunter und schaffen Sie Verbindlichkeit durch regelmäßige Reviews.",
    keyQuestions: [
      "Was sind die 3-5 wichtigsten Ziele für dieses Jahr?",
      "Wie messen Sie den Fortschritt bei jedem Ziel?",
      "Wer ist für welches Ziel verantwortlich?",
      "Wie stellen Sie sicher, dass Ziele nicht im Tagesgeschäft untergehen?",
    ],
    actionItems: [
      "Definieren Sie SMART-Ziele (Spezifisch, Messbar, Attraktiv, Realistisch, Terminiert)",
      "Erstellen Sie einen Jahresplan mit Quartals-Meilensteinen",
      "Implementieren Sie monatliche Ziel-Reviews mit dem Team",
      "Verknüpfen Sie individuelle Ziele mit den Praxiszielen",
    ],
    tips: [
      "Wenige ambitionierte Ziele sind besser als viele mittelmäßige",
      "Feiern Sie erreichte Meilensteine – das motiviert für die nächsten",
      "Seien Sie flexibel bei der Anpassung, aber hartnäckig bei der Verfolgung",
    ],
    estimatedDuration: "1-2 Wochen jährlich",
    difficulty: "Leicht",
  },
  {
    key: "innovation",
    number: 12,
    name: "Innovation & Zukunft",
    description: "Planen Sie für die Zukunft",
    detailedDescription:
      "Die Gesundheitsbranche verändert sich rasant. Bleiben Sie am Puls der Zeit, experimentieren Sie mit neuen Ansätzen und schaffen Sie eine Kultur, die Veränderung als Chance begreift.",
    keyQuestions: [
      "Welche Trends werden Ihre Fachrichtung in den nächsten 5 Jahren prägen?",
      "Wie fördern Sie innovative Ideen in Ihrem Team?",
      "Welche neuen Technologien oder Behandlungsmethoden sollten Sie evaluieren?",
      "Wie sieht Ihr Plan B aus, wenn sich der Markt stark verändert?",
    ],
    actionItems: [
      "Etablieren Sie einen regelmäßigen 'Innovations-Slot' im Teammeeting",
      "Besuchen Sie Fachkongresse und vernetzen Sie sich mit Kollegen",
      "Starten Sie jährlich mindestens ein Pilotprojekt für Neues",
      "Entwickeln Sie Szenarien für verschiedene Zukunftsentwicklungen",
    ],
    tips: [
      "Innovation muss nicht teuer sein – oft sind es kleine Verbesserungen",
      "Lernen Sie von anderen Branchen – Inspiration kommt oft von außen",
      "Schaffen Sie Freiräume für kreatives Denken abseits des Tagesgeschäfts",
    ],
    estimatedDuration: "Fortlaufend",
    difficulty: "Mittel",
  },
]

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const practiceId = searchParams.get("practiceId")

    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID required" }, { status: 400 })
    }

    const { data: progress, error } = await supabase
      .from("strategy_journey_progress")
      .select("*")
      .eq("practice_id", practiceId)
      .is("deleted_at", null)

    if (error) throw error

    // Merge steps with progress data
    const stepsWithProgress = STRATEGY_STEPS.map((step) => {
      const stepProgress = progress?.find((p) => p.step_key === step.key)
      return {
        ...step,
        status: stepProgress?.status || "not_started",
        completed_at: stepProgress?.completed_at,
        completed_by: stepProgress?.completed_by,
        notes: stepProgress?.notes,
        progress_data: stepProgress?.progress_data || {},
      }
    })

    // Calculate overall progress
    const completedSteps = stepsWithProgress.filter((s) => s.status === "completed").length
    const inProgressSteps = stepsWithProgress.filter((s) => s.status === "in_progress").length
    const overallProgress = Math.round((completedSteps / STRATEGY_STEPS.length) * 100)

    return NextResponse.json({
      steps: stepsWithProgress,
      summary: {
        total: STRATEGY_STEPS.length,
        completed: completedSteps,
        inProgress: inProgressSteps,
        notStarted: STRATEGY_STEPS.length - completedSteps - inProgressSteps,
        overallProgress,
      },
    })
  } catch (error: any) {
    console.error("[v0] Error fetching strategy journey:", error)
    return NextResponse.json({ error: "Failed to fetch strategy journey" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()
    const { practiceId, stepKey, status, notes, progressData } = body

    if (!practiceId || !stepKey) {
      return NextResponse.json({ error: "Practice ID and step key required" }, { status: 400 })
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userCheck, error: userError } = await supabase
      .from("users")
      .select("practice_id, role")
      .eq("id", user.id)
      .single()

    if (userError || !userCheck) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (userCheck.practice_id !== practiceId) {
      return NextResponse.json({ error: "Unauthorized - not a member of this practice" }, { status: 403 })
    }

    const serviceSupabase = createServiceClient()

    const stepNumber = STRATEGY_STEPS.find((s) => s.key === stepKey)?.number || 0

    const upsertData = {
      practice_id: practiceId,
      step_key: stepKey,
      step_number: stepNumber,
      status: status || "in_progress",
      completed_at: status === "completed" ? new Date().toISOString() : null,
      completed_by: status === "completed" ? user.id : null,
      notes,
      progress_data: progressData || {},
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await serviceSupabase
      .from("strategy_journey_progress")
      .upsert(upsertData, {
        onConflict: "practice_id,step_key",
      })
      .select()

    if (error) {
      console.error("[v0] Supabase upsert error:", error)
      throw error
    }

    return NextResponse.json({ progress: data?.[0] || data })
  } catch (error: any) {
    console.error("[v0] Error updating strategy journey:", error)
    return NextResponse.json({ error: "Failed to update strategy journey", details: error.message }, { status: 500 })
  }
}
