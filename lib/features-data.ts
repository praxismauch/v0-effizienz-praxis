import type React from "react"
import {
  Brain,
  TrendingUp,
  BarChart3,
  Users,
  Layers,
  GraduationCap,
  Briefcase,
  Network,
  Calendar,
  CheckSquare,
  Target,
  Workflow,
  ClipboardList,
  BookOpen,
  FolderOpen,
  Mic,
  Phone,
  Map,
  Heart,
  Lightbulb,
  Search,
  UserPlus,
  Star,
  DoorOpen,
  Package,
  MonitorCheck,
  Pin,
  Settings,
  FileText,
  LayoutDashboard,
  PieChart,
  Clock,
  Shield,
  Zap,
  Bell,
  LineChart,
  ClipboardCheck,
  PackageSearch,
  Shuffle,
  Smile,
  MessageSquare,
  HelpCircle,
  Bot,
  Video,
  Keyboard,
  Inbox,
  Send,
  Reply,
  Archive,
  ListChecks,
  Download,
  Activity,
  ThumbsUp,
  ArrowRightLeft,
  AlertTriangle,
  ShoppingCart,
  Scan,
  CalendarClock,
  ShieldCheck,
  ShieldAlert,
  BookOpenCheck,
  Crown,
  Cpu,
  Stethoscope,
  HeartPulse,
  Gauge,
  UserCheck,
} from "lucide-react"

export const FEATURE_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Brain,
  TrendingUp,
  BarChart3,
  Users,
  Layers,
  GraduationCap,
  Briefcase,
  Network,
  Calendar,
  CheckSquare,
  Target,
  Workflow,
  ClipboardList,
  BookOpen,
  FolderOpen,
  Mic,
  Phone,
  Map,
  Heart,
  Lightbulb,
  Search,
  UserPlus,
  Star,
  DoorOpen,
  Package,
  MonitorCheck,
  Pin,
  Settings,
  FileText,
  LayoutDashboard,
  PieChart,
  Clock,
  Shield,
  Zap,
  Bell,
  LineChart,
  ClipboardCheck,
  PackageSearch,
  Shuffle,
  Smile,
  MessageSquare,
  HelpCircle,
  Bot,
  Video,
  Keyboard,
  Inbox,
  Send,
  Reply,
  Archive,
  ListChecks,
  Download,
  Activity,
  ThumbsUp,
  ArrowRightLeft,
  AlertTriangle,
  ShoppingCart,
  Scan,
  CalendarClock,
  ShieldCheck,
  ShieldAlert,
  BookOpenCheck,
  Crown,
  Cpu,
  Stethoscope,
  HeartPulse,
  Gauge,
  UserCheck,
}

export function getFeatureIcon(iconName: string): React.ComponentType<{ className?: string }> {
  return FEATURE_ICON_MAP[iconName] || Brain
}

export interface FeatureData {
  slug: string
  title: string
  subtitle: string
  description: string
  detailedDescription: {
    intro: string
    howItWorks: string
    whyItHelps: string
  }
  iconName: string
  color: string
  heroImage?: string
  benefits: {
    title: string
    description: string
  }[]
  features: {
    title: string
    description: string
    iconName: string
  }[]
  useCases?: {
    title: string
    description: string
  }[]
  faq?: {
    question: string
    answer: string
  }[]
  relatedFeatureSlugs?: string[]
  metaTitle: string
  metaDescription: string
}

export const featuresData: FeatureData[] = [
  {
    slug: "ki-praxisanalyse",
    title: "KI-Praxisanalyse",
    subtitle: "Intelligente Stärken-Schwächen-Analyse für Ihre Praxis",
    description:
      "Nutzen Sie die Kraft künstlicher Intelligenz, um Ihre Praxis umfassend zu analysieren. Unsere KI identifiziert Stärken, deckt Verbesserungspotenziale auf und liefert konkrete Optimierungsvorschläge für nachhaltigen Erfolg.",
    detailedDescription: {
      intro:
        "Die KI-Praxisanalyse ist das Herzstück unserer intelligenten Praxismanagement-Lösung. Sie kombiniert modernste Machine-Learning-Algorithmen mit jahrzehntelanger Erfahrung im Gesundheitswesen, um Ihnen tiefgreifende Einblicke in die Performance Ihrer Praxis zu geben. Anders als herkömmliche Analysetools betrachtet unsere KI nicht nur einzelne Kennzahlen, sondern erkennt komplexe Zusammenhänge und Muster, die dem menschlichen Auge oft verborgen bleiben.",
      howItWorks:
        "Die KI-Praxisanalyse arbeitet kontinuierlich im Hintergrund und wertet alle relevanten Daten Ihrer Praxis aus: Terminauslastung, Patientenströme, Behandlungszeiten, Mitarbeiterproduktivität und finanzielle Kennzahlen. Durch den Einsatz von Natural Language Processing (NLP) analysiert sie sogar Patientenfeedback und interne Kommunikation. Die Ergebnisse werden in einem übersichtlichen Dashboard präsentiert, das Stärken grün, Verbesserungspotenziale gelb und kritische Bereiche rot markiert. Jede Analyse enthält konkrete, priorisierte Handlungsempfehlungen mit geschätztem Aufwand und erwartetem Nutzen.",
      whyItHelps:
        "Als Praxisinhaber oder -manager fehlt Ihnen oft die Zeit, alle Daten selbst zu analysieren und Trends zu erkennen. Die KI-Praxisanalyse übernimmt diese Arbeit für Sie und liefert Erkenntnisse, die sonst Wochen manueller Auswertung erfordern würden. Sie erkennen Probleme, bevor sie eskalieren, identifizieren ungenutzte Potenziale und können datenbasierte Entscheidungen treffen. Praxen, die unsere KI-Analyse nutzen, berichten von durchschnittlich 23% höherer Effizienz und 15% mehr Patientenzufriedenheit innerhalb der ersten sechs Monate.",
    },
    iconName: "Brain",
    color: "bg-blue-500/10 text-blue-600",
    heroImage: "/ai-brain-analysis-medical-dashboard-blue-modern.jpg",
    benefits: [
      {
        title: "Automatische Analyse",
        description: "KI-gestützte Auswertung aller relevanten Praxisdaten in Echtzeit",
      },
      {
        title: "Konkrete Handlungsempfehlungen",
        description: "Erhalten Sie priorisierte Maßnahmen zur Optimierung Ihrer Praxis",
      },
      { title: "Benchmarking", description: "Vergleichen Sie Ihre Performance mit ähnlichen Praxen" },
      { title: "Trendprognosen", description: "Erkennen Sie Entwicklungen frühzeitig und reagieren Sie proaktiv" },
      { title: "Zeitersparnis", description: "Automatisierte Analysen sparen Ihnen wertvolle Zeit" },
      {
        title: "Datenbasierte Entscheidungen",
        description: "Treffen Sie fundierte Entscheidungen auf Basis von Fakten",
      },
    ],
    features: [
      {
        title: "SWOT-Analyse",
        description: "Automatische Identifikation von Stärken, Schwächen, Chancen und Risiken Ihrer Praxis",
        iconName: "Search",
      },
      {
        title: "Leistungsübersicht",
        description: "Detaillierte Auswertung aller Praxisleistungen und deren Entwicklung",
        iconName: "BarChart3",
      },
      {
        title: "Optimierungsvorschläge",
        description: "KI-generierte, priorisierte Maßnahmen zur Verbesserung",
        iconName: "Lightbulb",
      },
      {
        title: "Prognosemodelle",
        description: "Vorhersagen zu Patientenentwicklung, Umsatz und Ressourcenbedarf",
        iconName: "TrendingUp",
      },
    ],
    useCases: [
      {
        title: "Quartalsreviews",
        description:
          "Nutzen Sie die KI-Analyse für strukturierte Quartalsauswertungen und identifizieren Sie Handlungsfelder.",
      },
      {
        title: "Strategieplanung",
        description: "Basieren Sie Ihre langfristige Praxisstrategie auf fundierten KI-Insights.",
      },
      {
        title: "Team-Meetings",
        description: "Präsentieren Sie dem Team datenbasierte Erkenntnisse und gemeinsame Verbesserungsziele.",
      },
    ],
    faq: [
      {
        question: "Welche Daten werden für die Analyse verwendet?",
        answer:
          "Die KI analysiert alle in Effizienz Praxis erfassten Daten, darunter Termine, Leistungen, Mitarbeiterinformationen und Finanzdaten. Alle Daten bleiben dabei sicher in Ihrem System.",
      },
      {
        question: "Wie oft wird die Analyse aktualisiert?",
        answer:
          "Die Analyse wird in Echtzeit aktualisiert, sobald neue Daten erfasst werden. Sie haben jederzeit Zugriff auf aktuelle Insights.",
      },
      {
        question: "Kann ich die Analyseparameter anpassen?",
        answer: "Ja, Sie können Schwerpunkte setzen und die Analyse auf bestimmte Bereiche fokussieren.",
      },
    ],
    relatedFeatureSlugs: ["praxis-auswertung", "praxis-journal", "igel-roi-analyse"],
    metaTitle: "KI-Praxisanalyse | Intelligente SWOT-Analyse für Arztpraxen",
    metaDescription:
      "Nutzen Sie künstliche Intelligenz für eine umfassende Stärken-Schwächen-Analyse Ihrer Praxis. Erhalten Sie konkrete Optimierungsvorschläge und steigern Sie Ihre Effizienz.",
  },
  {
    slug: "praxis-auswertung",
    title: "Praxis-Auswertung",
    subtitle: "Umfassende Analytics mit KV-Abrechnung und KPI-Dashboards",
    description:
      "Behalten Sie alle wichtigen Kennzahlen Ihrer Praxis im Blick. Von der KV-Abrechnung bis zu individuellen KPIs – unsere Auswertungstools liefern Ihnen die Insights, die Sie für strategische Entscheidungen benötigen.",
    detailedDescription: {
      intro:
        "Die Praxis-Auswertung transformiert Ihre Rohdaten in wertvolle Business Intelligence. In einer Zeit, in der Arztpraxen immer mehr wie Unternehmen geführt werden müssen, ist es entscheidend, die richtigen Kennzahlen zu kennen und zu verstehen. Unser System aggregiert Daten aus allen Bereichen Ihrer Praxis und präsentiert sie in intuitiven Dashboards, die sowohl den schnellen Überblick als auch tiefgehende Analysen ermöglichen.",
      howItWorks:
        "Das System sammelt automatisch Daten aus Ihrer Praxissoftware, dem Terminkalender, der Buchhaltung und der KV-Abrechnung. Diese Daten werden in Echtzeit verarbeitet und in übersichtlichen Dashboards dargestellt. Sie können vordefinierte KPI-Sets nutzen oder eigene Kennzahlen definieren. Drill-Down-Funktionen ermöglichen es Ihnen, von der Gesamtübersicht bis ins kleinste Detail zu navigieren. Automatische Berichte können täglich, wöchentlich oder monatlich per E-Mail versendet werden.",
      whyItHelps:
        "Ohne klare Kennzahlen fliegen Sie blind. Die Praxis-Auswertung gibt Ihnen die Kontrolle zurück und zeigt Ihnen genau, wo Ihre Praxis steht. Sie erkennen sofort, welche Behandlungen profitabel sind, wo Kapazitäten ungenutzt bleiben und wie sich Ihre Praxis im Zeitverlauf entwickelt. Die Integration der KV-Abrechnung macht Schluss mit dem mühsamen Abgleich verschiedener Systeme und gibt Ihnen einen vollständigen Überblick über Ihre Einnahmen.",
    },
    iconName: "BarChart3",
    color: "bg-emerald-500/10 text-emerald-600",
    heroImage: "/analytics-charts-dashboard-green-medical-practice.jpg",
    benefits: [
      { title: "Echtzeit-Dashboards", description: "Alle wichtigen KPIs auf einen Blick, immer aktuell" },
      {
        title: "KV-Integration",
        description: "Nahtlose Verknüpfung mit Ihrer kassenärztlichen Abrechnung",
      },
      {
        title: "Individuelle KPIs",
        description: "Definieren Sie eigene Kennzahlen für Ihre spezifischen Anforderungen",
      },
      { title: "Trendanalysen", description: "Verfolgen Sie die Entwicklung Ihrer Praxis über Zeit" },
      { title: "Export-Funktionen", description: "Exportieren Sie Berichte in verschiedene Formate" },
      { title: "Automatische Berichte", description: "Erhalten Sie regelmäßige Reports per E-Mail" },
    ],
    features: [
      {
        title: "KPI-Dashboard",
        description: "Übersichtliche Darstellung aller wichtigen Leistungskennzahlen",
        iconName: "LayoutDashboard",
      },
      {
        title: "KV-Abrechnungsanalyse",
        description: "Detaillierte Auswertung Ihrer kassenärztlichen Abrechnungen",
        iconName: "FileText",
      },
      {
        title: "Umsatzanalyse",
        description: "Tracking von Umsätzen nach Behandlungsart, Arzt und Zeitraum",
        iconName: "PieChart",
      },
      {
        title: "Vergleichsanalysen",
        description: "Periodenvergleiche und Benchmarking mit Vorjahreswerten",
        iconName: "LineChart",
      },
    ],
    useCases: [
      {
        title: "Monatliches Controlling",
        description:
          "Überwachen Sie monatlich alle relevanten Kennzahlen und reagieren Sie frühzeitig auf Abweichungen.",
      },
      {
        title: "Jahresabschluss-Vorbereitung",
        description: "Nutzen Sie die umfassenden Berichte für die Vorbereitung Ihres Jahresabschlusses.",
      },
      {
        title: "Bankgespräche",
        description: "Präsentieren Sie professionelle Auswertungen bei Kreditgesprächen oder Investitionsplanungen.",
      },
    ],
    faq: [
      {
        question: "Welche KV-Systeme werden unterstützt?",
        answer:
          "Wir unterstützen alle gängigen KV-Abrechnungssysteme in Deutschland. Die Integration erfolgt automatisch.",
      },
      {
        question: "Kann ich eigene KPIs definieren?",
        answer: "Ja, Sie können beliebige eigene Kennzahlen definieren und diese in Ihren Dashboards anzeigen lassen.",
      },
      {
        question: "Wie sicher sind meine Finanzdaten?",
        answer: "Alle Daten werden verschlüsselt übertragen und gespeichert. Wir erfüllen alle DSGVO-Anforderungen.",
      },
    ],
    relatedFeatureSlugs: ["ki-praxisanalyse", "praxis-journal", "igel-roi-analyse"],
    metaTitle: "Praxis-Auswertung | KPI-Dashboards & KV-Abrechnung für Arztpraxen",
    metaDescription:
      "Umfassende Analytics für Ihre Praxis: KV-Abrechnungsanalyse, KPI-Dashboards und Trendauswertungen. Behalten Sie alle Kennzahlen im Blick.",
  },
  {
    slug: "praxis-journal",
    title: "Praxis-Journal",
    subtitle: "Tägliche Dokumentation und aussagekräftige Auswertungen",
    description:
      "Dokumentieren Sie den Praxisalltag strukturiert und effizient. Das Praxis-Journal ermöglicht tägliche Einträge, automatische Zusammenfassungen und wertvolle Erkenntnisse aus Ihren Aufzeichnungen.",
    detailedDescription: {
      intro:
        "Das Praxis-Journal revolutioniert die Art, wie Sie Ihren Praxisalltag dokumentieren. Statt loser Notizen oder vergessener Beobachtungen haben Sie ein strukturiertes System, das wichtige Ereignisse, Auffälligkeiten und Ideen festhält. Die KI-gestützte Auswertung verwandelt Ihre täglichen Einträge in wertvolle Erkenntnisse, die zur kontinuierlichen Verbesserung Ihrer Praxis beitragen.",
      howItWorks:
        "Jeden Tag können Sie in wenigen Minuten einen Journal-Eintrag erstellen. Das System führt Sie mit intelligenten Vorlagen durch relevante Kategorien: Patientenaufkommen, besondere Vorkommnisse, Teamdynamik, Prozessbeobachtungen und Ideen. Die KI analysiert Ihre Einträge automatisch, erkennt wiederkehrende Themen und generiert wöchentliche sowie monatliche Zusammenfassungen. Über die Zeit entsteht so ein wertvolles Wissensarchiv Ihrer Praxis.",
      whyItHelps:
        "Viele wichtige Beobachtungen und Ideen gehen im hektischen Praxisalltag verloren. Das Praxis-Journal sorgt dafür, dass nichts vergessen wird. Es hilft Ihnen, Muster zu erkennen – etwa wiederkehrende Probleme zu bestimmten Zeiten oder bei bestimmten Prozessen. Bei Personalentscheidungen, Prozessoptimierungen oder der Einarbeitung neuer Mitarbeiter ist das Journal eine unschätzbare Ressource. Zudem fördert das regelmäßige Dokumentieren die Reflexion und kontinuierliche Verbesserung.",
    },
    iconName: "BookOpen",
    color: "bg-purple-500/10 text-purple-600",
    heroImage: "/medical-journal-documentation-teal-modern-dashboar.jpg",
    benefits: [
      { title: "Strukturierte Dokumentation", description: "Erfassen Sie alle wichtigen Ereignisse systematisch" },
      {
        title: "KI-Zusammenfassungen",
        description: "Automatische Erstellung von Wochen- und Monatsberichten",
      },
      { title: "Mustererkennung", description: "Erkennen Sie wiederkehrende Themen und Trends" },
      { title: "Wissensarchiv", description: "Bauen Sie ein durchsuchbares Archiv Ihrer Praxishistorie auf" },
      { title: "Team-Sichtbarkeit", description: "Teilen Sie relevante Einträge mit Ihrem Team" },
      { title: "Mobile Erfassung", description: "Dokumentieren Sie auch unterwegs per Smartphone" },
    ],
    features: [
      {
        title: "Tägliche Einträge",
        description: "Schnelle und strukturierte Erfassung von Tagesereignissen",
        iconName: "FileText",
      },
      {
        title: "Automatische Berichte",
        description: "KI-generierte Zusammenfassungen und Erkenntnisse",
        iconName: "Brain",
      },
      {
        title: "Kategorisierung",
        description: "Flexible Kategorien für verschiedene Dokumentationstypen",
        iconName: "FolderOpen",
      },
      {
        title: "Volltextsuche",
        description: "Finden Sie schnell frühere Einträge und Erkenntnisse",
        iconName: "Search",
      },
    ],
    useCases: [
      {
        title: "Tägliche Reflexion",
        description: "Nehmen Sie sich 5 Minuten am Tagesende, um wichtige Beobachtungen festzuhalten.",
      },
      {
        title: "Qualitätsmanagement",
        description: "Nutzen Sie das Journal für QM-Dokumentation und kontinuierliche Verbesserungsprozesse.",
      },
      {
        title: "Einarbeitung neuer Mitarbeiter",
        description: "Greifen Sie auf dokumentierte Best Practices und häufige Situationen zurück.",
      },
    ],
    faq: [
      {
        question: "Wie viel Zeit muss ich täglich investieren?",
        answer:
          "Ein täglicher Eintrag dauert typischerweise nur 3-5 Minuten. Die Vorlagen führen Sie effizient durch die relevanten Punkte.",
      },
      {
        question: "Wer kann die Einträge sehen?",
        answer:
          "Sie bestimmen die Sichtbarkeit jedes Eintrags. Einträge können privat, für das Team oder für bestimmte Personen freigegeben werden.",
      },
      {
        question: "Können Einträge nachträglich bearbeitet werden?",
        answer: "Ja, Einträge können bearbeitet werden. Änderungen werden dabei protokolliert.",
      },
    ],
    relatedFeatureSlugs: ["ki-praxisanalyse", "gespraechsprotokoll", "wissen-qm"],
    metaTitle: "Praxis-Journal | Tägliche Dokumentation & KI-Auswertungen",
    metaDescription:
      "Dokumentieren Sie Ihren Praxisalltag strukturiert und effizient. KI-gestützte Zusammenfassungen und Erkenntnisse für kontinuierliche Verbesserung.",
  },
  {
    slug: "team-management",
    title: "Team-Management",
    subtitle: "Mitarbeiter, Urlaub, Krankmeldungen & Organigramm",
    description:
      "Verwalten Sie Ihr gesamtes Praxisteam zentral und übersichtlich. Von der Urlaubsplanung bis zum Organigramm – alle Personalfunktionen in einer integrierten Lösung.",
    detailedDescription: {
      intro:
        "Ein gut funktionierendes Team ist das Rückgrat jeder erfolgreichen Praxis. Unser Team-Management-Modul gibt Ihnen alle Werkzeuge an die Hand, um Ihr Personal effektiv zu führen, Abwesenheiten zu koordinieren und die Teamstruktur transparent zu halten. Die Integration mit anderen Modulen sorgt dafür, dass Personaländerungen automatisch in Terminplanung, Aufgabenverteilung und Auswertungen berücksichtigt werden.",
      howItWorks:
        "Im Team-Management pflegen Sie alle Mitarbeiterdaten zentral: Kontaktinformationen, Qualifikationen, Arbeitszeiten und Zuständigkeiten. Die Urlaubsplanung zeigt auf einen Blick, wer wann abwesend ist, und warnt automatisch bei Engpässen. Krankmeldungen werden digital erfasst und fließen in die Einsatzplanung ein. Das visuelle Organigramm macht Hierarchien und Verantwortlichkeiten für alle transparent. Automatische Erinnerungen informieren über auslaufende Verträge, fällige Schulungen oder Jubiläen.",
      whyItHelps:
        "Personalverwaltung bindet in vielen Praxen enorme Ressourcen. Unser System automatisiert Routineaufgaben und reduziert den administrativen Aufwand um bis zu 60%. Die zentrale Datenhaltung eliminiert doppelte Datenpflege und Inkonsistenzen. Mitarbeiter schätzen die Transparenz bei Urlaubsplanung und Zuständigkeiten, was die Zufriedenheit erhöht. Für Sie als Praxisleitung bedeutet das: mehr Zeit für das Wesentliche – die Führung und Entwicklung Ihres Teams.",
    },
    iconName: "Users",
    color: "bg-cyan-500/10 text-cyan-600",
    heroImage: "/team-management-organization-chart-people-cyan.jpg",
    benefits: [
      { title: "Zentrale Mitarbeiterverwaltung", description: "Alle Personaldaten an einem Ort" },
      { title: "Digitale Urlaubsplanung", description: "Übersichtliche Urlaubskoordination mit Konfliktwarnung" },
      { title: "Krankmeldungsmanagement", description: "Effiziente Erfassung und Nachverfolgung" },
      { title: "Visuelles Organigramm", description: "Transparente Darstellung der Teamstruktur" },
      { title: "Automatische Erinnerungen", description: "Nie wieder wichtige Termine vergessen" },
      { title: "Qualifikationsübersicht", description: "Behalten Sie Schulungen und Zertifikate im Blick" },
    ],
    features: [
      {
        title: "Mitarbeiterprofile",
        description: "Umfassende Profile mit allen relevanten Informationen",
        iconName: "Users",
      },
      {
        title: "Abwesenheitskalender",
        description: "Übersichtliche Planung von Urlaub und Abwesenheiten",
        iconName: "Calendar",
      },
      {
        title: "Organigramm",
        description: "Visuelle Darstellung der Organisationsstruktur",
        iconName: "Network",
      },
      {
        title: "Dokumentenverwaltung",
        description: "Sichere Ablage von Verträgen und Zertifikaten",
        iconName: "FolderOpen",
      },
    ],
    useCases: [
      {
        title: "Urlaubsplanung",
        description: "Koordinieren Sie Urlaubswünsche konfliktfrei und sorgen Sie für ausreichende Besetzung.",
      },
      {
        title: "Einarbeitung neuer Mitarbeiter",
        description: "Nutzen Sie strukturierte Onboarding-Prozesse mit klaren Zuständigkeiten.",
      },
      {
        title: "Jahresgespräche",
        description: "Greifen Sie auf alle relevanten Mitarbeiterdaten für Entwicklungsgespräche zu.",
      },
    ],
    faq: [
      {
        question: "Können Mitarbeiter selbst Urlaub beantragen?",
        answer:
          "Ja, über das Mitarbeiterportal können Anträge gestellt werden, die dann vom Vorgesetzten genehmigt werden.",
      },
      {
        question: "Ist das System DSGVO-konform?",
        answer: "Absolut. Alle Personaldaten werden nach höchsten Datenschutzstandards verarbeitet und gespeichert.",
      },
      {
        question: "Kann ich Arbeitszeitmodelle hinterlegen?",
        answer: "Ja, Sie können beliebige Arbeitszeitmodelle definieren und Mitarbeitern zuweisen.",
      },
    ],
    relatedFeatureSlugs: ["organigramm", "skills-management", "fortbildung", "kalender"],
    metaTitle: "Team-Management | Personalverwaltung für Arztpraxen",
    metaDescription:
      "Effizientes Team-Management für Ihre Praxis: Mitarbeiterverwaltung, Urlaubsplanung, Krankmeldungen und Organigramm in einer Lösung.",
  },
  {
    slug: "skills-management",
    title: "Skills-Management",
    subtitle: "Kompetenzen erfassen, entwickeln und optimal einsetzen",
    description:
      "Behalten Sie den Überblick über die Fähigkeiten Ihres Teams. Identifizieren Sie Kompetenzlücken, planen Sie gezielte Entwicklungsmaßnahmen und setzen Sie Ihre Mitarbeiter optimal ein.",
    detailedDescription: {
      intro:
        "In einer modernen Arztpraxis sind vielfältige Kompetenzen gefragt – von medizinischen Fachkenntnissen über Softwareskills bis hin zu Soft Skills im Patientenkontakt. Das Skills-Management macht diese Kompetenzen sichtbar und ermöglicht eine strategische Personalentwicklung. Sie erkennen auf einen Blick, welche Fähigkeiten in Ihrem Team vorhanden sind und wo Entwicklungsbedarf besteht.",
      howItWorks:
        "Für jeden Mitarbeiter wird ein Kompetenzprofil angelegt, das sowohl Fachkompetenzen als auch übergreifende Skills erfasst. Die Bewertung erfolgt auf einer einheitlichen Skala, optional mit Selbst- und Fremdeinschätzung. Das System aggregiert die Daten zu Team-Übersichten und zeigt Kompetenzlücken auf. Bei der Aufgabenzuweisung schlägt das System passende Mitarbeiter basierend auf ihren Skills vor. Entwicklungspläne verknüpfen Kompetenzlücken mit konkreten Fortbildungsmaßnahmen.",
      whyItHelps:
        "Ohne systematisches Skills-Management bleiben Talente oft unentdeckt und Aufgaben werden nicht optimal verteilt. Unser System sorgt dafür, dass die richtigen Personen die richtigen Aufgaben übernehmen. Mitarbeiter fühlen sich wertgeschätzt, wenn ihre Kompetenzen anerkannt werden, und motiviert, wenn sie klare Entwicklungsperspektiven sehen. Für Sie als Praxisleitung wird die Personalplanung transparenter und effektiver.",
    },
    iconName: "Layers",
    color: "bg-violet-500/10 text-violet-600",
    heroImage: "/skills-competency-matrix-violet-modern-dashboard.jpg",
    benefits: [
      { title: "Kompetenzübersicht", description: "Alle Skills Ihres Teams auf einen Blick" },
      { title: "Gap-Analyse", description: "Identifizieren Sie Kompetenzlücken systematisch" },
      { title: "Optimale Aufgabenzuweisung", description: "Matchen Sie Aufgaben mit passenden Kompetenzen" },
      { title: "Entwicklungsplanung", description: "Erstellen Sie individuelle Entwicklungspläne" },
      { title: "Nachfolgeplanung", description: "Identifizieren Sie Potenziale für kritische Positionen" },
      { title: "Skill-Matrix", description: "Visualisieren Sie Kompetenzen im Teamvergleich" },
    ],
    features: [
      {
        title: "Kompetenzprofile",
        description: "Individuelle Profile mit allen relevanten Fähigkeiten",
        iconName: "Users",
      },
      {
        title: "Skill-Matrix",
        description: "Übersichtliche Darstellung der Teamkompetenzen",
        iconName: "Layers",
      },
      {
        title: "Gap-Analyse",
        description: "Automatische Identifikation von Kompetenzlücken",
        iconName: "Search",
      },
      {
        title: "Entwicklungspläne",
        description: "Strukturierte Planung von Weiterbildungsmaßnahmen",
        iconName: "Target",
      },
    ],
    useCases: [
      {
        title: "Jahresplanung",
        description: "Planen Sie Fortbildungen basierend auf identifizierten Kompetenzlücken.",
      },
      {
        title: "Neue Leistungsangebote",
        description: "Prüfen Sie, welche Kompetenzen für neue Behandlungen benötigt werden.",
      },
      {
        title: "Vertretungsregelungen",
        description: "Finden Sie schnell Mitarbeiter mit den passenden Skills für Vertretungen.",
      },
    ],
    faq: [
      {
        question: "Wie werden die Skills bewertet?",
        answer:
          "Die Bewertung erfolgt auf einer Skala von 1-5, optional mit Selbst- und Fremdeinschätzung für ein vollständiges Bild.",
      },
      {
        question: "Können Mitarbeiter ihre eigenen Skills eintragen?",
        answer: "Ja, Mitarbeiter können Selbsteinschätzungen vornehmen, die dann vom Vorgesetzten bestätigt werden.",
      },
      {
        question: "Wie oft sollten Skills aktualisiert werden?",
        answer: "Wir empfehlen eine jährliche Überprüfung, idealerweise im Rahmen von Entwicklungsgesprächen.",
      },
    ],
    relatedFeatureSlugs: ["team-management", "fortbildung", "zustaendigkeiten"],
    metaTitle: "Skills-Management | Kompetenzmanagement für Arztpraxen",
    metaDescription:
      "Erfassen und entwickeln Sie die Kompetenzen Ihres Praxisteams systematisch. Gap-Analysen und Entwicklungspläne für optimalen Personaleinsatz.",
  },
  {
    slug: "fortbildung",
    title: "Fortbildung",
    subtitle: "Schulungen planen, verfolgen und dokumentieren",
    description:
      "Behalten Sie alle Fortbildungen im Blick. Planen Sie Schulungen, tracken Sie CME-Punkte und stellen Sie sicher, dass alle Pflichtfortbildungen rechtzeitig absolviert werden.",
    detailedDescription: {
      intro:
        "Kontinuierliche Weiterbildung ist im Gesundheitswesen nicht nur Pflicht, sondern auch Qualitätsmerkmal. Unser Fortbildungsmodul vereinfacht die Verwaltung aller Schulungsaktivitäten: von der Planung über die Durchführung bis zur Dokumentation. Sie behalten den Überblick über CME-Punkte, Pflichtschulungen und individuelle Weiterbildungsziele – für jeden Mitarbeiter und das gesamte Team.",
      howItWorks:
        "Das System verwaltet einen zentralen Fortbildungskatalog mit internen und externen Angeboten. Für jeden Mitarbeiter werden Pflichtfortbildungen und CME-Anforderungen hinterlegt. Automatische Erinnerungen warnen rechtzeitig vor ablaufenden Fristen. Nach Teilnahme werden Zertifikate digital abgelegt und CME-Punkte automatisch erfasst. Umfassende Berichte zeigen den Fortbildungsstand auf Team- und Mitarbeiterebene.",
      whyItHelps:
        "Die Verwaltung von Fortbildungen ist oft eine administrative Herausforderung. Unser System automatisiert Routineaufgaben und stellt sicher, dass keine Fristen verpasst werden. Die digitale Dokumentation erleichtert Nachweise gegenüber Kammern und bei Praxisbegehungen. Mitarbeiter schätzen die Transparenz über ihre Weiterbildungsmöglichkeiten und den aktuellen Stand ihrer Qualifikationen.",
    },
    iconName: "GraduationCap",
    color: "bg-rose-500/10 text-rose-600",
    heroImage: "/training-education-certificate-rose-modern-dashboa.jpg",
    benefits: [
      { title: "CME-Tracking", description: "Automatische Erfassung und Übersicht der CME-Punkte" },
      { title: "Fristenmanagement", description: "Nie wieder Pflichtfortbildungen verpassen" },
      { title: "Zertifikatsverwaltung", description: "Digitale Ablage aller Nachweise" },
      { title: "Budgetplanung", description: "Überblick über Fortbildungskosten" },
      { title: "Kursplanung", description: "Interne Schulungen einfach organisieren" },
      { title: "Compliance-Berichte", description: "Nachweise für Behörden und Kammern" },
    ],
    features: [
      {
        title: "Fortbildungskatalog",
        description: "Übersicht aller verfügbaren Schulungen und Kurse",
        iconName: "BookOpen",
      },
      {
        title: "CME-Dashboard",
        description: "Tracking von Fortbildungspunkten pro Mitarbeiter",
        iconName: "Target",
      },
      {
        title: "Zertifikatsverwaltung",
        description: "Sichere Ablage und einfacher Zugriff auf Nachweise",
        iconName: "FileText",
      },
      {
        title: "Erinnerungssystem",
        description: "Automatische Benachrichtigungen bei fälligen Schulungen",
        iconName: "Bell",
      },
    ],
    useCases: [
      {
        title: "Jahresplanung",
        description: "Erstellen Sie einen Fortbildungsplan mit Budget und Zeitfenstern.",
      },
      {
        title: "Behördenprüfung",
        description: "Weisen Sie alle Pflichtschulungen mit wenigen Klicks nach.",
      },
      {
        title: "Mitarbeiterentwicklung",
        description: "Verknüpfen Sie Fortbildungen mit individuellen Entwicklungszielen.",
      },
    ],
    faq: [
      {
        question: "Werden externe Fortbildungen automatisch erfasst?",
        answer: "Externe Fortbildungen können manuell eingetragen oder per Zertifikats-Upload erfasst werden.",
      },
      {
        question: "Wie funktioniert das CME-Tracking?",
        answer:
          "CME-Punkte werden pro Mitarbeiter und Fachrichtung erfasst. Das System zeigt den aktuellen Stand und warnt bei drohendem Punktemangel.",
      },
      {
        question: "Kann ich interne Schulungen verwalten?",
        answer: "Ja, Sie können eigene Schulungen anlegen, Teilnehmer einladen und Anwesenheiten dokumentieren.",
      },
    ],
    relatedFeatureSlugs: ["skills-management", "team-management", "wissen-qm"],
    metaTitle: "Fortbildung | CME-Tracking & Schulungsmanagement für Arztpraxen",
    metaDescription:
      "Verwalten Sie Fortbildungen effizient: CME-Punkte tracken, Pflichtschulungen überwachen und Zertifikate digital ablegen.",
  },
  {
    slug: "recruiting",
    title: "Recruiting-System",
    subtitle: "Stellenausschreibungen und Bewerbermanagement",
    description:
      "Finden Sie die besten Talente für Ihre Praxis. Von der Stellenausschreibung bis zur Einstellung – unser Recruiting-System begleitet Sie durch den gesamten Bewerbungsprozess.",
    detailedDescription: {
      intro:
        "Der Fachkräftemangel im Gesundheitswesen macht professionelles Recruiting wichtiger denn je. Unser System unterstützt Sie dabei, Ihre Praxis als attraktiven Arbeitgeber zu präsentieren und den gesamten Bewerbungsprozess effizient zu gestalten. Von der ansprechenden Stellenausschreibung über die strukturierte Bewerberverwaltung bis zur Einstellung – alles in einem durchdachten Workflow.",
      howItWorks:
        "Erstellen Sie Stellenausschreibungen mit unserem Editor, der auf medizinische Berufe optimiert ist. Veröffentlichen Sie mit einem Klick auf Ihrer Karriereseite und optionalen Jobportalen. Eingehende Bewerbungen werden automatisch erfasst und können strukturiert bewertet werden. Der Kanban-Board-Ansicht zeigt, in welcher Phase sich jeder Bewerber befindet. Kommunikation mit Bewerbern erfolgt direkt aus dem System mit vordefinierten Templates.",
      whyItHelps:
        "Gutes Personal zu finden ist schwer genug – der Prozess sollte es nicht noch schwerer machen. Unser System reduziert den administrativen Aufwand beim Recruiting um bis zu 70%. Bewerber erleben einen professionellen, schnellen Prozess, was Ihre Arbeitgebermarke stärkt. Sie behalten jederzeit den Überblick und können datenbasiert entscheiden, welche Recruiting-Kanäle für Ihre Praxis am besten funktionieren.",
    },
    iconName: "Briefcase",
    color: "bg-orange-500/10 text-orange-600",
    heroImage: "/recruiting-hiring-job-candidates-orange-profession.jpg",
    benefits: [
      { title: "Stellenausschreibungen", description: "Professionelle Anzeigen schnell erstellen" },
      { title: "Bewerberverwaltung", description: "Alle Bewerbungen zentral und übersichtlich" },
      { title: "Workflow-Management", description: "Strukturierter Prozess von Bewerbung bis Einstellung" },
      { title: "Kommunikationstools", description: "Effiziente Bewerberkorrespondenz mit Templates" },
      { title: "Karriereseite", description: "Präsentieren Sie Ihre Praxis als Top-Arbeitgeber" },
      { title: "Reporting", description: "Analysieren Sie Ihren Recruiting-Erfolg" },
    ],
    features: [
      {
        title: "Stellen-Editor",
        description: "Erstellen Sie ansprechende Stellenanzeigen mit Vorlagen",
        iconName: "FileText",
      },
      {
        title: "Bewerber-Pipeline",
        description: "Kanban-Board für übersichtliches Bewerbermanagement",
        iconName: "Workflow",
      },
      {
        title: "Interviewplanung",
        description: "Terminkoordination für Vorstellungsgespräche",
        iconName: "Calendar",
      },
      {
        title: "Dokumentenverwaltung",
        description: "Sichere Ablage von Bewerbungsunterlagen",
        iconName: "FolderOpen",
      },
    ],
    useCases: [
      {
        title: "Neue Stelle besetzen",
        description: "Vom ersten Entwurf bis zur Unterschrift – alles in einem System.",
      },
      {
        title: "Talentpool aufbauen",
        description: "Speichern Sie interessante Kandidaten für zukünftige Vakanzen.",
      },
      {
        title: "Arbeitgebermarke stärken",
        description: "Nutzen Sie die Karriereseite zur Präsentation Ihrer Praxiskultur.",
      },
    ],
    faq: [
      {
        question: "Kann ich auf Jobportalen veröffentlichen?",
        answer:
          "Ja, Sie können Stellenanzeigen mit einem Klick auf verschiedenen Jobportalen veröffentlichen (abhängig vom gewählten Plan).",
      },
      {
        question: "Wie lange werden Bewerberdaten gespeichert?",
        answer: "Bewerberdaten werden DSGVO-konform verarbeitet und nach definierbaren Fristen automatisch gelöscht.",
      },
      {
        question: "Können mehrere Personen Bewerber bewerten?",
        answer: "Ja, Sie können Teammitglieder in den Bewertungsprozess einbinden und Bewertungen zusammenführen.",
      },
    ],
    relatedFeatureSlugs: ["team-management", "onboarding", "skills-management"],
    metaTitle: "Recruiting-System | Bewerbermanagement für Arztpraxen",
    metaDescription:
      "Professionelles Recruiting für Ihre Praxis: Stellenausschreibungen erstellen, Bewerber verwalten und die besten Talente finden.",
  },
  {
    slug: "organigramm",
    title: "Organigramm",
    subtitle: "Visualisieren Sie Ihre Praxisstruktur",
    description:
      "Schaffen Sie Transparenz über Hierarchien und Verantwortlichkeiten. Das interaktive Organigramm zeigt die Struktur Ihrer Praxis übersichtlich und ist immer aktuell.",
    detailedDescription: {
      intro:
        "Ein klares Organigramm ist mehr als nur ein Schaubild – es ist die Grundlage für effektive Zusammenarbeit und klare Verantwortlichkeiten. Unser interaktives Organigramm visualisiert die Struktur Ihrer Praxis auf intuitive Weise und ist immer automatisch aktuell, da es direkt mit den Mitarbeiterdaten verknüpft ist. Neue Mitarbeiter verstehen sofort, wer wofür zuständig ist.",
      howItWorks:
        "Das Organigramm wird automatisch aus Ihren Mitarbeiterdaten und definierten Berichtslinien generiert. Per Drag & Drop können Sie Positionen anpassen und Verantwortlichkeiten ändern. Klicken Sie auf eine Position, um Details zum Mitarbeiter, dessen Zuständigkeiten und Kontaktdaten zu sehen. Verschiedene Ansichten ermöglichen die Darstellung nach Teams, Standorten oder Funktionsbereichen. Das Organigramm kann als PDF exportiert oder in Präsentationen eingebunden werden.",
      whyItHelps:
        "In wachsenden Praxen verliert man schnell den Überblick über Zuständigkeiten. Das Organigramm schafft Klarheit für alle: Mitarbeiter wissen, an wen sie sich wenden können, neue Teammitglieder finden sich schneller zurecht, und Sie als Praxisleitung haben die Struktur jederzeit im Blick. Bei der nächsten Praxisbegehung oder beim Onboarding neuer Mitarbeiter ist das aktuelle Organigramm nur einen Klick entfernt.",
    },
    iconName: "Network",
    color: "bg-sky-500/10 text-sky-600",
    heroImage: "/organization-structure-chart-sky-blue-modern.jpg",
    benefits: [
      { title: "Automatische Aktualisierung", description: "Immer synchron mit Ihren Personaldaten" },
      { title: "Interaktive Ansicht", description: "Klickbare Profile mit Details" },
      { title: "Verschiedene Layouts", description: "Hierarchisch, nach Teams oder Standorten" },
      { title: "Export-Optionen", description: "PDF-Export für Dokumentation und Präsentationen" },
      { title: "Drag & Drop", description: "Einfache Anpassung der Struktur" },
      { title: "Stellvertretungen", description: "Klare Darstellung von Vertretungsregelungen" },
    ],
    features: [
      {
        title: "Automatisches Layout",
        description: "Intelligente Anordnung für optimale Übersichtlichkeit",
        iconName: "Network",
      },
      {
        title: "Mitarbeiterdetails",
        description: "Direkte Verlinkung zu Profilen und Kontaktdaten",
        iconName: "Users",
      },
      {
        title: "Teamansichten",
        description: "Gruppierung nach Abteilungen oder Funktionen",
        iconName: "Layers",
      },
      {
        title: "Historische Ansichten",
        description: "Nachvollziehbare Entwicklung der Organisationsstruktur",
        iconName: "Clock",
      },
    ],
    useCases: [
      {
        title: "Einarbeitung",
        description: "Neue Mitarbeiter erhalten einen schnellen Überblick über die Praxisstruktur.",
      },
      {
        title: "Praxisbegehung",
        description: "Präsentieren Sie Ihre Organisationsstruktur professionell.",
      },
      {
        title: "Umstrukturierung",
        description: "Planen Sie Änderungen visuell und kommunizieren Sie sie klar.",
      },
    ],
    faq: [
      {
        question: "Kann ich das Organigramm manuell anpassen?",
        answer: "Ja, Sie können Positionen per Drag & Drop verschieben und die Darstellung individuell gestalten.",
      },
      {
        question: "Werden Änderungen automatisch übernommen?",
        answer: "Ja, bei Personaländerungen aktualisiert sich das Organigramm automatisch.",
      },
      {
        question: "Kann ich mehrere Standorte darstellen?",
        answer: "Ja, Sie können das Organigramm nach Standorten filtern oder alle Standorte gemeinsam anzeigen.",
      },
    ],
    relatedFeatureSlugs: ["team-management", "zustaendigkeiten", "onboarding"],
    metaTitle: "Organigramm | Interaktive Praxisstruktur-Visualisierung",
    metaDescription:
      "Visualisieren Sie die Struktur Ihrer Praxis mit einem interaktiven Organigramm. Automatisch aktuell, mit Mitarbeiterdetails und Export-Optionen.",
  },
  {
    slug: "kalender",
    title: "Kalender",
    subtitle: "Termine, Urlaub und Ressourcen im Überblick",
    description:
      "Der zentrale Kalender vereint alle Termine, Abwesenheiten und Ressourcenbelegungen. Behalten Sie den Überblick und vermeiden Sie Planungskonflikte.",
    detailedDescription: {
      intro:
        "Ein gut organisierter Kalender ist das Nervenzentrum jeder Praxis. Unser Kalendermodul geht weit über einfache Terminplanung hinaus: Es integriert Patiententermine, Teamabwesenheiten, Ressourcenbelegungen und Fristen in einer übersichtlichen Ansicht. Konflikte werden automatisch erkannt, Erinnerungen sorgen dafür, dass nichts vergessen wird.",
      howItWorks:
        "Der Kalender aggregiert Daten aus verschiedenen Quellen: Patiententermine aus Ihrem PVS, Urlaube aus dem Team-Management, Fortbildungstermine und persönliche Einträge. Verschiedene Ansichten (Tag, Woche, Monat) und Filter ermöglichen den perfekten Überblick. Bei der Planung warnt das System vor Konflikten wie doppelten Buchungen oder Abwesenheiten. Wiederkehrende Termine werden automatisch angelegt, Erinnerungen per E-Mail oder Push-Nachricht versendet.",
      whyItHelps:
        "In vielen Praxen existieren mehrere Kalender nebeneinander, was zu Planungsfehlern und Doppelbuchungen führt. Unser zentraler Kalender schafft eine single source of truth. Sie sparen Zeit bei der Planung, vermeiden peinliche Terminüberschneidungen und haben jederzeit den Überblick über die Auslastung Ihrer Praxis und Ihres Teams.",
    },
    iconName: "Calendar",
    color: "bg-blue-500/10 text-blue-600",
    heroImage: "/calendar-scheduling-planning-blue-modern-dashboard.jpg",
    benefits: [
      { title: "Zentrale Übersicht", description: "Alle Termine und Abwesenheiten an einem Ort" },
      { title: "Konfliktwarnung", description: "Automatische Erkennung von Terminüberschneidungen" },
      { title: "Ressourcenplanung", description: "Räume und Geräte effizient buchen" },
      { title: "Erinnerungen", description: "Automatische Benachrichtigungen vor wichtigen Terminen" },
      { title: "Team-Kalender", description: "Sehen Sie die Verfügbarkeit aller Teammitglieder" },
      { title: "Feiertage", description: "Automatische Berücksichtigung von Feiertagen" },
    ],
    features: [
      {
        title: "Multi-Kalender",
        description: "Verschiedene Kalender in einer Ansicht zusammenführen",
        iconName: "Calendar",
      },
      {
        title: "Ressourcenbuchung",
        description: "Reservierung von Räumen und Geräten",
        iconName: "Package",
      },
      {
        title: "Erinnerungssystem",
        description: "Flexible Benachrichtigungen per E-Mail oder App",
        iconName: "Bell",
      },
      {
        title: "Freigaben",
        description: "Kalender mit Teammitgliedern oder extern teilen",
        iconName: "Users",
      },
    ],
    useCases: [
      {
        title: "Tagesplanung",
        description: "Starten Sie jeden Tag mit einem klaren Überblick über anstehende Termine.",
      },
      {
        title: "Urlaubsplanung",
        description: "Prüfen Sie Verfügbarkeiten bevor Sie Urlaub genehmigen.",
      },
      {
        title: "Raumplanung",
        description: "Koordinieren Sie die Nutzung von Behandlungsräumen und Geräten.",
      },
    ],
    faq: [
      {
        question: "Kann ich den Kalender mit Outlook synchronisieren?",
        answer: "Ja, Sie können Kalender per iCal-Feed exportieren und in anderen Anwendungen einbinden.",
      },
      {
        question: "Wer kann meinen Kalender sehen?",
        answer: "Sie bestimmen die Freigaben. Kollegen können Verfügbarkeit sehen, Details nur wenn freigegeben.",
      },
      {
        question: "Werden Feiertage automatisch angezeigt?",
        answer: "Ja, Feiertage werden basierend auf Ihrem Bundesland automatisch im Kalender angezeigt.",
      },
    ],
    relatedFeatureSlugs: ["team-management", "aufgaben", "ressourcen"],
    metaTitle: "Kalender | Terminplanung & Ressourcenmanagement für Arztpraxen",
    metaDescription:
      "Der zentrale Kalender für Ihre Praxis: Termine, Abwesenheiten und Ressourcen im Überblick mit automatischer Konfliktwarnung.",
  },
  {
    slug: "aufgaben",
    title: "Aufgaben",
    subtitle: "Aufgabenmanagement für Ihr Praxisteam",
    description:
      "Organisieren Sie Aufgaben effizient und behalten Sie den Überblick. Von einfachen To-dos bis zu komplexen Projekten – alles zentral verwaltet.",
    detailedDescription: {
      intro:
        "Im hektischen Praxisalltag gehen Aufgaben schnell unter oder werden vergessen. Unser Aufgabenmanagement sorgt dafür, dass nichts mehr durchrutscht. Ob wiederkehrende Routineaufgaben, einmalige To-dos oder komplexe Projekte – alles wird zentral erfasst, zugewiesen und nachverfolgt. Das Team weiß immer, was zu tun ist und wer wofür verantwortlich ist.",
      howItWorks:
        "Aufgaben können schnell erstellt und Teammitgliedern zugewiesen werden. Jede Aufgabe hat einen Titel, optional eine Beschreibung, Fälligkeit, Priorität und Kategorie. Wiederkehrende Aufgaben werden automatisch neu erstellt. Das Dashboard zeigt jedem Mitarbeiter seine offenen Aufgaben, priorisiert nach Dringlichkeit. Projektaufgaben können in Unterpunkte gegliedert werden. Bei Fristüberschreitung erfolgen automatische Erinnerungen.",
      whyItHelps:
        "Klare Aufgabenzuweisung reduziert Missverständnisse und verhindert, dass Dinge liegen bleiben. Das Team arbeitet eigenverantwortlicher, weil jeder seinen Aufgabenbereich kennt. Sie als Praxisleitung haben den Überblick über offene Aufgaben und können Engpässe frühzeitig erkennen. Die Dokumentation erledigter Aufgaben ist zudem wertvoll für QM-Nachweise.",
    },
    iconName: "CheckSquare",
    color: "bg-green-500/10 text-green-600",
    heroImage: "/tasks-todo-checklist-green-modern-dashboard.jpg",
    benefits: [
      { title: "Übersichtliches Dashboard", description: "Alle Aufgaben auf einen Blick" },
      { title: "Flexible Zuweisung", description: "Aufgaben an Personen oder Teams delegieren" },
      { title: "Priorisierung", description: "Wichtiges von Unwichtigem unterscheiden" },
      { title: "Wiederkehrende Aufgaben", description: "Routineaufgaben automatisch anlegen" },
      { title: "Fristenmanagement", description: "Nie wieder Deadlines verpassen" },
      { title: "Projektunterstützung", description: "Komplexe Vorhaben in Teilaufgaben gliedern" },
    ],
    features: [
      {
        title: "Kanban-Board",
        description: "Visuelle Aufgabenverwaltung mit Drag & Drop",
        iconName: "Workflow",
      },
      {
        title: "Fälligkeitsanzeige",
        description: "Übersicht über anstehende und überfällige Aufgaben",
        iconName: "Clock",
      },
      {
        title: "Kategorien & Tags",
        description: "Flexible Strukturierung nach Ihren Bedürfnissen",
        iconName: "FolderOpen",
      },
      {
        title: "Kommentare",
        description: "Kommunikation direkt an der Aufgabe",
        iconName: "FileText",
      },
    ],
    useCases: [
      {
        title: "Tägliche Routinen",
        description: "Automatisieren Sie wiederkehrende Aufgaben wie Bestellungen oder Checks.",
      },
      {
        title: "Projektarbeit",
        description: "Gliedern Sie größere Vorhaben in überschaubare Teilaufgaben.",
      },
      {
        title: "Delegation",
        description: "Weisen Sie Aufgaben klar zu und verfolgen Sie den Fortschritt.",
      },
    ],
    faq: [
      {
        question: "Kann ich Aufgaben an mehrere Personen zuweisen?",
        answer: "Ja, Aufgaben können einer Person, mehreren Personen oder einem Team zugewiesen werden.",
      },
      {
        question: "Wie funktionieren wiederkehrende Aufgaben?",
        answer:
          "Sie definieren den Rhythmus (täglich, wöchentlich, monatlich), und das System erstellt die Aufgaben automatisch.",
      },
      {
        question: "Kann ich Aufgaben mit dem Kalender verknüpfen?",
        answer: "Ja, Aufgaben mit Fälligkeit erscheinen optional auch im Kalender.",
      },
    ],
    relatedFeatureSlugs: ["workflows-checklisten", "zustaendigkeiten", "kalender"],
    metaTitle: "Aufgaben | Aufgabenmanagement für Arztpraxen",
    metaDescription:
      "Effizientes Aufgabenmanagement für Ihre Praxis: To-dos organisieren, delegieren und nachverfolgen. Mit Kanban-Board und automatischen Erinnerungen.",
  },
  {
    slug: "ziele",
    title: "Ziele",
    subtitle: "Praxis- und Teamziele definieren und verfolgen",
    description:
      "Setzen Sie klare Ziele für Ihre Praxis und Ihr Team. Verfolgen Sie den Fortschritt und feiern Sie gemeinsam erreichte Meilensteine.",
    detailedDescription: {
      intro:
        "Ohne klare Ziele fehlt die Richtung. Unser Zielmanagement hilft Ihnen, messbare Ziele für Ihre Praxis und Ihr Team zu definieren und systematisch zu verfolgen. Ob Umsatzziele, Qualitätskennzahlen oder Entwicklungsziele für Mitarbeiter – alles wird transparent dokumentiert und regelmäßig überprüft.",
      howItWorks:
        "Ziele werden nach dem SMART-Prinzip definiert: spezifisch, messbar, erreichbar, relevant und terminiert. Sie können Praxisziele, Teamziele und individuelle Ziele anlegen. Für jedes Ziel werden Key Results definiert, die den Fortschritt messbar machen. Das Dashboard zeigt den aktuellen Stand aller Ziele. Regelmäßige Check-ins (wöchentlich oder monatlich) halten alle auf Kurs. Bei Abweichungen werden automatisch Warnungen generiert.",
      whyItHelps:
        "Ziele geben Orientierung und motivieren. Wenn das Team weiß, worauf es hinarbeitet, steigt die Motivation und der Zusammenhalt. Transparenz über Fortschritte schafft Erfolgserlebnisse und ermöglicht frühzeitiges Gegensteuern bei Problemen. Für Sie als Praxisleitung ist das Zielsystem ein wichtiges Führungsinstrument, das strategisches Denken in konkrete Aktionen übersetzt.",
    },
    iconName: "Target",
    color: "bg-amber-500/10 text-amber-600",
    heroImage: "/goals-dashboard-with-progress-bars-and-okr-trackin.jpg",
    benefits: [
      { title: "SMART-Ziele", description: "Strukturierte Zieldefinition nach bewährter Methodik" },
      { title: "Fortschrittstracking", description: "Visualisierung des Zielerreichungsgrads" },
      { title: "Team-Alignment", description: "Gemeinsame Ziele für besseren Zusammenhalt" },
      { title: "Key Results", description: "Messbare Ergebnisse für jedes Ziel" },
      { title: "Regelmäßige Check-ins", description: "Strukturierte Überprüfung des Fortschritts" },
      { title: "Zielhierarchie", description: "Von Praxiszielen zu individuellen Zielen" },
    ],
    features: [
      {
        title: "Ziel-Dashboard",
        description: "Übersicht aller Ziele mit Fortschrittsanzeige",
        iconName: "Target",
      },
      {
        title: "OKR-Framework",
        description: "Objectives und Key Results für klare Messbarkeit",
        iconName: "BarChart3",
      },
      {
        title: "Check-in-System",
        description: "Regelmäßige Updates und Reflexion",
        iconName: "CheckSquare",
      },
      {
        title: "Meilensteine",
        description: "Zwischenziele für große Vorhaben",
        iconName: "Pin",
      },
    ],
    useCases: [
      {
        title: "Jahresplanung",
        description: "Definieren Sie strategische Ziele für das kommende Jahr.",
      },
      {
        title: "Mitarbeiterentwicklung",
        description: "Setzen Sie individuelle Entwicklungsziele in Mitarbeitergesprächen.",
      },
      {
        title: "Qualitätsmanagement",
        description: "Verankern Sie QM-Ziele im täglichen Arbeiten.",
      },
    ],
    faq: [
      {
        question: "Wie oft sollten Ziele überprüft werden?",
        answer: "Wir empfehlen wöchentliche kurze Check-ins und monatliche ausführliche Reviews.",
      },
      {
        question: "Können Mitarbeiter eigene Ziele setzen?",
        answer: "Ja, Mitarbeiter können Zielvorschläge machen, die dann mit dem Vorgesetzten abgestimmt werden.",
      },
      {
        question: "Wie werden Ziele mit der Praxisstrategie verknüpft?",
        answer:
          "Sie können Ziele hierarchisch anordnen, sodass individuelle Ziele zu Teamzielen und diese zu Praxiszielen beitragen.",
      },
    ],
    relatedFeatureSlugs: ["aufgaben", "strategiepfad", "praxis-auswertung"],
    metaTitle: "Ziele | Zielmanagement & OKRs für Arztpraxen",
    metaDescription:
      "Definieren und verfolgen Sie Praxis- und Teamziele systematisch. Mit OKR-Framework, Fortschrittstracking und regelmäßigen Check-ins.",
  },
  {
    slug: "workflows-checklisten",
    title: "Workflows",
    subtitle: "Prozesse standardisieren und automatisieren",
    description:
      "Definieren Sie klare Arbeitsabläufe und Checklisten für wiederkehrende Prozesse. Reduzieren Sie Fehler und steigern Sie die Effizienz durch standardisierte Workflows.",
    detailedDescription: {
      intro:
        "In jeder Praxis gibt es Prozesse, die immer wieder durchlaufen werden: Patientenaufnahme, Abrechnung, Geräteprüfung, Einarbeitung neuer Mitarbeiter. Unser Workflow-System hilft Ihnen, diese Prozesse zu standardisieren und zu optimieren. Das Ergebnis: weniger Fehler, höhere Qualität und mehr Zeit für das Wesentliche.",
      howItWorks:
        "Im Workflow-Editor definieren Sie Prozesse Schritt für Schritt. Jeder Schritt kann Anweisungen, Checklisten, Dokumente und Zuständigkeiten enthalten. Bei der Ausführung führt das System den Nutzer durch den Prozess und dokumentiert jeden abgeschlossenen Schritt. Bedingte Verzweigungen ermöglichen komplexe Entscheidungslogiken. Automatische Trigger können Workflows bei bestimmten Ereignissen starten.",
      whyItHelps:
        "Standardisierte Prozesse sind die Grundlage für konstante Qualität. Neue Mitarbeiter können Prozesse sofort korrekt ausführen, weil sie Schritt für Schritt angeleitet werden. Erfahrene Mitarbeiter machen weniger Flüchtigkeitsfehler. Für das Qualitätsmanagement ist die lückenlose Dokumentation Gold wert. Und Sie als Praxisleitung können sicher sein, dass wichtige Prozesse immer gleich ablaufen.",
    },
    iconName: "Workflow",
    color: "bg-purple-500/10 text-purple-600",
    heroImage: "/workflow-automation-checklist-tasks-purple-modern.jpg",
    benefits: [
      { title: "Prozessstandardisierung", description: "Einheitliche Abläufe für konstante Qualität" },
      { title: "Fehlervermeidung", description: "Checklisten verhindern das Vergessen wichtiger Schritte" },
      { title: "Einarbeitung", description: "Neue Mitarbeiter können Prozesse sofort korrekt ausführen" },
      { title: "Dokumentation", description: "Lückenlose Nachverfolgung aller Prozessdurchläufe" },
      { title: "Optimierung", description: "Identifizieren Sie Verbesserungspotenziale in Ihren Prozessen" },
      { title: "Automatisierung", description: "Reduzieren Sie manuellen Aufwand durch Trigger und Aktionen" },
    ],
    features: [
      {
        title: "Workflow-Builder",
        description: "Erstellen Sie mehrstufige Prozesse mit Bedingungen",
        iconName: "Workflow",
      },
      { title: "Checklisten", description: "Einfache Listen für standardisierte Abläufe", iconName: "CheckSquare" },
      { title: "Vorlagen", description: "Nutzen Sie vorgefertigte oder eigene Vorlagen", iconName: "FileText" },
      {
        title: "Automatische Trigger",
        description: "Starten Sie Workflows automatisch bei Ereignissen",
        iconName: "Zap",
      },
    ],
    useCases: [
      { title: "Onboarding", description: "Standardisierte Einarbeitung neuer Mitarbeiter." },
      { title: "Quartalsabschluss", description: "Checkliste für wiederkehrende Quartalsaufgaben." },
      { title: "Gerätewartung", description: "Regelmäßige Wartungschecklisten für medizinische Geräte." },
    ],
    relatedFeatureSlugs: ["aufgaben", "zustaendigkeiten", "wissen-qm"],
    metaTitle: "Workflows | Prozessmanagement für Arztpraxen",
    metaDescription:
      "Standardisieren und automatisieren Sie Praxisabläufe mit Workflows und Checklisten. Für konstante Qualität und weniger Fehler.",
  },
  {
    slug: "zustaendigkeiten",
    title: "Zuständigkeiten",
    subtitle: "Klare Verantwortlichkeiten definieren",
    description:
      "Legen Sie fest, wer für welche Bereiche verantwortlich ist. Klare Zuständigkeiten reduzieren Missverständnisse und steigern die Effizienz.",
    detailedDescription: {
      intro:
        "Ich dachte, du machst das! – dieser Satz kostet in vielen Praxen Zeit und Nerven. Unser Zuständigkeitsmodul schafft Klarheit: Für jeden Bereich, jede Aufgabe und jeden Prozess ist definiert, wer verantwortlich ist, wer informiert werden muss und wer als Vertretung einspringt.",
      howItWorks:
        "Sie definieren Zuständigkeitsbereiche und weisen Personen zu. Für jeden Bereich können Sie einen Hauptverantwortlichen, Stellvertreter und zu informierende Personen festlegen (RACI-Matrix). Die Zuständigkeiten sind mit dem Organigramm und dem Aufgabensystem verknüpft. Bei Abwesenheit des Hauptverantwortlichen greifen automatisch die Vertretungsregelungen. Eine zentrale Übersicht zeigt alle Zuständigkeiten und hilft bei der Suche nach dem richtigen Ansprechpartner.",
      whyItHelps:
        "Klare Zuständigkeiten sind die Basis für effiziente Zusammenarbeit. Jeder weiß, wofür er verantwortlich ist und wen er bei Fragen ansprechen kann. Konflikte durch unklare Verantwortlichkeiten werden vermieden. Bei der Einarbeitung neuer Mitarbeiter ist sofort klar, welche Bereiche sie übernehmen. Und wenn jemand ausfällt, greifen die Vertretungsregelungen automatisch.",
    },
    iconName: "ClipboardList",
    color: "bg-indigo-500/10 text-indigo-600",
    heroImage: "/responsibilities-assignments-indigo-modern-dashboa.jpg",
    benefits: [
      { title: "RACI-Matrix", description: "Klare Zuweisung von Verantwortlichkeiten" },
      { title: "Vertretungsregelungen", description: "Automatische Stellvertreter bei Abwesenheit" },
      { title: "Zentrale Übersicht", description: "Alle Zuständigkeiten auf einen Blick" },
      { title: "Suche nach Ansprechpartner", description: "Schnell den richtigen Kontakt finden" },
      { title: "Integration", description: "Verknüpfung mit Organigramm und Aufgaben" },
      { title: "Historisierung", description: "Nachvollziehbare Änderungen über Zeit" },
    ],
    features: [
      {
        title: "Zuständigkeitsmatrix",
        description: "Übersichtliche Darstellung aller Verantwortlichkeiten",
        iconName: "ClipboardList",
      },
      {
        title: "Vertretungssystem",
        description: "Automatische Aktivierung bei Abwesenheit",
        iconName: "Users",
      },
      {
        title: "Bereichsverwaltung",
        description: "Flexible Definition von Zuständigkeitsbereichen",
        iconName: "Layers",
      },
      {
        title: "Ansprechpartner-Suche",
        description: "Schnelles Finden des richtigen Kontakts",
        iconName: "Search",
      },
    ],
    useCases: [
      {
        title: "Praxisorganisation",
        description: "Definieren Sie klare Verantwortlichkeiten für alle Bereiche.",
      },
      {
        title: "Urlaubsvertretung",
        description: "Stellen Sie sicher, dass bei Abwesenheit alles geregelt ist.",
      },
      {
        title: "Neue Mitarbeiter",
        description: "Weisen Sie Verantwortlichkeiten bei Einstellung klar zu.",
      },
    ],
    faq: [
      {
        question: "Was ist eine RACI-Matrix?",
        answer:
          "RACI steht für Responsible (verantwortlich), Accountable (rechenschaftspflichtig), Consulted (zu befragen) und Informed (zu informieren).",
      },
      {
        question: "Wie werden Vertretungen aktiviert?",
        answer:
          "Bei Abwesenheiten (Urlaub, Krankheit) werden die definierten Stellvertreter automatisch informiert und übernehmen.",
      },
    ],
    relatedFeatureSlugs: ["organigramm", "team-management", "aufgaben"],
    metaTitle: "Zuständigkeiten | Verantwortlichkeiten in der Arztpraxis",
    metaDescription:
      "Legen Sie Verantwortlichkeiten in Ihrer Praxis klar fest. Mit RACI-Matrix, Vertretungsregelungen und zentraler Übersicht.",
  },
  {
    slug: "wissen-qm",
    title: "Wissen & QM",
    subtitle: "Wissensdatenbank und Qualitätsmanagement",
    description:
      "Bauen Sie eine zentrale Wissensdatenbank auf und dokumentieren Sie Ihr Qualitätsmanagement. Alle SOPs, Anleitungen und QM-Dokumente an einem Ort.",
    detailedDescription: {
      intro:
        "Wissen ist die wertvollste Ressource Ihrer Praxis – aber nur, wenn es zugänglich und aktuell ist. Unser Wissensmodul kombiniert eine intelligente Wissensdatenbank mit umfassendem Qualitätsmanagement. SOPs, Behandlungsleitlinien, Geräteanleitungen und QM-Dokumente sind zentral verfügbar, durchsuchbar und immer auf dem neuesten Stand.",
      howItWorks:
        "In der Wissensdatenbank legen Sie Artikel, Anleitungen und Dokumente ab. Die intelligente Suche findet Inhalte nach Stichworten, Kategorien oder Tags. Für das QM definieren Sie Dokumente, Freigabeprozesse und Revisionszyklen. Das System erinnert automatisch an fällige Überprüfungen. Änderungen werden versioniert, sodass Sie jederzeit auf frühere Versionen zugreifen können. Mitarbeiter bestätigen die Kenntnisnahme wichtiger Dokumente.",
      whyItHelps:
        "Strukturiertes Wissensmanagement macht Ihre Praxis unabhängiger von einzelnen Köpfen. Wenn erfahrene Mitarbeiter gehen oder ausfallen, ist das Wissen nicht verloren. Neue Mitarbeiter finden schnell die Informationen, die sie brauchen. Für das Qualitätsmanagement haben Sie alle Dokumente prüfungsbereit. Bei Zertifizierungen oder Praxisbegehungen beeindrucken Sie mit professioneller Dokumentation.",
    },
    iconName: "BookOpen",
    color: "bg-pink-500/10 text-pink-600",
    heroImage: "/knowledge-management-documents-library-pink-modern.jpg",
    benefits: [
      { title: "Zentrale Wissensdatenbank", description: "Alle Informationen an einem Ort" },
      { title: "Intelligente Suche", description: "Schnell die richtigen Informationen finden" },
      { title: "QM-Dokumentation", description: "Alle qualitätsrelevanten Dokumente verwalten" },
      { title: "Versionierung", description: "Änderungen nachvollziehen und alte Versionen abrufen" },
      { title: "Freigabeprozesse", description: "Strukturierte Freigabe und Kenntnisnahme" },
      { title: "Erinnerungen", description: "Automatische Hinweise auf fällige Revisionen" },
    ],
    features: [
      { title: "Dokumenten-Bibliothek", description: "Strukturierte Ablage aller QM-Dokumente", iconName: "BookOpen" },
      { title: "KI-Suche", description: "Intelligente Suche über alle Inhalte", iconName: "Search" },
      { title: "Freigabe-Workflow", description: "Definierte Freigabeprozesse für Dokumente", iconName: "Shield" },
      {
        title: "Lesepflicht",
        description: "Stellen Sie sicher, dass Mitarbeiter Dokumente gelesen haben",
        iconName: "CheckSquare",
      },
    ],
    useCases: [
      { title: "QM-Handbuch", description: "Pflegen Sie Ihr digitales Qualitätsmanagement-Handbuch." },
      { title: "Arbeitsanweisungen", description: "Erstellen und verteilen Sie standardisierte Anleitungen." },
      { title: "Schulungen", description: "Stellen Sie Schulungsmaterial für das Team bereit." },
    ],
    relatedFeatureSlugs: ["dokumente", "workflows-checklisten", "praxis-journal"],
    metaTitle: "Wissen & QM | Wissensdatenbank für Arztpraxen",
    metaDescription:
      "Zentrale Wissensdatenbank und QM-Dokumentation für Ihre Praxis. SOPs, Anleitungen und Qualitätsdokumente an einem Ort.",
  },
  {
    slug: "dokumente",
    title: "Dokumente",
    subtitle: "Dokumentenmanagement mit Versionierung",
    description:
      "Verwalten Sie alle Praxisdokumente zentral mit automatischer Versionierung, Zugriffsrechten und intelligenter Suche.",
    detailedDescription: {
      intro:
        "Dokumente sind das Gedächtnis Ihrer Praxis – von Verträgen über Abrechnungen bis hin zu Anleitungen. Unser Dokumentenmanagement sorgt dafür, dass alle wichtigen Unterlagen sicher, organisiert und leicht zugänglich sind. Versionierung und Zugriffsrechte gewährleisten Sicherheit und Nachvollziehbarkeit.",
      howItWorks:
        "Laden Sie Dokumente hoch und organisieren Sie sie in Ordnern. Jede Änderung wird automatisch versioniert, sodass Sie frühere Versionen jederzeit einsehen können. Legen Sie Zugriffsrechte fest, um sicherzustellen, dass nur berechtigte Personen bestimmte Dokumente sehen oder bearbeiten können. Die intelligente Suche hilft Ihnen, jedes Dokument schnell zu finden.",
      whyItHelps:
        "Chaos im Dokumentenmanagement kostet Zeit und Nerven. Mit unserem System haben Sie stets den Überblick. Sie sparen sich die Suche nach der aktuellsten Version und haben die Gewissheit, dass sensible Daten geschützt sind. Bei Audits oder Anfragen sind alle Unterlagen sofort verfügbar.",
    },
    iconName: "FolderOpen",
    color: "bg-slate-500/10 text-slate-600",
    heroImage: "/documents-files-folder-slate-modern-dashboard.jpg",
    benefits: [
      { title: "Zentrale Ablage", description: "Alle Dokumente sicher an einem Ort" },
      { title: "Versionierung", description: "Automatische Versionsverwaltung" },
      { title: "Zugriffsrechte", description: "Kontrollieren Sie, wer was sehen darf" },
      { title: "Suche", description: "Finden Sie Dokumente schnell" },
      { title: "Kategorien", description: "Strukturieren Sie nach Ordnern und Tags" },
      { title: "Preview", description: "Dokumente direkt im Browser ansehen" },
    ],
    features: [
      {
        title: "Ordnerstruktur",
        description: "Organisieren Sie Dokumente in Ordnern und Unterordnern",
        iconName: "FolderOpen",
      },
      { title: "Upload & Download", description: "Einfaches Hochladen und Herunterladen", iconName: "FileText" },
      {
        title: "Versionshistorie",
        description: "Sehen Sie alle früheren Versionen eines Dokuments",
        iconName: "Clock",
      },
      { title: "Freigaben", description: "Teilen Sie Dokumente mit externen Partnern", iconName: "Users" },
    ],
    relatedFeatureSlugs: ["wissen-qm", "gespraechsprotokoll", "fortbildung"],
    metaTitle: "Dokumente | Dokumentenmanagement für Arztpraxen",
    metaDescription:
      "Zentrales Dokumentenmanagement mit Versionierung, Zugriffsrechten und intelligenter Suche für Ihre Praxis.",
  },
  {
    slug: "gespraechsprotokoll",
    title: "Gesprächsprotokoll",
    subtitle: "Meetings dokumentieren mit KI-Zusammenfassung",
    description:
      "Dokumentieren Sie Besprechungen effizient und nachvollziehbar. Die KI erstellt automatisch strukturierte Zusammenfassungen und identifiziert Action Items.",
    detailedDescription: {
      intro:
        "Meetings sind wichtig für Abstimmung und Entscheidungsfindung – aber was nützen sie, wenn hinterher niemand mehr weiß, was besprochen wurde? Unser Gesprächsprotokoll-Modul sorgt für lückenlose Dokumentation. Die KI-gestützte Zusammenfassung extrahiert die Kernpunkte und identifiziert automatisch Aufgaben und Verantwortlichkeiten.",
      howItWorks:
        "Während des Meetings können Sie Notizen machen oder direkt diktieren. Nach dem Meeting analysiert die KI Ihre Eingaben und erstellt ein strukturiertes Protokoll mit Themenübersicht, besprochenen Punkten, Entscheidungen und Action Items. Die Action Items können direkt in Aufgaben umgewandelt und den entsprechenden Personen zugewiesen werden. Alle Protokolle werden archiviert und sind durchsuchbar.",
      whyItHelps:
        "Effektive Meetings brauchen gute Dokumentation. Mit unserem System sparen Sie Zeit bei der Protokollerstellung und stellen sicher, dass nichts vergessen wird. Die automatische Aufgabenextraktion sorgt dafür, dass aus Worten Taten werden. Für Teammitglieder, die nicht dabei waren, bieten die Protokolle einen schnellen Überblick über Besprochenes.",
    },
    iconName: "Mic",
    color: "bg-red-500/10 text-red-600",
    heroImage: "/meeting-protocol-recording-red-modern-dashboard.jpg",
    benefits: [
      { title: "KI-Zusammenfassung", description: "Automatische Strukturierung und Extraktion" },
      { title: "Action Item Tracking", description: "Aufgaben direkt aus dem Meeting erstellen" },
      { title: "Diktierfunktion", description: "Spracheingabe für schnelle Notizen" },
      { title: "Teilnehmerverwaltung", description: "Dokumentation von Anwesenden und Abwesenden" },
      { title: "Archiv", description: "Alle Protokolle durchsuchbar aufbewahrt" },
      { title: "Vorlagen", description: "Wiederverwendbare Templates für verschiedene Meeting-Typen" },
    ],
    features: [
      {
        title: "Protokoll-Editor",
        description: "Strukturierter Editor für Meeting-Dokumentation",
        iconName: "FileText",
      },
      {
        title: "KI-Analyse",
        description: "Automatische Zusammenfassung und Aufgaben-Extraktion",
        iconName: "Brain",
      },
      {
        title: "Vorlagen",
        description: "Vorgefertigte Vorlagen für Team-Meetings, 1:1s etc.",
        iconName: "ClipboardList",
      },
      {
        title: "Aufgaben-Integration",
        description: "Erstellte Action Items direkt als Aufgaben anlegen",
        iconName: "CheckSquare",
      },
    ],
    useCases: [
      {
        title: "Teambesprechungen",
        description: "Dokumentieren Sie wöchentliche Meetings und verfolgen Sie Aufgaben.",
      },
      {
        title: "Mitarbeitergespräche",
        description: "Halten Sie Entwicklungsgespräche strukturiert fest.",
      },
      {
        title: "Praxisleitungsmeetings",
        description: "Protokollieren Sie strategische Entscheidungen nachvollziehbar.",
      },
    ],
    faq: [
      {
        question: "Wie funktioniert die Spracheingabe?",
        answer:
          "Sie können während des Meetings diktieren. Die KI transkribiert und strukturiert die Eingabe automatisch.",
      },
      {
        question: "Wer kann Protokolle einsehen?",
        answer: "Sie können für jedes Protokoll definieren, wer Zugriff hat – von privat bis für alle sichtbar.",
      },
      {
        question: "Werden die Action Items nachverfolgt?",
        answer: "Ja, Action Items werden zu Aufgaben und können im Aufgabenmodul verfolgt werden.",
      },
    ],
    relatedFeatureSlugs: ["aufgaben", "kalender", "praxis-journal"],
    metaTitle: "Gesprächsprotokoll | Meeting-Dokumentation mit KI",
    metaDescription:
      "Dokumentieren Sie Meetings effizient mit KI-gestützter Zusammenfassung. Automatische Action Item Extraktion und Aufgabenverfolgung.",
  },
  {
    slug: "kontakte",
    title: "Kontakte",
    subtitle: "Lieferanten, Partner und wichtige Kontakte",
    description:
      "Verwalten Sie alle externen Kontakte Ihrer Praxis zentral. Von Lieferanten über Labore bis zu Kooperationspartnern – alle wichtigen Ansprechpartner an einem Ort.",
    detailedDescription: {
      intro:
        "Jede Praxis hat ein Netzwerk aus Lieferanten, Laboren, Kooperationspartnern und anderen wichtigen Kontakten. Unser Kontaktmodul macht dieses Netzwerk für alle Teammitglieder zugänglich und sorgt dafür, dass wichtige Kontaktinformationen nicht in einzelnen Köpfen oder Notizzetteln verschwinden.",
      howItWorks:
        "Legen Sie Kontakte mit allen relevanten Informationen an: Name, Firma, Kontaktdaten, Kategorie, Notizen und Dokumente. Tags und Kategorien ermöglichen eine flexible Strukturierung. Die Suche findet Kontakte nach Namen, Firma oder Kategorien. Verknüpfungen zeigen, welche Bestellungen, Verträge oder Kommunikation mit einem Kontakt verbunden sind. Für wichtige Kontakte können Erinnerungen gesetzt werden.",
      whyItHelps:
        "Wenn der eine Mitarbeiter, der die Telefonnummer des Servicetechnikers hat, gerade nicht da ist, kann das zum Problem werden. Mit dem zentralen Kontaktmanagement hat jeder Zugriff auf alle relevanten Kontakte. Die Verknüpfung mit Bestellungen und Verträgen gibt zusätzlichen Kontext. Und wenn ein Mitarbeiter die Praxis verlässt, bleiben alle Kontakte erhalten.",
    },
    iconName: "Phone",
    color: "bg-gray-500/10 text-gray-600",
    heroImage: "/contacts-address-book-gray-modern-dashboard.jpg",
    benefits: [
      { title: "Zentrale Datenbank", description: "Alle Kontakte an einem Ort" },
      { title: "Kategorisierung", description: "Flexible Strukturierung nach Ihren Bedürfnissen" },
      { title: "Verknüpfungen", description: "Verbindung zu Bestellungen, Verträgen und Kommunikation" },
      { title: "Team-Zugriff", description: "Alle Mitarbeiter haben Zugang zu relevanten Kontakten" },
      { title: "Notizen & Dokumente", description: "Zusätzliche Informationen an Kontakten hinterlegen" },
      { title: "Import/Export", description: "Kontakte aus anderen Systemen übernehmen" },
    ],
    features: [
      {
        title: "Kontaktverwaltung",
        description: "Umfassende Profile für alle externen Kontakte",
        iconName: "Users",
      },
      {
        title: "Kategorien & Tags",
        description: "Flexible Strukturierung für schnelles Finden",
        iconName: "FolderOpen",
      },
      {
        title: "Verknüpfungssystem",
        description: "Verbindung zu anderen Modulen und Dokumenten",
        iconName: "Network",
      },
      {
        title: "Kommunikationshistorie",
        description: "Dokumentation der Interaktionen mit Kontakten",
        iconName: "FileText",
      },
    ],
    useCases: [
      {
        title: "Lieferantenverwaltung",
        description: "Alle Lieferanten mit Konditionen und Ansprechpartnern an einem Ort.",
      },
      {
        title: "Kooperationspartner",
        description: "Halten Sie Kontaktdaten von Überweisern und Partnern aktuell.",
      },
      {
        title: "Dienstleister",
        description: "Vom IT-Support bis zum Reinigungsdienst – alle Kontakte griffbereit.",
      },
    ],
    faq: [
      {
        question: "Kann ich Kontakte importieren?",
        answer: "Ja, Sie können Kontakte per CSV importieren oder aus gängigen Kontaktverwaltungen übernehmen.",
      },
      {
        question: "Wer kann Kontakte sehen und bearbeiten?",
        answer: "Über Berechtigungen steuern Sie, wer welche Kontaktkategorien sehen und bearbeiten kann.",
      },
      {
        question: "Werden Duplikate erkannt?",
        answer: "Ja, das System warnt bei potenziellen Duplikaten und ermöglicht das Zusammenführen.",
      },
    ],
    relatedFeatureSlugs: ["ressourcen", "wissen-qm", "team-management"],
    metaTitle: "Kontakte | Kontaktverwaltung für Arztpraxen",
    metaDescription:
      "Verwalten Sie alle externen Kontakte Ihrer Praxis zentral. Lieferanten, Partner und Dienstleister an einem Ort.",
  },
  {
    slug: "strategiepfad",
    title: "Strategiepfad",
    subtitle: "Praxisentwicklung strategisch planen",
    description:
      "Entwickeln Sie eine klare Vision für Ihre Praxis und planen Sie die Schritte dorthin. Der Strategiepfad begleitet Sie von der Analyse bis zur Umsetzung.",
    detailedDescription: {
      intro:
        "Eine Praxis ohne Strategie ist wie ein Schiff ohne Kompass. Der Strategiepfad ist Ihr Navigationssystem für die langfristige Praxisentwicklung. Er führt Sie durch einen strukturierten Prozess von der Standortbestimmung über die Zieldefinition bis zur konkreten Maßnahmenplanung und begleitet Sie bei der Umsetzung.",
      howItWorks:
        "Der Strategiepfad beginnt mit einer Analyse: Wo steht Ihre Praxis heute? Welche Stärken und Schwächen hat sie? Dann definieren Sie Ihre Vision: Wo wollen Sie in 3-5 Jahren stehen? Daraus leiten Sie strategische Ziele ab, die in konkrete Maßnahmen übersetzt werden. Das System verknüpft diese Maßnahmen mit dem Zielmodul und den Aufgaben. Regelmäßige Strategy Reviews halten Sie auf Kurs.",
      whyItHelps:
        "Strategiearbeit kommt im Tagesgeschäft oft zu kurz. Der Strategiepfad gibt Ihnen einen strukturierten Rahmen und erinnert Sie an wichtige Reviews. Die Verknüpfung mit operativen Tools sorgt dafür, dass aus Strategie konkretes Handeln wird. Und Sie können jederzeit nachvollziehen, wie Ihre Maßnahmen zur übergeordneten Strategie beitragen.",
    },
    iconName: "Map",
    color: "bg-emerald-500/10 text-emerald-600",
    heroImage: "/strategy-roadmap-planning-emerald-green-modern-das.jpg",
    benefits: [
      { title: "Strukturierter Prozess", description: "Von der Analyse bis zur Umsetzung begleitet" },
      { title: "Visions-Workshop", description: "Werkzeuge für die Entwicklung Ihrer Praxisvision" },
      { title: "Strategische Ziele", description: "Langfristige Ziele systematisch definieren" },
      { title: "Maßnahmenplanung", description: "Konkrete Schritte zur Zielerreichung" },
      { title: "Review-System", description: "Regelmäßige Überprüfung des strategischen Fortschritts" },
      { title: "Team-Einbindung", description: "Strategie gemeinsam entwickeln und kommunizieren" },
    ],
    features: [
      {
        title: "Strategische Analyse",
        description: "Werkzeuge für Standortbestimmung und Umfeldanalyse",
        iconName: "Search",
      },
      {
        title: "Vision & Mission",
        description: "Strukturierte Entwicklung von Leitbild und Vision",
        iconName: "Target",
      },
      {
        title: "Roadmap",
        description: "Visuelle Darstellung des strategischen Weges",
        iconName: "Map",
      },
      {
        title: "Strategy Reviews",
        description: "Regelmäßige Check-ins zur Strategieumsetzung",
        iconName: "CheckSquare",
      },
    ],
    useCases: [
      {
        title: "Praxisgründung",
        description: "Entwickeln Sie von Anfang an eine klare strategische Ausrichtung.",
      },
      {
        title: "Neuausrichtung",
        description: "Überdenken Sie Ihre Strategie bei veränderten Rahmenbedingungen.",
      },
      {
        title: "Wachstum",
        description: "Planen Sie Expansion oder neue Leistungsangebote strategisch.",
      },
    ],
    faq: [
      {
        question: "Wie viel Zeit brauche ich für den Strategiepfad?",
        answer:
          "Die initiale Strategieentwicklung dauert typischerweise 2-3 Workshops. Danach sind kurze Reviews wichtig.",
      },
      {
        question: "Kann ich das Team einbinden?",
        answer: "Ja, der Strategiepfad unterstützt kollaborative Strategieentwicklung mit dem gesamten Team.",
      },
      {
        question: "Wie oft sollte die Strategie überprüft werden?",
        answer: "Wir empfehlen quartalsweise Short Reviews und jährlich eine umfassende Strategieüberprüfung.",
      },
    ],
    relatedFeatureSlugs: ["ziele", "leitbild", "ki-praxisanalyse"],
    metaTitle: "Strategiepfad | Strategische Praxisentwicklung",
    metaDescription:
      "Planen Sie die Entwicklung Ihrer Praxis strategisch. Von der Vision über Ziele bis zur konkreten Maßnahmenplanung.",
  },
  {
    slug: "leitbild",
    title: "Leitbild",
    subtitle: "Vision, Mission und Werte definieren",
    description:
      "Entwickeln Sie ein inspirierendes Leitbild für Ihre Praxis. Vision, Mission und Werte geben Orientierung und stärken die Identität Ihres Teams.",
    detailedDescription: {
      intro:
        "Ein starkes Leitbild ist mehr als schöne Worte an der Wand. Es definiert, wofür Ihre Praxis steht, was sie einzigartig macht und wohin die Reise geht. Unser Leitbild-Modul führt Sie durch den Prozess der Entwicklung und hilft Ihnen, Vision, Mission und Werte im Praxisalltag lebendig zu halten.",
      howItWorks:
        "Der Prozess beginnt mit einer strukturierten Reflexion: Was macht Ihre Praxis besonders? Welche Werte sind Ihnen wichtig? Wohin wollen Sie sich entwickeln? Mit interaktiven Workshops und Templates entwickeln Sie Ihre Vision (das große Zukunftsbild), Ihre Mission (der konkrete Auftrag) und Ihre Kernwerte. Das fertige Leitbild kann für verschiedene Zwecke aufbereitet werden: Poster, Website, Mitarbeiterhandbuch. Regelmäßige Reviews stellen sicher, dass das Leitbild lebendig bleibt.",
      whyItHelps:
        "Ein gelebtes Leitbild gibt dem Team Orientierung und Identität. Bei schwierigen Entscheidungen helfen die Werte als Kompass. In der Außendarstellung differenziert ein authentisches Leitbild Sie vom Wettbewerb. Und für Sie als Praxisleitung ist es ein wichtiges Führungsinstrument, das die Kultur Ihrer Praxis prägt.",
    },
    iconName: "Heart",
    color: "bg-rose-500/10 text-rose-600",
    heroImage: "/mission-vision-values-rose-pink-modern-dashboard.jpg",
    benefits: [
      { title: "Strukturierter Prozess", description: "Schritt für Schritt zum Leitbild" },
      { title: "Team-Workshops", description: "Gemeinsame Entwicklung für mehr Buy-in" },
      { title: "Vielseitige Nutzung", description: "Aufbereitung für verschiedene Zwecke" },
      { title: "Wertekompass", description: "Orientierung für tägliche Entscheidungen" },
      { title: "Lebendiges Leitbild", description: "Tools für kontinuierliche Verankerung" },
      { title: "Außenwirkung", description: "Differenzierung durch authentische Werte" },
    ],
    features: [
      {
        title: "Vision-Workshop",
        description: "Geführter Prozess zur Entwicklung Ihrer Praxisvision",
        iconName: "Lightbulb",
      },
      {
        title: "Werte-Definition",
        description: "Strukturierte Identifikation Ihrer Kernwerte",
        iconName: "Heart",
      },
      {
        title: "Leitbild-Generator",
        description: "Templates und Tools für die Formulierung",
        iconName: "FileText",
      },
      {
        title: "Integration",
        description: "Aufbereitung für verschiedene Kommunikationskanäle",
        iconName: "Layers",
      },
    ],
    useCases: [
      {
        title: "Praxisgründung",
        description: "Definieren Sie von Anfang an die DNA Ihrer Praxis.",
      },
      {
        title: "Team-Building",
        description: "Entwickeln Sie gemeinsam mit Ihrem Team ein geteiltes Werteverständnis.",
      },
      {
        title: "Rebranding",
        description: "Überarbeiten Sie Ihr Leitbild bei strategischen Neuausrichtungen.",
      },
    ],
    faq: [
      {
        question: "Wie unterscheiden sich Vision und Mission?",
        answer:
          "Die Vision beschreibt das große Zukunftsbild (wo wollen wir hin?), die Mission den konkreten Auftrag (was tun wir dafür?).",
      },
      {
        question: "Wie lange dauert die Leitbildentwicklung?",
        answer: "Je nach Tiefe 1-3 Workshops à 2-3 Stunden, plus Zeit für die Ausarbeitung.",
      },
      {
        question: "Wie verankere ich das Leitbild im Alltag?",
        answer:
          "Das System bietet regelmäßige Reflexionsprompts und Möglichkeiten, Werte in Entscheidungen einzubinden.",
      },
    ],
    relatedFeatureSlugs: ["strategiepfad", "ziele", "team-management"],
    metaTitle: "Leitbild | Vision, Mission & Werte für Arztpraxen",
    metaDescription:
      "Entwickeln Sie ein inspirierendes Leitbild für Ihre Praxis. Strukturierter Prozess für Vision, Mission und Kernwerte.",
  },
  {
    slug: "igel-roi-analyse",
    title: "IGeL & ROI-Analyse",
    subtitle: "Wirtschaftlichkeitsanalysen mit Szenarien",
    description:
      "Analysieren Sie die Wirtschaftlichkeit Ihrer IGeL-Leistungen und anderer Investitionen. Mit Szenario-Berechnungen treffen Sie fundierte Entscheidungen.",
    detailedDescription: {
      intro:
        "Jede Investition und jedes neue Leistungsangebot sollte wirtschaftlich sinnvoll sein. Unsere IGeL & ROI-Analyse gibt Ihnen die Werkzeuge, um Wirtschaftlichkeit zu berechnen, bevor Sie investieren. Mit Szenario-Analysen können Sie verschiedene Annahmen durchspielen und fundierte Entscheidungen treffen.",
      howItWorks:
        "Für IGeL-Leistungen erfassen Sie alle relevanten Parameter: Materialkosten, Zeitaufwand, geplanter Preis, erwartete Nachfrage. Das System berechnet den Deckungsbeitrag und die Rentabilität. Bei Investitionen (neue Geräte, Räume, Personal) erstellen Sie Business Cases mit ROI-Berechnungen. Die Szenario-Funktion ermöglicht es, verschiedene Annahmen durchzuspielen: Was passiert bei 20% mehr Nachfrage? Was bei 10% höheren Kosten? Dashboards zeigen die Performance Ihrer bestehenden IGeL-Leistungen.",
      whyItHelps:
        "Viele Praxen investieren basierend auf Bauchgefühl oder Verkäuferargumenten. Mit unserer Analyse sehen Sie schwarz auf weiß, was sich lohnt. Sie vermeiden Fehlinvestitionen und können gegenüber Banken oder Partnern professionell argumentieren. Die laufende Überwachung zeigt, ob Ihre IGeL-Leistungen die geplante Rentabilität erreichen.",
    },
    iconName: "Lightbulb",
    color: "bg-amber-500/10 text-amber-600",
    heroImage: "/roi-analysis-financial-charts-amber-business.jpg",
    benefits: [
      { title: "IGeL-Kalkulation", description: "Wirtschaftlichkeit von Selbstzahlerleistungen berechnen" },
      { title: "ROI-Berechnung", description: "Return on Investment für Investitionen ermitteln" },
      { title: "Szenario-Analyse", description: "Verschiedene Annahmen durchspielen" },
      { title: "Business Cases", description: "Professionelle Entscheidungsvorlagen erstellen" },
      { title: "Performance-Tracking", description: "Laufende Überwachung der Rentabilität" },
      { title: "Vergleichsanalysen", description: "Verschiedene Optionen gegenüberstellen" },
    ],
    features: [
      {
        title: "IGeL-Verwaltung",
        description: "Übersicht aller IGeL-Leistungen mit Umsatzauswertung",
        iconName: "FileText",
      },
      {
        title: "ROI-Rechner",
        description: "Berechnen Sie den ROI für Investitionen",
        iconName: "PieChart",
      },
      {
        title: "Szenario-Vergleich",
        description: "Vergleichen Sie Best, Base und Worst Case",
        iconName: "BarChart3",
      },
      {
        title: "Preis-Kalkulation",
        description: "Kalkulieren Sie optimale Preise",
        iconName: "Lightbulb",
      },
    ],
    relatedFeatureSlugs: ["praxis-auswertung", "strategiepfad", "konkurrenzanalyse"],
    metaTitle: "IGeL & ROI-Analyse | Wirtschaftlichkeitsanalysen für Arztpraxen",
    metaDescription:
      "Analysieren Sie die Wirtschaftlichkeit von IGeL-Leistungen und Investitionen. Mit Szenario-Berechnungen für fundierte Entscheidungen.",
  },
  {
    slug: "konkurrenzanalyse",
    title: "Konkurrenzanalyse",
    subtitle: "SWOT und strategische Positionierung",
    description:
      "Analysieren Sie Ihr Wettbewerbsumfeld systematisch. Erstellen Sie SWOT-Analysen und positionieren Sie Ihre Praxis strategisch am Markt.",
    detailedDescription: {
      intro:
        "Wer sind Ihre Wettbewerber und was machen sie gut? Eine fundierte Konkurrenzanalyse ist die Basis für eine erfolgreiche Marktpositionierung. Unser Tool hilft Ihnen, Ihr Umfeld zu verstehen, Stärken und Schwächen zu identifizieren und Ihre Alleinstellungsmerkmale herauszuarbeiten.",
      howItWorks:
        "Definieren Sie Ihre Wettbewerber und erfassen Sie relevante Daten: Leistungen, Preise, Patientenbewertungen, Marketingaktivitäten. Das System unterstützt Sie bei der Durchführung einer SWOT-Analyse. Auf Basis der Ergebnisse können Sie Ihre strategische Positionierung entwickeln und Ihre Alleinstellungsmerkmale (USPs) klar definieren. KI-gestützte Empfehlungen helfen Ihnen, sich optimal zu positionieren.",
      whyItHelps:
        "Viele Praxen agieren im Markt, ohne ihre Wettbewerber genau zu kennen. Das kann zu Preisverfall oder verpassten Chancen führen. Mit einer klaren Konkurrenzanalyse und Positionierung können Sie sich erfolgreich am Markt behaupten, die richtigen Patienten ansprechen und Ihre Praxis zukunftssicher ausrichten.",
    },
    iconName: "Search",
    color: "bg-indigo-500/10 text-indigo-600",
    heroImage: "/competitor-analysis-swot-strategy-indigo-business.jpg",
    benefits: [
      { title: "SWOT-Analyse", description: "Strukturierte Stärken-Schwächen-Analyse" },
      { title: "Wettbewerber-Übersicht", description: "Dokumentieren Sie relevante Mitbewerber" },
      { title: "Positionierung", description: "Identifizieren Sie Ihre Unique Selling Points" },
      { title: "Marktanalyse", description: "Verstehen Sie Ihren lokalen Markt" },
      { title: "Chancen erkennen", description: "Finden Sie unbesetzte Nischen" },
      { title: "Strategie-Input", description: "Nutzen Sie Erkenntnisse für Ihre Strategie" },
    ],
    features: [
      { title: "SWOT-Tool", description: "Interaktives Tool zur SWOT-Analyse", iconName: "Search" },
      { title: "Wettbewerber-Profile", description: "Erfassen Sie Informationen zu Mitbewerbern", iconName: "Users" },
      {
        title: "Positionierungs-Matrix",
        description: "Visualisieren Sie Ihre Marktposition",
        iconName: "LayoutDashboard",
      },
      { title: "Handlungsempfehlungen", description: "KI-gestützte strategische Empfehlungen", iconName: "Lightbulb" },
    ],
    relatedFeatureSlugs: ["ki-praxisanalyse", "strategiepfad", "wunschpatient"],
    metaTitle: "Konkurrenzanalyse | SWOT & Positionierung für Arztpraxen",
    metaDescription:
      "Systematische Wettbewerbsanalyse mit SWOT, Marktanalyse und strategischer Positionierung für Ihre Praxis.",
  },
  {
    slug: "wunschpatient",
    title: "Wunschpatient",
    subtitle: "Ideale Patientenprofile definieren",
    description:
      "Definieren Sie Ihre Wunschpatienten und entwickeln Sie Strategien, um genau diese Patienten zu erreichen und zu binden.",
    detailedDescription: {
      intro:
        "Nicht jeder Patient ist gleich – und nicht jeder Patient passt gleich gut zu Ihrer Praxis. Das Wunschpatienten-Modul hilft Ihnen, Ihre idealen Patienten zu definieren und zu verstehen. Mit diesem Wissen können Sie Ihr Marketing, Ihre Kommunikation und sogar Ihre Leistungsangebote gezielt ausrichten.",
      howItWorks:
        "Sie erstellen Wunschpatienten-Profile (Personas) basierend auf demografischen Merkmalen, Bedürfnissen, Verhaltensweisen und Präferenzen. Das System unterstützt Sie mit Templates und Leitfragen. Sie können mehrere Personas für verschiedene Leistungsbereiche anlegen. Die Profile werden mit konkreten Empfehlungen für Ansprache und Kommunikation ergänzt. Optional können Sie Ihre Patientendaten analysieren, um zu sehen, wie gut Ihre aktuellen Patienten den Wunschprofilen entsprechen.",
      whyItHelps:
        "Gezieltes Marketing ist effektiver als Streuwerbung. Wenn Sie wissen, wen Sie ansprechen möchten, können Sie die richtigen Kanäle wählen, die passende Sprache nutzen und relevante Inhalte erstellen. Ihre Praxis wird attraktiver für die Patienten, die wirklich zu Ihnen passen. Und Sie verschwenden weniger Ressourcen für Patienten, die woanders besser aufgehoben wären.",
    },
    iconName: "UserPlus",
    color: "bg-cyan-500/10 text-cyan-600",
    heroImage: "/ideal-patient-profile-cyan-modern-dashboard.jpg",
    benefits: [
      { title: "Zielgruppen-Definition", description: "Definieren Sie Ihre idealen Patientengruppen" },
      { title: "Persona-Entwicklung", description: "Erstellen Sie detaillierte Patienten-Personas" },
      { title: "Ansprache-Strategie", description: "Entwickeln Sie gezielte Kommunikation" },
      { title: "Marketing-Fokus", description: "Richten Sie Marketing auf Wunschpatienten aus" },
      { title: "Service-Gestaltung", description: "Passen Sie Services an Zielgruppen an" },
      { title: "Bindungsstrategien", description: "Entwickeln Sie Maßnahmen zur Patientenbindung" },
    ],
    features: [
      { title: "Persona-Builder", description: "Erstellen Sie detaillierte Patienten-Personas", iconName: "UserPlus" },
      {
        title: "Zielgruppen-Analyse",
        description: "Analysieren Sie Ihre aktuellen Patientengruppen",
        iconName: "PieChart",
      },
      { title: "Gap-Analyse", description: "Vergleichen Sie Ist mit Soll", iconName: "Search" },
      { title: "Maßnahmenplanung", description: "Planen Sie konkrete Akquisitionsmaßnahmen", iconName: "Target" },
    ],
    relatedFeatureSlugs: ["leitbild", "konkurrenzanalyse", "bewertungsmanagement"],
    metaTitle: "Wunschpatient | Patientenprofile für gezieltes Marketing",
    metaDescription:
      "Definieren Sie ideale Patientenprofile und entwickeln Sie Strategien zur gezielten Patientengewinnung. Jetzt entdecken!",
  },
  {
    slug: "bewertungsmanagement",
    title: "Bewertungsmanagement",
    subtitle: "Google, Jameda und mehr",
    description:
      "Verwalten Sie alle Online-Bewertungen Ihrer Praxis zentral. Behalten Sie Google, Jameda und andere Plattformen im Blick und reagieren Sie professionell.",
    detailedDescription: {
      intro:
        "Online-Bewertungen sind heute entscheidend für die Patientengewinnung. Unser Bewertungsmodul hilft Ihnen, den Überblick zu behalten: alle Bewertungen von Google, Jameda und anderen Plattformen an einem Ort. Sie können schnell reagieren, Trends erkennen und Ihre Online-Reputation gezielt verbessern.",
      howItWorks:
        "Das System aggregiert Bewertungen von den wichtigsten Plattformen und zeigt sie in einer einheitlichen Übersicht. Sie sehen neue Bewertungen sofort und können direkt antworten. Die Sentiment-Analyse erkennt automatisch positive und negative Aspekte. Über die Zeit zeigen Trendanalysen, wie sich Ihre Reputation entwickelt. Automatische Alerts informieren Sie bei neuen oder kritischen Bewertungen.",
      whyItHelps:
        "Ohne systematisches Monitoring übersehen Sie wichtiges Feedback oder reagieren zu spät. Mit unserem System antworten Sie schnell und professionell – das zeigt anderen Patienten, dass Sie Feedback ernst nehmen. Die Analyse hilft Ihnen, wiederkehrende Kritikpunkte zu erkennen und zu adressieren. So verbessern Sie nicht nur Ihre Online-Reputation, sondern auch die tatsächliche Patientenzufriedenheit.",
    },
    iconName: "Star",
    color: "bg-yellow-500/10 text-yellow-600",
    heroImage: "/reviews-ratings-stars-yellow-modern-dashboard.jpg",
    benefits: [
      { title: "Multi-Plattform-Übersicht", description: "Alle Bewertungen an einem Ort" },
      { title: "Schnelle Reaktion", description: "Direkt antworten ohne Plattformwechsel" },
      { title: "Sentiment-Analyse", description: "Automatische Erkennung positiver/negativer Aspekte" },
      { title: "Trend-Tracking", description: "Entwicklung der Reputation über Zeit verfolgen" },
      { title: "Alert-System", description: "Sofortige Benachrichtigung bei neuen Bewertungen" },
      { title: "Reporting", description: "Regelmäßige Berichte zur Online-Reputation" },
    ],
    features: [
      {
        title: "Bewertungs-Dashboard",
        description: "Übersicht aller Bewertungen von allen Plattformen",
        iconName: "Star",
      },
      {
        title: "Antwort-System",
        description: "Direkte Reaktion mit Vorlagen und KI-Unterstützung",
        iconName: "FileText",
      },
      {
        title: "Sentiment-Analyse",
        description: "Automatische Kategorisierung von Feedback",
        iconName: "Brain",
      },
      {
        title: "Benachrichtigungen",
        description: "Alerts bei neuen oder kritischen Bewertungen",
        iconName: "Bell",
      },
    ],
    useCases: [
      {
        title: "Tägliches Monitoring",
        description: "Behalten Sie neue Bewertungen im Blick und reagieren Sie zeitnah.",
      },
      { title: "Krisenmanagement", description: "Reagieren Sie schnell auf negative Bewertungen." },
      { title: "Feedback nutzen", description: "Nutzen Sie Bewertungen für Verbesserungen." },
    ],
    faq: [
      {
        question: "Welche Plattformen werden unterstützt?",
        answer: "Google, Jameda, DocInsider und weitere gängige Bewertungsportale im Gesundheitsbereich.",
      },
      {
        question: "Kann ich auf Bewertungen direkt antworten?",
        answer: "Für die meisten Plattformen können Sie direkt aus dem System antworten.",
      },
      {
        question: "Werden negative Bewertungen hervorgehoben?",
        answer:
          "Ja, das Alert-System informiert Sie sofort bei kritischen Bewertungen, damit Sie schnell reagieren können.",
      },
    ],
    relatedFeatureSlugs: ["wunschpatienten", "ki-praxisanalyse", "praxis-auswertung"],
    metaTitle: "Bewertungen | Online-Reputation für Arztpraxen managen",
    metaDescription:
      "Überwachen Sie alle Online-Bewertungen Ihrer Praxis an einem Ort. Schnell reagieren und Reputation kontinuierlich verbessern.",
  },
  {
    slug: "räume",
    title: "Räume",
    subtitle: "Raumplanung und -verwaltung",
    description:
      "Verwalten Sie die Räume Ihrer Praxis effizient. Planen Sie Belegungen, dokumentieren Sie Ausstattung und optimieren Sie die Raumnutzung.",
    detailedDescription: {
      intro:
        "Behandlungsräume, Büros, Besprechungszimmer – die richtige Raumplanung ist entscheidend für einen reibungslosen Praxisablauf. Unser Modul hilft Ihnen, die Belegung zu optimieren, den Überblick über die Ausstattung zu behalten und Wartungen zu planen.",
      howItWorks:
        "Erfassen Sie alle Räume mit Details wie Größe, Ausstattung und Zweck. Der Kalender zeigt die Belegung der Räume übersichtlich an. Sie können Räume direkt buchen und Konflikte vermeiden. Dokumentieren Sie die Ausstattung jedes Raumes und planen Sie Reinigungs- und Wartungsarbeiten.",
      whyItHelps:
        "Unklare Raumbelegung führt zu Leerlauf oder Konflikten. Wenn Geräte nicht dokumentiert sind, kann das bei Wartungen oder Neuanschaffungen problematisch werden. Mit der Raumverwaltung haben Sie alles im Griff, optimieren die Auslastung und stellen sicher, dass jeder Raum optimal genutzt wird.",
    },
    iconName: "DoorOpen",
    color: "bg-stone-500/10 text-stone-600",
    heroImage: "/rooms-office-space-stone-modern-dashboard.jpg",
    benefits: [
      { title: "Raumübersicht", description: "Alle Räume mit Ausstattung im Überblick" },
      { title: "Belegungsplanung", description: "Planen Sie die Raumnutzung effizient" },
      { title: "Ausstattung", description: "Dokumentieren Sie Raumausstattung" },
      { title: "Kapazitäten", description: "Optimieren Sie die Raumauslastung" },
      { title: "Wartung", description: "Planen Sie Reinigung und Wartung" },
      { title: "Integration", description: "Verknübt mit Kalender und Team" },
    ],
    features: [
      { title: "Raum-Katalog", description: "Übersicht aller Räume mit Details und Fotos", iconName: "DoorOpen" },
      { title: "Belegungsplan", description: "Visuelle Darstellung der Raumbelegung", iconName: "Calendar" },
      { title: "Ausstattungs-Inventar", description: "Dokumentation aller Ausstattungsmerkmale", iconName: "Package" },
      { title: "Wartungsplanung", description: "Planen Sie regelmäßige Wartung und Reinigung", iconName: "Clock" },
    ],
    relatedFeatureSlugs: ["arbeitsplaetze", "arbeitsmittel", "kalender"],
    metaTitle: "Räume | Raumverwaltung für Arztpraxen",
    metaDescription:
      "Effiziente Raumplanung und -verwaltung für Ihre Praxis. Optimieren Sie Belegung und Auslastung. Jetzt entdecken!",
  },
  {
    slug: "arbeitsmittel",
    title: "Arbeitsmittel",
    subtitle: "Inventar und Ausstattung",
    description:
      "Verwalten Sie alle Arbeitsmittel und Geräte Ihrer Praxis. Behalten Sie Inventar, Wartungen und Beschaffungen im Blick.",
    detailedDescription: {
      intro:
        "Medizinische Geräte, IT-Ausstattung, Büromaterial – der Überblick über alle Arbeitsmittel ist essenziell. Unser Inventar-Modul hilft Ihnen, alles zu dokumentieren, Wartungen zu planen und Beschaffungen zu optimieren.",
      howItWorks:
        "Erfassen Sie jedes Arbeitsmittel mit allen relevanten Daten: Anschaffungsdatum, Seriennummer, Garantie, Wartungsintervalle, Standort. Das System erinnert Sie rechtzeitig an fällige Wartungen. Sie können Dokumente wie Anleitungen oder Zertifikate hinterlegen. Bei Bedarf lösen Sie einfach eine Neubeschaffung aus.",
      whyItHelps:
        "Ohne Inventarverwaltung gehen Geräte verloren, Wartungen werden vergessen und Anschaffungen ungeplant. Das kostet Geld und birgt Risiken. Mit dem Arbeitsmittel-Modul haben Sie alle Informationen zentral, vermeiden unnötige Ausgaben und stellen sicher, dass Ihre Praxis immer optimal ausgestattet ist.",
    },
    iconName: "Package",
    color: "bg-orange-500/10 text-orange-600",
    heroImage: "/inventory-management-tools-orange-dashboard.jpg",
    benefits: [
      { title: "Inventar-Übersicht", description: "Alle Geräte und Ausstattung dokumentiert" },
      { title: "Wartungsplanung", description: "Nie wieder Wartungen vergessen" },
      { title: "Beschaffung", description: "Planen Sie Neuanschaffungen" },
      { title: "Kosten-Tracking", description: "Behalten Sie Kosten im Blick" },
      { title: "Standorte", description: "Wissen, wo sich was befindet" },
      { title: "Dokumente", description: "Anleitungen und Zertifikate hinterlegen" },
    ],
    features: [
      { title: "Inventar-Datenbank", description: "Vollständige Erfassung aller Arbeitsmittel", iconName: "Package" },
      { title: "Wartungskalender", description: "Automatische Erinnerungen für Wartungen", iconName: "Calendar" },
      { title: "Dokumenten-Ablage", description: "Anleitungen, Garantien und Zertifikate", iconName: "FileText" },
      {
        title: "Beschaffungs-Workflow",
        description: "Strukturierter Prozess für Neuanschaffungen",
        iconName: "Workflow",
      },
    ],
    relatedFeatureSlugs: ["raeume", "arbeitsplaetze", "kontakte"],
    metaTitle: "Arbeitsmittel | Inventarverwaltung für Arztpraxen",
    metaDescription:
      "Digitale Inventarverwaltung für Geräte und Ausstattung mit Wartungsplanung und Dokumenten-Ablage. Jetzt entdecken!",
  },
  {
    slug: "arbeitsplaetze",
    title: "Arbeitsplätze",
    subtitle: "Stationen konfigurieren",
    description:
      "Konfigurieren und verwalten Sie alle Arbeitsplätze in Ihrer Praxis. Dokumentieren Sie Ausstattung und optimieren Sie die Arbeitsumgebung.",
    detailedDescription: {
      intro:
        "Ob Empfangstresen, Behandlungsstuhl oder Büroarbeitsplatz – jeder Arbeitsplatz muss optimal ausgestattet sein. Unser Modul hilft Ihnen, alle Arbeitsplätze zu dokumentieren, inklusive der zugehörigen Ausstattung und Zuweisungen.",
      howItWorks:
        "Erfassen Sie jeden Arbeitsplatz mit Details wie Standort, Art des Arbeitsplatzes und zugehöriger Ausstattung (Monitor, Tastatur, medizinische Geräte). Sie können zuweisen, welcher Mitarbeiter welchen Arbeitsplatz nutzt. Das hilft bei der IT-Administration, der ergonomischen Gestaltung und der flexiblen Arbeitsplatzorganisation.",
      whyItHelps:
        "Bei IT-Problemen müssen Sie schnell wissen, welche Hardware an welchem Platz verbaut ist. Bei Umstrukturierungen hilft die Übersicht, wer wo arbeitet. Und bei der Optimierung der Ergonomie können Sie gezielt Maßnahmen ergreifen. Das Arbeitsplatzmanagement sorgt für Klarheit und Effizienz im täglichen Betrieb.",
    },
    iconName: "MonitorCheck",
    color: "bg-blue-500/10 text-blue-600",
    heroImage: "/workstations-desks-it-equipment-blue-dashboard.jpg",
    benefits: [
      { title: "Arbeitsplatz-Übersicht", description: "Alle Arbeitsplätze dokumentiert" },
      { title: "Ausstattung", description: "IT, Möbel und Geräte pro Arbeitsplatz" },
      { title: "Zuweisung", description: "Wer arbeitet wo?" },
      { title: "Ergonomie", description: "Dokumentieren Sie ergonomische Einstellungen" },
      { title: "IT-Support", description: "Schneller Überblick für IT-Probleme" },
      { title: "Flexibilität", description: "Unterstützt flexible Arbeitsplatzmodelle" },
    ],
    features: [
      {
        title: "Arbeitsplatz-Katalog",
        description: "Übersicht aller Arbeitsplätze mit Details",
        iconName: "MonitorCheck",
      },
      {
        title: "Ausstattungs-Zuordnung",
        description: "Verknüpfung mit IT-Equipment und Mobiliar",
        iconName: "Package",
      },
      { title: "Mitarbeiter-Zuweisung", description: "Dokumentation der Arbeitsplatzbelegung", iconName: "Users" },
      { title: "Raumplan-Integration", description: "Visualisierung im Grundriss", iconName: "Map" },
    ],
    relatedFeatureSlugs: ["raeume", "arbeitsmittel", "team-management"],
    metaTitle: "Arbeitsplätze | Arbeitsplatzverwaltung für Arztpraxen",
    metaDescription:
      "Konfigurieren und verwalten Sie alle Arbeitsplätze in Ihrer Praxis mit Ausstattung und Zuweisungen. Jetzt entdecken!",
  },
  {
    slug: "favoriten",
    title: "Favoriten",
    subtitle: "Schnellzugriff auf wichtige Funktionen",
    description:
      "Speichern Sie Ihre meistgenutzten Funktionen als Favoriten für schnellen Zugriff. Personalisieren Sie Ihre Effizienz-Praxis-Erfahrung.",
    detailedDescription: {
      intro:
        "Jeder hat seine Lieblingsfunktionen. Mit der Favoriten-Leiste greifen Sie sofort auf die Bereiche zu, die Sie am häufigsten nutzen. Das spart Zeit und macht die Navigation durch die Software noch effizienter.",
      howItWorks:
        "Klicken Sie einfach auf den Stern neben einer Funktion, um sie zu Ihren Favoriten hinzuzufügen. Die Favoriten erscheinen dann in einer eigenen Leiste in der Hauptnavigation. Sie können die Reihenfolge per Drag & Drop anpassen oder einzelne Favoriten wieder entfernen.",
      whyItHelps:
        "Statt sich durch Menüs zu klicken, haben Sie Ihre wichtigsten Funktionen immer nur einen Klick entfernt. Das beschleunigt Ihren Arbeitsalltag und macht die Nutzung der Software noch angenehmer.",
    },
    iconName: "Pin",
    color: "bg-amber-500/10 text-amber-600",
    heroImage: "/favorite-features-shortcut-pin-amber-dashboard.jpg",
    benefits: [
      { title: "Schnellzugriff", description: "Ihre wichtigsten Funktionen mit einem Klick" },
      { title: "Personalisierung", description: "Passen Sie die App an Ihre Bedürfnisse an" },
      { title: "Zeitersparnis", description: "Sparen Sie Zeit bei der Navigation" },
      { title: "Flexibel", description: "Ändern Sie Favoriten jederzeit" },
      { title: "Übersichtlich", description: "Weniger Klicks zu häufig genutzten Features" },
      { title: "Pro Benutzer", description: "Jeder Nutzer hat eigene Favoriten" },
    ],
    features: [
      { title: "Favoriten-Leiste", description: "Schnellzugriff in der Hauptnavigation", iconName: "Pin" },
      { title: "Ein-Klick-Hinzufügen", description: "Funktionen einfach zu Favoriten hinzufügen", iconName: "Star" },
      { title: "Drag & Drop", description: "Reihenfolge per Drag & Drop anpassen", iconName: "Target" },
      { title: "Kategorien", description: "Favoriten optional gruppieren", iconName: "FolderOpen" },
    ],
    relatedFeatureSlugs: ["einstellungen", "aufgaben", "kalender"],
    metaTitle: "Favoriten | Schnellzugriff für Arztpraxen",
    metaDescription:
      "Personalisieren Sie Ihren Schnellzugriff mit Favoriten für Ihre meistgenutzten Funktionen. Jetzt entdecken!",
  },
  {
    slug: "einstellungen",
    title: "Einstellungen",
    subtitle: "Praxis- und Benutzereinstellungen",
    description:
      "Passen Sie Effizienz Praxis an Ihre Bedürfnisse an. Konfigurieren Sie Praxis- und Benutzereinstellungen, Benachrichtigungen und mehr.",
    detailedDescription: {
      intro:
        "Die Software soll sich an Ihre Praxis anpassen – nicht umgekehrt. Im Einstellungsbereich konfigurieren Sie die Software nach Ihren Wünschen: von allgemeinen Praxisdaten über Benachrichtigungseinstellungen bis hin zu individuellen Benutzerpräferenzen.",
      howItWorks:
        "Hier legen Sie Stammdaten Ihrer Praxis fest, verwalten Benutzerkonten und Berechtigungen, konfigurieren E-Mail-Benachrichtigungen und integrieren externe Dienste. Auch Design-Anpassungen wie Dark Mode sind hier möglich. Für jeden Benutzer können individuelle Einstellungen vorgenommen werden.",
      whyItHelps:
        "Die Möglichkeit, die Software individuell anzupassen, steigert die Effizienz und Benutzerfreundlichkeit enorm. Sie stellen sicher, dass Benachrichtigungen dort ankommen, wo sie gebraucht werden, und dass jeder Benutzer die Funktionen nutzen kann, die er benötigt.",
    },
    iconName: "Settings",
    color: "bg-gray-500/10 text-gray-600",
    heroImage: "/settings-configuration-gear-gray-dashboard.jpg",
    benefits: [
      { title: "Praxis-Konfiguration", description: "Grundeinstellungen für Ihre Praxis" },
      { title: "Benutzerprofile", description: "Individuelle Einstellungen pro Nutzer" },
      { title: "Benachrichtigungen", description: "Konfigurieren Sie Alerts und E-Mails" },
      { title: "Integrationen", description: "Verbinden Sie externe Systeme" },
      { title: "Sicherheit", description: "Passwort und Zwei-Faktor-Authentifizierung" },
      { title: "Design", description: "Passen Sie das Erscheinungsbild an" },
    ],
    features: [
      { title: "Praxis-Einstellungen", description: "Name, Adresse, Fachrichtung und mehr", iconName: "Settings" },
      { title: "Benutzer-Verwaltung", description: "Nutzer anlegen, Rollen und Rechte", iconName: "Users" },
      { title: "Benachrichtigungs-Center", description: "Konfigurieren Sie alle Benachrichtigungen", iconName: "Bell" },
      { title: "Design-Optionen", description: "Dark Mode, Farben und Layout", iconName: "LayoutDashboard" },
    ],
    relatedFeatureSlugs: ["favoriten", "team-management", "wissen-qm"],
    metaTitle: "Einstellungen | Konfiguration für Arztpraxen",
    metaDescription:
      "Passen Sie Effizienz Praxis an Ihre Bedürfnisse an. Praxis- und Benutzereinstellungen, Benachrichtigungen und mehr. Jetzt entdecken!",
  },

  // Umfragen (Surveys)
  {
    slug: "umfragen",
    title: "Umfragen",
    subtitle: "Team- und Patientenumfragen mit KI-Analyse",
    description:
      "Erstellen Sie professionelle Umfragen für Ihr Team und Ihre Patienten. Mit KI-gestützter Analyse und automatischen Auswertungen.",
    detailedDescription: {
      intro:
        "Das Umfrage-System ermöglicht es Ihnen, strukturiertes Feedback von Team und Patienten zu sammeln. Von wöchentlichen Team-Stimmungsbarometern bis hin zu Patientenzufriedenheitsumfragen - alles in einer Plattform.",
      howItWorks:
        "Erstellen Sie Umfragen manuell, aus Vorlagen oder lassen Sie die KI basierend auf Ihrer Beschreibung eine passende Umfrage generieren. Verteilen Sie Umfragen an Teammitglieder oder erstellen Sie öffentliche Links für Patienten. Die Ergebnisse werden automatisch analysiert und visualisiert.",
      whyItHelps:
        "Regelmäßiges Feedback ist der Schlüssel zur kontinuierlichen Verbesserung. Mit dem Umfrage-System erkennen Sie Probleme frühzeitig, verstehen die Bedürfnisse Ihres Teams und verbessern die Patientenzufriedenheit systematisch.",
    },
    iconName: "ClipboardCheck",
    color: "bg-teal-500/10 text-teal-600",
    heroImage: "/surveys-feedback-questionnaire-teal-dashboard.jpg",
    benefits: [
      {
        title: "KI-Generierung",
        description: "Beschreiben Sie Ihre Umfrage in Worten, die KI erstellt passende Fragen",
      },
      { title: "Anonyme Teilnahme", description: "Patienten können ohne Login an Umfragen teilnehmen" },
      { title: "Echtzeit-Auswertung", description: "Ergebnisse werden sofort visualisiert und analysiert" },
      { title: "Team-Stimmung", description: "Wöchentliche Puls-Umfragen zur Teamzufriedenheit" },
      { title: "Zeitsteuerung", description: "Start- und Enddatum für Umfragezeiträume festlegen" },
      { title: "Kalenderintegration", description: "Umfragezeiträume erscheinen automatisch im Praxiskalender" },
    ],
    features: [
      {
        title: "Vorlagen-Bibliothek",
        description: "Fertige Vorlagen für häufige Umfrageszenarien",
        iconName: "FileText",
      },
      {
        title: "Verschiedene Fragetypen",
        description: "Skalen, Multiple Choice, Freitext und mehr",
        iconName: "ListChecks",
      },
      { title: "Admin-Benachrichtigung", description: "E-Mail bei neuen Antworten erhalten", iconName: "Bell" },
      { title: "Trend-Analyse", description: "Entwicklung über Zeit verfolgen", iconName: "TrendingUp" },
      { title: "Export-Funktionen", description: "Ergebnisse als PDF oder CSV exportieren", iconName: "Download" },
      { title: "Datenschutz", description: "DSGVO-konforme Datenverarbeitung", iconName: "Shield" },
    ],
    useCases: [
      {
        title: "Wöchentliche Team-Checks",
        description: "Kurze 3-Fragen-Umfragen zur Teamstimmung und Arbeitsbelastung",
      },
      { title: "Patientenzufriedenheit", description: "Nach dem Besuch Feedback zur Behandlung und Service einholen" },
      { title: "Mitarbeiter-Feedback", description: "Anonyme Befragungen zu Verbesserungsvorschlägen" },
      { title: "Onboarding-Evaluation", description: "Neue Mitarbeiter nach den ersten Wochen befragen" },
    ],
    faq: [
      {
        question: "Können Patienten ohne Login teilnehmen?",
        answer: "Ja, Sie können öffentliche Umfrage-Links erstellen, die ohne Anmeldung zugänglich sind.",
      },
      {
        question: "Wie funktioniert die KI-Generierung?",
        answer:
          "Beschreiben Sie einfach, was Sie erfahren möchten, und die KI erstellt passende Fragen mit geeigneten Antwortformaten.",
      },
      {
        question: "Sind die Antworten anonym?",
        answer:
          "Je nach Einstellung können Umfragen anonym oder personalisiert sein. Bei anonymen Umfragen werden keine Benutzerdaten gespeichert.",
      },
    ],
    relatedFeatureSlugs: ["team-stimmung", "aufgabenverteilung", "wissen-qm"],
    metaTitle: "Umfragen | Effizienz Praxis",
    metaDescription:
      "Erstellen Sie professionelle Team- und Patientenumfragen mit KI-Unterstützung. Automatische Auswertungen und Trend-Analysen.",
  },

  // Materialverwaltung (Inventory Management)
  {
    slug: "materialverwaltung",
    title: "Materialverwaltung",
    subtitle: "Prädiktive Bestellvorschläge und Verbrauchsanalyse",
    description:
      "Intelligentes Bestandsmanagement mit KI-gestützten Bestellvorschlägen. Nie wieder Engpässe bei wichtigen Materialien.",
    detailedDescription: {
      intro:
        "Die Materialverwaltung revolutioniert Ihr Bestandsmanagement. Das System lernt aus Ihren Verbrauchsmustern und schlägt rechtzeitig Bestellungen vor, bevor Materialien ausgehen.",
      howItWorks:
        "Erfassen Sie Ihre Materialien mit Mindestbeständen und Lieferanten. Bei jeder Entnahme wird der Verbrauch protokolliert. Die KI analysiert Muster und berechnet optimale Bestellzeitpunkte und -mengen.",
      whyItHelps:
        "Vermeiden Sie Engpässe bei kritischen Materialien und reduzieren Sie gleichzeitig Überbestände. Das spart Zeit bei manuellen Bestandskontrollen und optimiert Ihre Lagerkosten.",
    },
    iconName: "PackageSearch",
    color: "bg-amber-500/10 text-amber-600",
    heroImage: "/inventory-supply-management-amber-dashboard.jpg",
    benefits: [
      { title: "KI-Bestellvorschläge", description: "Automatische Empfehlungen basierend auf Verbrauchsmustern" },
      { title: "Niedriger Bestand-Alarm", description: "Sofortige Warnungen bei kritischen Beständen" },
      { title: "Verbrauchsanalyse", description: "Trends und Muster im Materialverbrauch erkennen" },
      { title: "Lieferanten-Integration", description: "Bestellungen mit einem Klick an Lieferanten senden" },
      { title: "Kostenkontrolle", description: "Gesamtübersicht über Materialkosten und Budget" },
      { title: "Kategorie-Management", description: "Materialien nach Bereichen organisieren" },
    ],
    features: [
      {
        title: "Bestandsübersicht",
        description: "Dashboard mit allen Materialien und Status",
        iconName: "LayoutDashboard",
      },
      {
        title: "Verbrauchsprotokoll",
        description: "Jede Entnahme dokumentieren und nachverfolgen",
        iconName: "ClipboardList",
      },
      {
        title: "Bestellmanagement",
        description: "Bestellungen erstellen, verfolgen und archivieren",
        iconName: "ShoppingCart",
      },
      { title: "Lieferantenverwaltung", description: "Kontakte und Konditionen zentral verwalten", iconName: "Users" },
      {
        title: "Berichte & Export",
        description: "Detaillierte Berichte zu Verbrauch und Kosten",
        iconName: "FileText",
      },
      { title: "Barcode-Scanner", description: "Schnelle Erfassung per Barcode (optional)", iconName: "Scan" },
    ],
    useCases: [
      {
        title: "Medizinische Verbrauchsmaterialien",
        description: "Spritzen, Verbände, Desinfektionsmittel immer verfügbar halten",
      },
      { title: "Bürobedarf", description: "Papier, Toner und andere Büromaterialien überwachen" },
      { title: "Hygieneartikel", description: "Seife, Handschuhe, Masken nie ausgehen lassen" },
      { title: "Labor-Materialien", description: "Reagenzien und Testmaterialien rechtzeitig nachbestellen" },
    ],
    faq: [
      {
        question: "Wie lernt die KI unsere Verbrauchsmuster?",
        answer:
          "Das System analysiert Ihre Entnahmen über Zeit und erkennt Muster wie wöchentliche Schwankungen oder saisonale Trends.",
      },
      {
        question: "Kann ich mehrere Lieferanten pro Material haben?",
        answer: "Ja, Sie können mehrere Lieferanten hinterlegen und den bevorzugten Lieferanten festlegen.",
      },
      {
        question: "Werden Bestellungen automatisch ausgelöst?",
        answer:
          "Nein, das System schlägt Bestellungen vor, aber Sie entscheiden, wann bestellt wird. One-Click-Bestellung ist optional.",
      },
    ],
    relatedFeatureSlugs: ["arbeitsmittel", "praxis-auswertung", "einstellungen"],
    metaTitle: "Materialverwaltung | Effizienz Praxis",
    metaDescription:
      "Intelligentes Bestandsmanagement mit KI-Bestellvorschlägen. Vermeiden Sie Engpässe und optimieren Sie Ihre Lagerkosten.",
  },

  // KI-Aufgabenverteilung (Smart Task Distribution)
  {
    slug: "aufgabenverteilung",
    title: "KI-Aufgabenverteilung",
    subtitle: "Intelligente Aufgabenzuweisung basierend auf Skills und Auslastung",
    description:
      "Die KI analysiert Teamfähigkeiten und aktuelle Auslastung, um Aufgaben optimal zu verteilen und Überlastung zu vermeiden.",
    detailedDescription: {
      intro:
        "Die intelligente Aufgabenverteilung nutzt KI, um Aufgaben fair und effizient im Team zu verteilen. Das System berücksichtigt individuelle Stärken, aktuelle Arbeitsbelastung und Verfügbarkeit.",
      howItWorks:
        "Das System analysiert die Skills jedes Teammitglieds, deren aktuelle Aufgabenlast und die Anforderungen neuer Aufgaben. Basierend darauf werden optimale Zuweisungsvorschläge generiert.",
      whyItHelps:
        "Vermeiden Sie Überlastung einzelner Mitarbeiter und stellen Sie sicher, dass die richtigen Aufgaben bei den richtigen Personen landen. Das steigert Effizienz und Mitarbeiterzufriedenheit.",
    },
    iconName: "Shuffle",
    color: "bg-indigo-500/10 text-indigo-600",
    heroImage: "/smart-task-distribution-ai-workload-indigo.jpg",
    benefits: [
      { title: "Workload-Balance", description: "Gleichmäßige Verteilung der Arbeitslast im Team" },
      { title: "Skill-Matching", description: "Aufgaben werden passend zu Fähigkeiten zugewiesen" },
      { title: "Überlastungswarnung", description: "Frühzeitige Erkennung von Überlastung" },
      { title: "KI-Empfehlungen", description: "Intelligente Vorschläge für Umverteilung" },
      { title: "Transparenz", description: "Klare Übersicht über Teamauslastung" },
      { title: "Fairness", description: "Objektive Verteilung ohne Bevorzugung" },
    ],
    features: [
      {
        title: "Workload-Dashboard",
        description: "Visuelle Übersicht der Teamauslastung",
        iconName: "LayoutDashboard",
      },
      { title: "Skill-Analyse", description: "Automatischer Abgleich von Aufgaben und Fähigkeiten", iconName: "Brain" },
      {
        title: "Umverteilungsvorschläge",
        description: "KI-basierte Empfehlungen zur Optimierung",
        iconName: "ArrowRightLeft",
      },
      { title: "Bulk-Zuweisung", description: "Mehrere Aufgaben gleichzeitig umverteilen", iconName: "Layers" },
      {
        title: "Prioritätsberücksichtigung",
        description: "Dringende Aufgaben werden priorisiert",
        iconName: "AlertTriangle",
      },
      { title: "Historische Analyse", description: "Trends in der Arbeitsverteilung erkennen", iconName: "TrendingUp" },
    ],
    useCases: [
      { title: "Neue Aufgaben zuweisen", description: "KI schlägt den besten Mitarbeiter für neue Aufgaben vor" },
      { title: "Krankheitsvertretung", description: "Aufgaben von abwesenden Mitarbeitern schnell umverteilen" },
      { title: "Projekt-Planung", description: "Ressourcen für größere Projekte optimal planen" },
      { title: "Onboarding", description: "Neuen Mitarbeitern passende Einarbeitungsaufgaben zuweisen" },
    ],
    faq: [
      {
        question: "Welche Faktoren berücksichtigt die KI?",
        answer:
          "Skills, aktuelle Aufgabenlast, Prioritäten, Verfügbarkeit und historische Performance werden analysiert.",
      },
      {
        question: "Werden Aufgaben automatisch umverteilt?",
        answer: "Nein, die KI gibt Empfehlungen, aber die finale Entscheidung liegt bei Ihnen.",
      },
      {
        question: "Wie werden Skills erfasst?",
        answer: "Skills werden im Team-Management gepflegt und können mit Kompetenzleveln versehen werden.",
      },
    ],
    relatedFeatureSlugs: ["aufgaben", "team-management", "skills-management"],
    metaTitle: "KI-Aufgabenverteilung | Effizienz Praxis",
    metaDescription:
      "Intelligente Aufgabenverteilung mit KI. Optimale Zuweisung basierend auf Skills, Auslastung und Verfügbarkeit.",
  },

  // Team-Stimmung (Team Mood Analytics)
  {
    slug: "team-stimmung",
    title: "Team-Stimmung",
    subtitle: "Wöchentliche Puls-Umfragen für Teamzufriedenheit",
    description:
      "Erfassen Sie regelmäßig die Stimmung im Team mit kurzen Micro-Umfragen. Erkennen Sie Probleme frühzeitig und handeln Sie proaktiv.",
    detailedDescription: {
      intro:
        "Das Team-Stimmungsbarometer ist ein Frühwarnsystem für die Mitarbeiterzufriedenheit. Durch regelmäßige, kurze Umfragen bleiben Sie am Puls Ihres Teams.",
      howItWorks:
        "Wöchentlich erhalten Teammitglieder eine kurze Umfrage (2-3 Fragen) zu Stimmung, Arbeitsbelastung und Zufriedenheit. Die Ergebnisse werden aggregiert und Trends visualisiert.",
      whyItHelps:
        "Probleme im Team entwickeln sich oft schleichend. Mit regelmäßigen Stimmungs-Checks erkennen Sie Warnsignale frühzeitig und können gegensteuern, bevor die Situation eskaliert.",
    },
    iconName: "Smile",
    color: "bg-pink-500/10 text-pink-600",
    heroImage: "/team-mood-happiness-survey-pink-dashboard.jpg",
    benefits: [
      { title: "Frühwarnsystem", description: "Probleme erkennen, bevor sie eskalieren" },
      { title: "Anonymität", description: "Ehrliches Feedback durch anonyme Teilnahme" },
      { title: "Trend-Analyse", description: "Entwicklung der Teamstimmung über Zeit" },
      { title: "Schnelle Umfragen", description: "Nur 2-3 Fragen, unter 1 Minute" },
      { title: "Automatische Alerts", description: "Benachrichtigung bei kritischen Werten" },
      { title: "Vergleichswerte", description: "Benchmarks für Ihre Branche" },
    ],
    features: [
      {
        title: "Stimmungs-Dashboard",
        description: "Übersichtliche Visualisierung aller Metriken",
        iconName: "LayoutDashboard",
      },
      { title: "Stress-Level-Tracking", description: "Arbeitsbelastung im Blick behalten", iconName: "Activity" },
      { title: "Zufriedenheits-Score", description: "Gesamtbewertung der Teamzufriedenheit", iconName: "ThumbsUp" },
      { title: "Kommentar-Analyse", description: "KI-Auswertung von Freitext-Feedback", iconName: "MessageSquare" },
      { title: "Team-Vergleich", description: "Unterschiede zwischen Abteilungen erkennen", iconName: "Users" },
      { title: "Aktionsempfehlungen", description: "Konkrete Vorschläge zur Verbesserung", iconName: "Lightbulb" },
    ],
    useCases: [
      { title: "Wöchentlicher Puls-Check", description: "Jeden Montag kurze Stimmungsabfrage" },
      { title: "Nach Veränderungen", description: "Feedback nach organisatorischen Änderungen einholen" },
      { title: "Projekt-Retrospektive", description: "Teamstimmung nach großen Projekten evaluieren" },
      { title: "Saisonale Trends", description: "Stimmungsschwankungen über das Jahr erkennen" },
    ],
    faq: [
      {
        question: "Wie anonym sind die Umfragen?",
        answer:
          "Vollständig anonym. Ergebnisse werden nur aggregiert angezeigt, einzelne Antworten sind nicht zuordenbar.",
      },
      {
        question: "Wie oft sollte man befragen?",
        answer:
          "Wir empfehlen wöchentliche kurze Checks. Bei Bedarf können Sie auch zweiwöchentlich oder monatlich befragen.",
      },
      {
        question: "Was passiert bei schlechten Werten?",
        answer: "Sie erhalten eine Benachrichtigung und das System schlägt konkrete Maßnahmen vor.",
      },
    ],
    relatedFeatureSlugs: ["umfragen", "team-management", "praxis-auswertung"],
    metaTitle: "Team-Stimmung | Effizienz Praxis",
    metaDescription:
      "Erfassen Sie die Teamstimmung mit wöchentlichen Micro-Umfragen. Frühwarnsystem für Mitarbeiterzufriedenheit.",
  },

  // Nachrichten (Internal Messaging)
  {
    slug: "nachrichten",
    title: "Nachrichten",
    subtitle: "Interne Team-Kommunikation",
    description:
      "Sichere interne Kommunikation zwischen Teammitgliedern. Keine externen Tools nötig, alles in einer Plattform.",
    detailedDescription: {
      intro:
        "Das Nachrichten-System ermöglicht sichere, DSGVO-konforme Kommunikation innerhalb Ihres Teams. Keine Notwendigkeit für externe Messenger wie WhatsApp.",
      howItWorks:
        "Senden Sie Nachrichten an einzelne Teammitglieder oder Gruppen. Alle Nachrichten werden sicher gespeichert und sind jederzeit abrufbar. Lesebestätigungen zeigen, ob Nachrichten angekommen sind.",
      whyItHelps:
        "Zentrale Kommunikation verhindert Informationsverlust und hält sensible Daten in der sicheren Praxisumgebung. Kein Wechsel zwischen verschiedenen Apps nötig.",
    },
    iconName: "MessageSquare",
    color: "bg-blue-500/10 text-blue-600",
    heroImage: "/internal-messaging-communication-blue-dashboard.jpg",
    benefits: [
      { title: "DSGVO-konform", description: "Sichere Kommunikation ohne externe Dienste" },
      { title: "Lesebestätigung", description: "Sehen, ob Nachrichten gelesen wurden" },
      { title: "Suchfunktion", description: "Ältere Nachrichten schnell wiederfinden" },
      { title: "Anhänge", description: "Dateien und Bilder teilen" },
      { title: "Benachrichtigungen", description: "Push-Benachrichtigungen bei neuen Nachrichten" },
      { title: "Thread-Ansicht", description: "Konversationen übersichtlich verfolgen" },
    ],
    features: [
      { title: "Posteingang", description: "Übersicht aller empfangenen Nachrichten", iconName: "Inbox" },
      { title: "Gesendet", description: "Gesendete Nachrichten nachverfolgen", iconName: "Send" },
      { title: "Ungelesen-Badge", description: "Anzahl ungelesener Nachrichten im Menü", iconName: "Bell" },
      { title: "Schnellantwort", description: "Direkt aus der Benachrichtigung antworten", iconName: "Reply" },
      { title: "Archiv", description: "Alte Nachrichten archivieren", iconName: "Archive" },
      { title: "Suche", description: "Volltext-Suche über alle Nachrichten", iconName: "Search" },
    ],
    useCases: [
      { title: "Schnelle Abstimmung", description: "Kurze Fragen ohne Meeting klären" },
      { title: "Übergabe-Notizen", description: "Wichtige Infos an die nächste Schicht" },
      { title: "Dokumente teilen", description: "Dateien sicher intern versenden" },
      { title: "Ankündigungen", description: "Wichtige Mitteilungen an alle" },
    ],
    faq: [
      { question: "Kann ich Gruppen erstellen?", answer: "Ja, Sie können Gruppen für Teams oder Projekte erstellen." },
      {
        question: "Werden Nachrichten verschlüsselt?",
        answer: "Ja, alle Nachrichten werden verschlüsselt übertragen und gespeichert.",
      },
      {
        question: "Kann ich Nachrichten löschen?",
        answer: "Ja, Sie können eigene Nachrichten löschen. Für beide Seiten oder nur für sich selbst.",
      },
    ],
    relatedFeatureSlugs: ["team-management", "aufgaben", "benachrichtigungen"],
    metaTitle: "Nachrichten | Effizienz Praxis",
    metaDescription: "Sichere interne Team-Kommunikation. DSGVO-konform ohne externe Messenger.",
  },

  // Hilfe-Center
  {
    slug: "hilfe-center",
    title: "Hilfe-Center",
    subtitle: "KI-gestütztes Hilfesystem",
    description:
      "Intelligentes Hilfesystem mit KI-Assistent, Tutorials, FAQ und direktem Support. Finden Sie schnell Antworten auf alle Fragen.",
    detailedDescription: {
      intro:
        "Das Hilfe-Center ist Ihre zentrale Anlaufstelle für alle Fragen zur Nutzung von Effizienz Praxis. Der KI-Assistent beantwortet Fragen in Echtzeit.",
      howItWorks:
        "Stellen Sie Fragen in natürlicher Sprache und erhalten Sie sofort passende Antworten. Der KI-Assistent greift auf Ihre Praxisdaten zu, um personalisierte Hilfe zu bieten.",
      whyItHelps:
        "Keine langen Wartezeiten auf Support. Sofortige Hilfe zu jeder Tages- und Nachtzeit. Die KI lernt aus Ihren Fragen und wird immer besser.",
    },
    iconName: "HelpCircle",
    color: "bg-sky-500/10 text-sky-600",
    heroImage: "/help-center-support-sky-blue-dashboard.jpg",
    benefits: [
      { title: "KI-Assistent", description: "Sofortige Antworten auf Ihre Fragen" },
      { title: "24/7 verfügbar", description: "Hilfe zu jeder Zeit" },
      { title: "Personalisiert", description: "Antworten basierend auf Ihren Praxisdaten" },
      { title: "Lernpfade", description: "Strukturierte Kurse für Einsteiger" },
      { title: "Video-Tutorials", description: "Visuelle Anleitungen für komplexe Funktionen" },
      { title: "Direkter Support", description: "Bei Bedarf Kontakt zum Support-Team" },
    ],
    features: [
      { title: "KI-Chat", description: "Fragen Sie den KI-Assistenten", iconName: "Bot" },
      {
        title: "Artikel-Bibliothek",
        description: "Ausführliche Anleitungen zu allen Funktionen",
        iconName: "BookOpen",
      },
      { title: "Video-Kurse", description: "Schritt-für-Schritt Video-Tutorials", iconName: "Video" },
      { title: "FAQ", description: "Häufig gestellte Fragen und Antworten", iconName: "HelpCircle" },
      { title: "Tastenkürzel", description: "Übersicht aller Keyboard-Shortcuts", iconName: "Keyboard" },
      { title: "Kontakt", description: "Direkter Draht zum Support-Team", iconName: "Phone" },
    ],
    useCases: [
      { title: "Schnelle Frage", description: "Kurze Fragen sofort vom KI-Assistenten beantwortet" },
      { title: "Neue Mitarbeiter", description: "Lernpfade für das Onboarding nutzen" },
      { title: "Neue Funktionen", description: "Tutorials für kürzlich hinzugefügte Features" },
      { title: "Problemlösung", description: "Schritt-für-Schritt Anleitungen bei Schwierigkeiten" },
    ],
    faq: [
      {
        question: "Kann die KI auf meine Praxisdaten zugreifen?",
        answer: "Ja, mit Ihrer Erlaubnis kann die KI Ihre Daten nutzen, um personalisierte Hilfe zu bieten.",
      },
      {
        question: "Gibt es auch telefonischen Support?",
        answer: "Ja, über das Hilfe-Center können Sie einen Rückruf anfordern oder direkt anrufen.",
      },
      {
        question: "Sind die Tutorials auf Deutsch?",
        answer: "Ja, alle Inhalte sind vollständig auf Deutsch verfügbar.",
      },
    ],
    relatedFeatureSlugs: ["einstellungen", "fortbildung", "wissen-qm"],
    metaTitle: "Hilfe-Center | Effizienz Praxis",
    metaDescription:
      "KI-gestütztes Hilfesystem mit Tutorials, FAQ und direktem Support. Schnelle Antworten auf alle Fragen.",
  },
  // ===== NEW FEATURES =====
  {
    slug: "dashboard",
    title: "Dashboard",
    subtitle: "Zentrale Übersicht aller wichtigen Praxis-Kennzahlen",
    description:
      "Das Dashboard gibt Ihnen auf einen Blick den aktuellen Status Ihrer Praxis: Termine, Aufgaben, Team-Aktivitäten und wichtige KPIs – alles an einem Ort.",
    detailedDescription: {
      intro:
        "Das Dashboard ist Ihr persönlicher Kontrollturm. Nach dem Login sehen Sie sofort, was heute ansteht, welche Aufgaben offen sind und wie Ihre Praxis performt. Statt sich durch verschiedene Module zu klicken, haben Sie alle relevanten Informationen übersichtlich zusammengefasst.",
      howItWorks:
        "Das Dashboard aggregiert Echtzeit-Daten aus allen Modulen: offene Aufgaben, heutige Termine, Krankmeldungen, ausstehende Genehmigungen, aktuelle Zeiterfassungen und KPI-Trends. Widgets können individuell angepasst und angeordnet werden. Wichtige Benachrichtigungen und Erinnerungen werden prominent angezeigt.",
      whyItHelps:
        "Statt morgens mehrere Systeme zu prüfen, starten Sie den Tag mit einer einzigen Übersicht. Sie erkennen sofort, wo Handlungsbedarf besteht, und können direkt zu den relevanten Bereichen navigieren. Das spart täglich wertvolle Minuten und reduziert die Gefahr, etwas zu übersehen.",
    },
    iconName: "LayoutDashboard",
    color: "bg-blue-500/10 text-blue-600",
    heroImage: "/features/dashboard-overview-blue-modern.jpg",
    benefits: [
      { title: "Sofort-Überblick", description: "Alle wichtigen Informationen auf einen Blick nach dem Login" },
      { title: "Personalisierbar", description: "Widgets und Kennzahlen individuell anordnen" },
      { title: "Echtzeit-Daten", description: "Automatische Aktualisierung aller Kennzahlen in Echtzeit" },
      { title: "Schnellzugriff", description: "Direkt zu offenen Aufgaben, Terminen und Meldungen springen" },
    ],
    features: [
      { title: "KPI-Widgets", description: "Konfigurierbare Kennzahlen-Kacheln mit Trend-Anzeige", iconName: "Gauge" },
      { title: "Aufgaben-Übersicht", description: "Offene und fällige Aufgaben auf einen Blick", iconName: "CheckSquare" },
      { title: "Team-Status", description: "Wer ist heute da, wer ist krank oder im Urlaub", iconName: "Users" },
      { title: "Benachrichtigungen", description: "Wichtige Meldungen und Erinnerungen zentral gesammelt", iconName: "Bell" },
    ],
    useCases: [
      { title: "Morgenroutine", description: "Starten Sie den Tag mit einer vollständigen Übersicht aller Praxis-Aktivitäten." },
      { title: "Schnelle Entscheidungen", description: "Erkennen Sie auf einen Blick, wo heute Handlungsbedarf besteht." },
    ],
    faq: [
      { question: "Kann ich das Dashboard anpassen?", answer: "Ja, Sie können Widgets hinzufügen, entfernen und die Anordnung nach Ihren Bedürfnissen ändern." },
      { question: "Sehe ich nur meine eigenen Daten?", answer: "Je nach Rolle sehen Sie Ihre persönlichen oder teamweite Daten. Praxisinhaber haben die vollständige Übersicht." },
    ],
    relatedFeatureSlugs: ["ki-praxisanalyse", "praxis-auswertung", "aufgaben"],
    metaTitle: "Dashboard | Zentrale Praxis-Übersicht | Effizienz Praxis",
    metaDescription:
      "Das Dashboard zeigt alle wichtigen Praxis-Kennzahlen auf einen Blick: Termine, Aufgaben, Team-Status und KPIs in einer personalisierbaren Übersicht.",
  },
  {
    slug: "dienstplan",
    title: "Dienstplan",
    subtitle: "Schichtplanung und Dienste übersichtlich organisieren",
    description:
      "Erstellen Sie Dienstpläne für Ihr gesamtes Team mit Drag-and-Drop. Berücksichtigen Sie Wunschdienste, Qualifikationen und Arbeitszeitgesetze automatisch.",
    detailedDescription: {
      intro:
        "Der Dienstplan digitalisiert Ihre komplette Schichtplanung. Statt Excel-Tabellen oder Papier-Aushänge nutzen Sie ein intelligentes System, das Verfügbarkeiten, Qualifikationen und rechtliche Vorgaben automatisch berücksichtigt. Ihr Team hat jederzeit mobil Zugriff auf den aktuellen Plan.",
      howItWorks:
        "Sie definieren Schichtmodelle und Besetzungsanforderungen. Das System berücksichtigt beim Erstellen des Plans automatisch Urlaubstage, Krankmeldungen, Teilzeit-Regelungen und Arbeitszeitgesetze. Mitarbeiter können Dienstwünsche und Tausch-Anfragen direkt im System eingeben. Änderungen werden in Echtzeit synchronisiert und das Team per Push-Benachrichtigung informiert.",
      whyItHelps:
        "Die Dienstplanung gehört zu den zeitaufwändigsten Verwaltungsaufgaben in einer Praxis. Unser System reduziert den Planungsaufwand um bis zu 70% und minimiert Konflikte durch transparente Regeln. Ihr Team hat immer den aktuellen Plan dabei und Sie behalten die volle Kontrolle über die Besetzung.",
    },
    iconName: "CalendarClock",
    color: "bg-teal-500/10 text-teal-600",
    heroImage: "/features/dienstplan-shift-planning-teal.jpg",
    benefits: [
      { title: "Drag-and-Drop Planung", description: "Intuitives Erstellen und Anpassen von Dienstplänen" },
      { title: "Regelbasiert", description: "Automatische Berücksichtigung von Arbeitszeitgesetzen und Qualifikationen" },
      { title: "Diensttausch", description: "Mitarbeiter können Tausch-Anfragen direkt im System stellen" },
      { title: "Mobile Ansicht", description: "Jeder hat den aktuellen Plan immer auf dem Smartphone" },
      { title: "Konflikterkennung", description: "Automatische Warnung bei Doppelbelegungen oder Verstößen" },
    ],
    features: [
      { title: "Wochenplaner", description: "Übersichtliche Wochen- und Monatsansicht für die Planung", iconName: "Calendar" },
      { title: "Schichtvorlagen", description: "Wiederverwendbare Vorlagen für wiederkehrende Dienstpläne", iconName: "Shuffle" },
      { title: "Verfügbarkeiten", description: "Mitarbeiter geben Wünsche und Verfügbarkeiten selbst ein", iconName: "UserCheck" },
      { title: "Besetzungsregeln", description: "Mindestbesetzung und Qualifikationsanforderungen pro Schicht", iconName: "Shield" },
    ],
    useCases: [
      { title: "Wöchentliche Planung", description: "Erstellen Sie den Wochenplan für alle Mitarbeiter in wenigen Minuten." },
      { title: "Vertretungsregelung", description: "Bei kurzfristigen Ausfällen schnell eine passende Vertretung finden." },
      { title: "Urlaubsplanung", description: "Integrierte Urlaubsübersicht verhindert Engpässe bei der Besetzung." },
    ],
    faq: [
      { question: "Werden Arbeitszeitgesetze automatisch geprüft?", answer: "Ja, das System prüft automatisch Ruhezeiten, Maximalarbeitszeiten und weitere gesetzliche Vorgaben." },
      { question: "Können Mitarbeiter ihre Wunschdienste eingeben?", answer: "Ja, über die App können Mitarbeiter Verfügbarkeiten und Dienstwünsche direkt einreichen." },
    ],
    relatedFeatureSlugs: ["zeiterfassung", "kalender", "team-management"],
    metaTitle: "Dienstplan | Schichtplanung für Arztpraxen | Effizienz Praxis",
    metaDescription:
      "Digitale Dienstplanung für Ihre Praxis: Drag-and-Drop Schichtplanung, automatische Regelprüfung und mobile Ansicht für das Team.",
  },
  {
    slug: "zeiterfassung",
    title: "Zeiterfassung",
    subtitle: "Arbeitszeiten digital und gesetzeskonform erfassen",
    description:
      "Erfassen Sie Arbeitszeiten, Pausen und Überstunden einfach und rechtskonform. Automatische Berechnungen, Monatsübersichten und Export für die Lohnbuchhaltung.",
    detailedDescription: {
      intro:
        "Die digitale Zeiterfassung ersetzt Stundenzettel und Excel-Tabellen durch ein modernes, gesetzeskonformes System. Mitarbeiter stempeln sich per App oder am Praxis-Terminal ein und aus. Alle Daten werden automatisch berechnet und stehen sofort für die Lohnbuchhaltung bereit.",
      howItWorks:
        "Mitarbeiter erfassen ihre Zeiten per Ein-Klick-Stempeln in der App. Pausen werden automatisch oder manuell erfasst. Das System berechnet Soll-/Ist-Stunden, Überstunden und Zuschläge automatisch. Monatsabschlüsse können per Knopfdruck erstellt und an die Lohnbuchhaltung exportiert werden. Korrekturen erfolgen transparent mit Genehmigungsworkflow.",
      whyItHelps:
        "Seit der Pflicht zur Arbeitszeiterfassung benötigt jede Praxis ein verlässliches System. Unsere Lösung erfüllt alle gesetzlichen Anforderungen, spart Zeit bei der Abrechnung und gibt Ihnen jederzeit einen Überblick über die tatsächlich geleisteten Arbeitsstunden Ihres Teams.",
    },
    iconName: "Clock",
    color: "bg-slate-500/10 text-slate-600",
    heroImage: "/features/zeiterfassung-time-tracking-slate.jpg",
    benefits: [
      { title: "Ein-Klick-Stempeln", description: "Einfaches Ein- und Ausstempeln per App oder Terminal" },
      { title: "Gesetzeskonform", description: "Erfüllt alle Anforderungen der Arbeitszeiterfassungspflicht" },
      { title: "Automatische Berechnung", description: "Soll-/Ist-Vergleich, Überstunden und Zuschläge automatisch" },
      { title: "Export", description: "Nahtloser Export für DATEV und gängige Lohnbuchhaltungssysteme" },
    ],
    features: [
      { title: "Stempeluhr", description: "Digitale Ein-/Ausstempelung mit Standort-Verifizierung", iconName: "Clock" },
      { title: "Monatsübersicht", description: "Detaillierte Arbeitszeitübersicht pro Mitarbeiter und Monat", iconName: "Calendar" },
      { title: "Überstundenkonto", description: "Automatische Überstundenberechnung und Kontoführung", iconName: "Activity" },
      { title: "Pausenregelung", description: "Automatische Pausenerkennung und gesetzliche Pausenprüfung", iconName: "Shield" },
    ],
    useCases: [
      { title: "Tägliches Stempeln", description: "Mitarbeiter stempeln sich morgens ein und abends aus – automatische Pausenerfassung inklusive." },
      { title: "Monatsabschluss", description: "Am Monatsende exportieren Sie alle Zeiten für den Steuerberater mit einem Klick." },
    ],
    faq: [
      { question: "Ist die Zeiterfassung DSGVO-konform?", answer: "Ja, alle Daten werden DSGVO-konform in Deutschland gespeichert und verarbeitet." },
      { question: "Können Korrekturen vorgenommen werden?", answer: "Ja, mit einem transparenten Genehmigungsworkflow können Zeiten korrigiert werden." },
    ],
    relatedFeatureSlugs: ["dienstplan", "team-management", "kalender"],
    metaTitle: "Zeiterfassung | Digitale Arbeitszeiterfassung für Arztpraxen | Effizienz Praxis",
    metaDescription:
      "Gesetzeskonforme digitale Zeiterfassung für Ihre Praxis: Ein-Klick-Stempeln, automatische Überstundenberechnung und Export für die Lohnbuchhaltung.",
  },
  {
    slug: "hygieneplan",
    title: "Hygieneplan",
    subtitle: "RKI-konforme Hygienepläne erstellen und verwalten",
    description:
      "Erstellen Sie rechtssichere Hygienepläne nach RKI-Richtlinien. Mit KI-Unterstützung, automatischen Erinnerungen und vollständiger Dokumentation für Prüfungen.",
    detailedDescription: {
      intro:
        "Der Hygieneplan ist eines der wichtigsten QM-Dokumente in jeder Arztpraxis. Unser System unterstützt Sie bei der Erstellung, Pflege und Überwachung RKI-konformer Hygienepläne. Von der Flächendesinfektion bis zur Aufbereitung von Medizinprodukten – alle Bereiche werden abgedeckt.",
      howItWorks:
        "Wählen Sie aus RKI-konformen Vorlagen oder erstellen Sie individuelle Hygienepläne. Die KI analysiert Ihre Praxisstruktur und schlägt passende Maßnahmen vor. Automatische Erinnerungen stellen sicher, dass Desinfektionsprotokolle und Reinigungspläne eingehalten werden. Bei Begehungen durch das Gesundheitsamt haben Sie alle Nachweise digital griffbereit.",
      whyItHelps:
        "Hygieneverstöße können zu empfindlichen Bußgeldern und Reputationsschäden führen. Unser System sorgt dafür, dass Sie jederzeit auf dem aktuellen Stand der RKI-Empfehlungen sind, alle Maßnahmen lückenlos dokumentiert werden und Ihr Team die Hygienestandards zuverlässig einhält.",
    },
    iconName: "ShieldCheck",
    color: "bg-emerald-500/10 text-emerald-600",
    benefits: [
      { title: "RKI-konform", description: "Alle Pläne basieren auf aktuellen RKI-Richtlinien und Empfehlungen" },
      { title: "KI-Unterstützung", description: "Automatische Vorschläge für Hygienemaßnahmen passend zu Ihrer Praxis" },
      { title: "Prüfungssicher", description: "Vollständige Dokumentation für Begehungen und Audits" },
      { title: "Automatische Erinnerungen", description: "Keine vergessenen Protokolle dank intelligenter Erinnerungen" },
      { title: "Kategorisiert", description: "Übersichtliche Gliederung nach Bereichen und Maßnahmentypen" },
    ],
    features: [
      { title: "RKI-Vorlagen", description: "Fertige Vorlagen nach aktuellen RKI-Empfehlungen", iconName: "Shield" },
      { title: "Desinfektionsprotokolle", description: "Digitale Erfassung aller Reinigungs- und Desinfektionsmaßnahmen", iconName: "ClipboardCheck" },
      { title: "KI-Hygiene-Analyse", description: "Automatische Analyse und Verbesserungsvorschläge für Ihre Hygienepläne", iconName: "Brain" },
      { title: "Dokumenten-Export", description: "Export als PDF für Begehungen und externe Audits", iconName: "Download" },
    ],
    useCases: [
      { title: "Gesundheitsamt-Begehung", description: "Alle Hygienedokumente digital und prüfungssicher auf Knopfdruck bereit." },
      { title: "Neue Mitarbeiter", description: "Einweisung in Hygienestandards mit dokumentierter Kenntnisnahme." },
      { title: "RKI-Aktualisierungen", description: "Bei neuen RKI-Empfehlungen werden Sie automatisch benachrichtigt." },
    ],
    faq: [
      { question: "Werden die Vorlagen bei neuen RKI-Richtlinien aktualisiert?", answer: "Ja, unsere Vorlagen werden regelmäßig an aktuelle RKI-Empfehlungen angepasst. Sie werden bei relevanten Änderungen benachrichtigt." },
      { question: "Kann ich den Hygieneplan an meine Praxis anpassen?", answer: "Ja, alle Vorlagen sind vollständig anpassbar. Sie können Bereiche, Maßnahmen und Intervalle individuell konfigurieren." },
    ],
    relatedFeatureSlugs: ["wissen-qm", "cirs-meldungen", "dokumente"],
    metaTitle: "Hygieneplan | RKI-konforme Hygienepläne für Arztpraxen | Effizienz Praxis",
    metaDescription:
      "Erstellen Sie RKI-konforme Hygienepläne mit KI-Unterstützung. Automatische Erinnerungen, Desinfektionsprotokolle und prüfungssichere Dokumentation.",
  },
  {
    slug: "cirs-meldungen",
    title: "CIRS-Meldungen",
    subtitle: "Verbesserungsmeldungen und Beinahe-Fehler systematisch erfassen",
    description:
      "Ein anonymes Meldesystem für Vorfälle und Beinahe-Fehler. Fördern Sie eine offene Fehlerkultur und verbessern Sie kontinuierlich die Patientensicherheit.",
    detailedDescription: {
      intro:
        "CIRS (Critical Incident Reporting System) ist ein zentrales Element des Qualitätsmanagements. Unser Meldesystem ermöglicht es allen Mitarbeitern, Vorfälle, Beinahe-Fehler und Verbesserungsvorschläge einfach und bei Bedarf anonym zu melden. So schaffen Sie eine offene Fehlerkultur, die zur kontinuierlichen Verbesserung beiträgt.",
      howItWorks:
        "Mitarbeiter melden Vorfälle über ein einfaches Formular – optional anonym. Jede Meldung wird kategorisiert, einer Schweregrad-Stufe zugeordnet und durchläuft einen strukturierten Bearbeitungsworkflow. Das Qualitätsmanagement-Team analysiert die Meldungen, definiert Maßnahmen und dokumentiert die Umsetzung. Regelmäßige Auswertungen zeigen Häufungen und Trends.",
      whyItHelps:
        "Studien zeigen, dass eine offene Fehlerkultur die Patientensicherheit signifikant verbessert. Durch die systematische Erfassung und Analyse von Vorfällen erkennen Sie wiederkehrende Muster, können präventive Maßnahmen ergreifen und aus Beinahe-Fehlern lernen, bevor sie zu echten Schäden führen.",
    },
    iconName: "ShieldAlert",
    color: "bg-red-500/10 text-red-600",
    benefits: [
      { title: "Anonyme Meldungen", description: "Mitarbeiter können Vorfälle anonym melden ohne Angst vor Konsequenzen" },
      { title: "Strukturierter Workflow", description: "Jede Meldung durchläuft einen klaren Bearbeitungsprozess" },
      { title: "Kategorisierung", description: "Automatische Zuordnung nach Kategorie und Schweregrad" },
      { title: "Trendanalyse", description: "Erkennung von Häufungen und wiederkehrenden Mustern" },
      { title: "Maßnahmen-Tracking", description: "Dokumentation und Nachverfolgung aller eingeleiteten Maßnahmen" },
    ],
    features: [
      { title: "Meldeformular", description: "Einfaches, geführtes Formular für schnelle Meldungen", iconName: "FileText" },
      { title: "Anonymitätsschutz", description: "Optionale Anonymisierung zum Schutz der Meldenden", iconName: "Shield" },
      { title: "Schweregrad-Bewertung", description: "Standardisierte Risikobewertung jeder Meldung", iconName: "AlertTriangle" },
      { title: "Auswertung", description: "Statistische Auswertungen und Trendberichte", iconName: "BarChart3" },
    ],
    useCases: [
      { title: "Beinahe-Fehler melden", description: "Ein Mitarbeiter bemerkt eine Verwechslungsgefahr und meldet diese anonym im System." },
      { title: "Quartals-Auswertung", description: "Analysieren Sie vierteljährlich alle Meldungen und leiten Sie Verbesserungsmaßnahmen ab." },
    ],
    faq: [
      { question: "Können Meldungen wirklich anonym abgegeben werden?", answer: "Ja, bei anonymer Meldung werden keinerlei personenbezogene Daten gespeichert – auch nicht IP-Adressen." },
      { question: "Ist CIRS gesetzlich vorgeschrieben?", answer: "Ein CIRS ist Teil des Qualitätsmanagements, das für Arztpraxen verpflichtend ist. Es zeigt Ihr Engagement für Patientensicherheit." },
    ],
    relatedFeatureSlugs: ["hygieneplan", "wissen-qm", "workflows-checklisten"],
    metaTitle: "CIRS-Meldungen | Fehlermeldesystem für Arztpraxen | Effizienz Praxis",
    metaDescription:
      "Anonymes CIRS-Meldesystem für Vorfälle und Beinahe-Fehler. Fördern Sie eine offene Fehlerkultur und verbessern Sie die Patientensicherheit.",
  },
  {
    slug: "academy",
    title: "Academy",
    subtitle: "E-Learning-Plattform mit Kursen und Onboarding",
    description:
      "Eine integrierte Lernplattform für Ihr Praxisteam. Vom strukturierten Onboarding neuer Mitarbeiter bis zu fortlaufenden Schulungen – alles digital und nachverfolgbar.",
    detailedDescription: {
      intro:
        "Die Academy ist Ihre praxiseigene E-Learning-Plattform. Erstellen Sie Onboarding-Kurse, Pflichtschulungen und Weiterbildungsinhalte direkt im System. Mitarbeiter können Kurse in ihrem eigenen Tempo absolvieren und Sie behalten den Überblick über den Lernfortschritt.",
      howItWorks:
        "Erstellen Sie Kurse aus verschiedenen Bausteinen: Texte, Videos, Quizze und praktische Aufgaben. Ordnen Sie Kurse bestimmten Rollen oder Teams zu. Neue Mitarbeiter erhalten automatisch ihren Onboarding-Lernpfad. Das System trackt den Fortschritt, versendet Erinnerungen bei ausstehenden Pflichtschulungen und stellt Zertifikate nach erfolgreichem Abschluss aus.",
      whyItHelps:
        "Gut geschulte Mitarbeiter arbeiten effizienter und machen weniger Fehler. Die Academy standardisiert Ihr Wissen und macht es für alle zugänglich. Statt jede Schulung persönlich durchzuführen, können Sie Inhalte einmal erstellen und beliebig oft nutzen. Das spart Zeit und stellt sicher, dass alle den gleichen Wissensstand haben.",
    },
    iconName: "BookOpenCheck",
    color: "bg-indigo-500/10 text-indigo-600",
    benefits: [
      { title: "Strukturiertes Onboarding", description: "Neue Mitarbeiter werden systematisch eingearbeitet" },
      { title: "Pflichtschulungen", description: "Automatische Zuweisung und Erinnerung bei Pflichtschulungen" },
      { title: "Fortschrittstracking", description: "Überblick über den Lernfortschritt aller Mitarbeiter" },
      { title: "Zertifikate", description: "Automatische Zertifikatserstellung nach Kursabschluss" },
    ],
    features: [
      { title: "Kurs-Builder", description: "Erstellen Sie Kurse aus Texten, Videos und Quizzen", iconName: "ListChecks" },
      { title: "Lernpfade", description: "Definieren Sie aufeinander aufbauende Kurssequenzen", iconName: "Shuffle" },
      { title: "Quiz-System", description: "Wissensüberprüfung mit automatischer Auswertung", iconName: "ClipboardCheck" },
      { title: "Reporting", description: "Detaillierte Berichte über Kursabschlüsse und Wissenslücken", iconName: "BarChart3" },
    ],
    useCases: [
      { title: "Onboarding", description: "Neue Mitarbeiter absolvieren einen strukturierten Einarbeitungsplan mit allen relevanten Kursen." },
      { title: "Jährliche Pflichtschulung", description: "Brandschutz, Hygiene und Datenschutz als wiederkehrende Pflichtschulungen verwalten." },
    ],
    faq: [
      { question: "Kann ich eigene Kursinhalte erstellen?", answer: "Ja, der integrierte Kurs-Builder ermöglicht das Erstellen von Kursen ohne technische Vorkenntnisse." },
      { question: "Werden Kursabschlüsse dokumentiert?", answer: "Ja, alle Abschlüsse werden revisionssicher dokumentiert und Zertifikate automatisch erstellt." },
    ],
    relatedFeatureSlugs: ["fortbildung", "team-management", "wissen-qm"],
    metaTitle: "Academy | E-Learning-Plattform für Arztpraxen | Effizienz Praxis",
    metaDescription:
      "Integrierte E-Learning-Plattform für Arztpraxen: Onboarding, Pflichtschulungen und Weiterbildung mit Fortschrittstracking und Zertifikaten.",
  },
  {
    slug: "leadership",
    title: "Leadership",
    subtitle: "Führungskompetenzen entwickeln und Teamkultur stärken",
    description:
      "Tools und Frameworks für die Entwicklung Ihrer Führungskompetenzen. Stärken Sie Ihre Führungskultur mit strukturierten Feedback-Methoden und Coaching-Impulsen.",
    detailedDescription: {
      intro:
        "Leadership in der Arztpraxis erfordert besondere Kompetenzen. Sie führen ein interdisziplinäres Team unter Zeitdruck und hoher Verantwortung. Unser Leadership-Modul bietet Ihnen praktische Werkzeuge, Frameworks und Reflexionshilfen, um Ihre Führungsarbeit kontinuierlich zu verbessern.",
      howItWorks:
        "Das Modul bietet Führungstipps, Selbstreflexions-Tools und Teamkultur-Analysen. Sie definieren Ihre Führungsgrundsätze, setzen sich Entwicklungsziele und erhalten regelmäßige Impulse. Anonymes Team-Feedback zeigt Ihnen, wie Ihre Führung wahrgenommen wird. Konkrete Handlungsempfehlungen helfen bei der Umsetzung.",
      whyItHelps:
        "Gute Führung ist der wichtigste Faktor für Mitarbeiterzufriedenheit und Teamperformance. Das Leadership-Modul gibt Ihnen Struktur und Orientierung – ohne dass Sie teure externe Coaching-Programme benötigen. Regelmäßige Reflexion und Feedback machen Sie zu einer besseren Führungskraft.",
    },
    iconName: "Crown",
    color: "bg-amber-500/10 text-amber-600",
    benefits: [
      { title: "Selbstreflexion", description: "Strukturierte Tools zur Reflexion Ihres Führungsstils" },
      { title: "Team-Feedback", description: "Anonymes Feedback von Ihrem Team zu Ihrer Führungsarbeit" },
      { title: "Führungsgrundsätze", description: "Definieren und kommunizieren Sie Ihre Führungswerte" },
      { title: "Coaching-Impulse", description: "Regelmäßige Impulse und Tipps für den Führungsalltag" },
    ],
    features: [
      { title: "Führungsprofil", description: "Definieren Sie Ihren persönlichen Führungsstil und Ihre Werte", iconName: "Heart" },
      { title: "360°-Feedback", description: "Anonymes Feedback aus verschiedenen Perspektiven", iconName: "Users" },
      { title: "Entwicklungsziele", description: "Setzen Sie sich konkrete Ziele für Ihre Führungsentwicklung", iconName: "Target" },
      { title: "Wissens-Bibliothek", description: "Artikel und Frameworks zu moderner Führung", iconName: "BookOpen" },
    ],
    useCases: [
      { title: "Quartalsgespräche", description: "Nutzen Sie die Reflexions-Tools zur Vorbereitung auf Führungsgespräche." },
      { title: "Teamkultur-Analyse", description: "Verstehen Sie, wie Ihr Team die Zusammenarbeit und Führung bewertet." },
    ],
    faq: [
      { question: "Ist das Feedback wirklich anonym?", answer: "Ja, die Anonymität wird technisch garantiert. Es werden keine Rückschlüsse auf einzelne Personen ermöglicht." },
      { question: "Brauche ich Führungserfahrung?", answer: "Nein, das Modul eignet sich sowohl für erfahrene Führungskräfte als auch für Einsteiger." },
    ],
    relatedFeatureSlugs: ["wellbeing", "mitarbeitergespraeche", "team-management"],
    metaTitle: "Leadership | Führungsentwicklung für Arztpraxen | Effizienz Praxis",
    metaDescription:
      "Entwickeln Sie Ihre Führungskompetenzen mit strukturierten Tools: Selbstreflexion, Team-Feedback und Coaching-Impulse für Praxisinhaber.",
  },
  {
    slug: "wellbeing",
    title: "Mitarbeiter-Wellbeing",
    subtitle: "Teamzufriedenheit messen und Wohlbefinden fördern",
    description:
      "Erfassen Sie die Stimmung und das Wohlbefinden Ihres Teams mit regelmäßigen Pulsbefragungen. Erkennen Sie Belastungen frühzeitig und fördern Sie eine positive Arbeitsatmosphäre.",
    detailedDescription: {
      intro:
        "In Zeiten von Fachkräftemangel ist die Mitarbeiterzufriedenheit ein entscheidender Wettbewerbsfaktor. Das Wellbeing-Modul gibt Ihnen ein wissenschaftlich fundiertes Instrument, um die Zufriedenheit und das Wohlbefinden Ihres Teams kontinuierlich zu messen und gezielt zu verbessern.",
      howItWorks:
        "Regelmäßige, kurze Pulsbefragungen (2-3 Minuten) erfassen die Stimmung im Team. Die Ergebnisse werden anonymisiert ausgewertet und in Trends dargestellt. Bei kritischen Werten erhalten Sie automatische Benachrichtigungen. Das System schlägt evidenzbasierte Maßnahmen vor und hilft bei der Umsetzung.",
      whyItHelps:
        "Zufriedene Mitarbeiter sind produktiver, machen weniger Fehler und bleiben Ihnen länger treu. Regelmäßiges Wellbeing-Monitoring hilft Ihnen, Probleme frühzeitig zu erkennen – bevor sie zu Kündigungen führen. Die Investition in das Wohlbefinden Ihres Teams zahlt sich durch geringere Fluktuation und höhere Leistung aus.",
    },
    iconName: "Smile",
    color: "bg-green-500/10 text-green-600",
    benefits: [
      { title: "Pulsbefragungen", description: "Kurze, regelmäßige Stimmungsabfragen in nur 2-3 Minuten" },
      { title: "Anonyme Auswertung", description: "Ehrliche Rückmeldungen durch garantierte Anonymität" },
      { title: "Trend-Erkennung", description: "Langfristige Trends in der Teamzufriedenheit erkennen" },
      { title: "Frühwarnsystem", description: "Automatische Benachrichtigung bei kritischen Werten" },
    ],
    features: [
      { title: "Stimmungsbarometer", description: "Schnelle tägliche oder wöchentliche Stimmungserfassung", iconName: "HeartPulse" },
      { title: "Wellbeing-Index", description: "Zusammenfassender Score aus mehreren Dimensionen", iconName: "Gauge" },
      { title: "Maßnahmen-Katalog", description: "Evidenzbasierte Vorschläge zur Verbesserung des Wohlbefindens", iconName: "Lightbulb" },
      { title: "Team-Vergleich", description: "Anonymisierte Vergleiche zwischen Abteilungen oder Zeiträumen", iconName: "BarChart3" },
    ],
    useCases: [
      { title: "Wöchentlicher Puls-Check", description: "Jeden Freitag bewerten Mitarbeiter ihre Woche in 2 Minuten – Sie erkennen Trends sofort." },
      { title: "Nach Veränderungen", description: "Messen Sie die Stimmung gezielt nach organisatorischen Veränderungen." },
    ],
    faq: [
      { question: "Wie oft sollten Befragungen durchgeführt werden?", answer: "Wir empfehlen wöchentliche Kurzbefragungen und monatliche ausführlichere Check-Ins." },
      { question: "Kann ich sehen, wer was geantwortet hat?", answer: "Nein, die Anonymität ist technisch garantiert. Sie sehen nur aggregierte Ergebnisse." },
    ],
    relatedFeatureSlugs: ["leadership", "mitarbeitergespraeche", "team-management"],
    metaTitle: "Mitarbeiter-Wellbeing | Teamzufriedenheit messen | Effizienz Praxis",
    metaDescription:
      "Messen Sie die Zufriedenheit Ihres Praxisteams mit Pulsbefragungen. Frühwarnsystem, Trend-Analysen und evidenzbasierte Maßnahmen für eine positive Arbeitsatmosphäre.",
  },
  {
    slug: "mitarbeitergespraeche",
    title: "Mitarbeitergespräche",
    subtitle: "Strukturierte Feedbackgespräche planen und dokumentieren",
    description:
      "Führen Sie regelmäßige, strukturierte Mitarbeitergespräche mit Gesprächsleitfäden, Zielverfolgung und lückenloser Dokumentation.",
    detailedDescription: {
      intro:
        "Regelmäßige Mitarbeitergespräche sind das Fundament guter Führung. Unser System unterstützt Sie bei der Planung, Durchführung und Nachbereitung – von Jahresgesprächen über Feedback-Runden bis zu Entwicklungsgesprächen. Alles wird dokumentiert und Vereinbarungen nachverfolgt.",
      howItWorks:
        "Planen Sie Gespräche im Kalender, wählen Sie passende Gesprächsleitfäden und bereiten Sie sich mit der Vorbereitungsvorlage vor. Während des Gesprächs dokumentieren Sie Themen, Vereinbarungen und Ziele direkt im System. Nach dem Gespräch können beide Seiten das Protokoll einsehen und bestätigen. Vereinbarte Maßnahmen werden automatisch als Aufgaben angelegt.",
      whyItHelps:
        "Ohne Struktur werden Mitarbeitergespräche oft aufgeschoben oder verlaufen unproduktiv. Unsere Leitfäden geben Ihnen einen roten Faden, die Dokumentation schafft Verbindlichkeit und die Zielverfolgung stellt sicher, dass Vereinbarungen auch umgesetzt werden. So werden Gespräche zu echten Entwicklungsgesprächen.",
    },
    iconName: "MessageSquare",
    color: "bg-blue-500/10 text-blue-600",
    benefits: [
      { title: "Gesprächsleitfäden", description: "Strukturierte Vorlagen für verschiedene Gesprächstypen" },
      { title: "Vorbereitung", description: "Checklisten und Vorbereitungsbögen für beide Seiten" },
      { title: "Dokumentation", description: "Lückenlose, beidseitig bestätigte Gesprächsprotokolle" },
      { title: "Ziel-Tracking", description: "Automatische Nachverfolgung vereinbarter Maßnahmen und Ziele" },
    ],
    features: [
      { title: "Gesprächsvorlagen", description: "Vorgefertigte Leitfäden für Jahres-, Feedback- und Entwicklungsgespräche", iconName: "FileText" },
      { title: "Terminplanung", description: "Automatische Erinnerungen an anstehende Gespräche", iconName: "Calendar" },
      { title: "Zielvereinbarungen", description: "Gemeinsam definierte Ziele mit Meilensteinen und Fristen", iconName: "Target" },
      { title: "Gesprächshistorie", description: "Vollständige Historie aller bisherigen Gespräche pro Mitarbeiter", iconName: "Archive" },
    ],
    useCases: [
      { title: "Jahresgespräch", description: "Strukturiertes Jahresgespräch mit Rückblick, Zielbewertung und neuen Vereinbarungen." },
      { title: "Probezeitgespräch", description: "Standardisierte Bewertung nach 3 und 6 Monaten mit klaren Kriterien." },
    ],
    faq: [
      { question: "Können Mitarbeiter sich auch vorbereiten?", answer: "Ja, beide Seiten erhalten Vorbereitungsbögen und können vorab Themen einreichen." },
      { question: "Wer hat Zugriff auf die Protokolle?", answer: "Nur der Mitarbeiter selbst und die direkte Führungskraft. Auf Wunsch kann der Zugang erweitert werden." },
    ],
    relatedFeatureSlugs: ["leadership", "wellbeing", "team-management"],
    metaTitle: "Mitarbeitergespräche | Strukturierte Feedbackgespräche | Effizienz Praxis",
    metaDescription:
      "Führen Sie strukturierte Mitarbeitergespräche mit Leitfäden, Dokumentation und Zielverfolgung. Für Jahresgespräche, Feedback-Runden und Entwicklungsgespräche.",
  },
  {
    slug: "selbst-check",
    title: "Selbst-Check",
    subtitle: "Persönliche Selbsteinschätzung und Entwicklungsziele",
    description:
      "Ermöglichen Sie Ihrem Team eine strukturierte Selbsteinschätzung der eigenen Kompetenzen und Leistung. Fördern Sie Eigenverantwortung und persönliche Entwicklung.",
    detailedDescription: {
      intro:
        "Der Selbst-Check gibt jedem Teammitglied die Möglichkeit, die eigene Leistung und Kompetenzen regelmäßig zu reflektieren. Strukturierte Fragebögen und Bewertungsskalen machen die Selbsteinschätzung messbar und vergleichbar. Im Zusammenspiel mit Mitarbeitergesprächen entsteht ein vollständiges Bild der persönlichen Entwicklung.",
      howItWorks:
        "Mitarbeiter füllen regelmäßig einen Selbsteinschätzungsbogen aus, der fachliche und überfachliche Kompetenzen abdeckt. Die Ergebnisse werden in einem persönlichen Entwicklungsprofil zusammengefasst. Stärken und Entwicklungsfelder werden visuell dargestellt. Mitarbeiter können sich eigene Entwicklungsziele setzen und den Fortschritt verfolgen.",
      whyItHelps:
        "Selbstreflexion ist der erste Schritt zur Verbesserung. Der Selbst-Check fördert die Eigenverantwortung und gibt Mitarbeitern ein Werkzeug, ihre berufliche Entwicklung aktiv zu gestalten. Führungskräfte erhalten wertvolle Einblicke in die Selbstwahrnehmung ihres Teams.",
    },
    iconName: "ClipboardCheck",
    color: "bg-purple-500/10 text-purple-600",
    benefits: [
      { title: "Strukturierte Reflexion", description: "Wissenschaftlich fundierte Fragebögen zur Selbsteinschätzung" },
      { title: "Entwicklungsprofil", description: "Persönliches Kompetenzprofil mit Stärken und Entwicklungsfeldern" },
      { title: "Zielplanung", description: "Eigene Entwicklungsziele setzen und Fortschritt verfolgen" },
      { title: "Vergleich", description: "Abgleich von Selbst- und Fremdeinschätzung für ein realistisches Bild" },
    ],
    features: [
      { title: "Kompetenz-Radar", description: "Visuelle Darstellung der Selbsteinschätzung als Radar-Diagramm", iconName: "Activity" },
      { title: "Fortschritts-Tracking", description: "Verfolgen Sie Ihre Entwicklung über Zeit", iconName: "TrendingUp" },
      { title: "Entwicklungsvorschläge", description: "KI-basierte Vorschläge für passende Weiterbildungen", iconName: "Lightbulb" },
      { title: "Vergleichsansicht", description: "Abgleich von Selbst- und Führungskraft-Einschätzung", iconName: "ArrowRightLeft" },
    ],
    useCases: [
      { title: "Vor Mitarbeitergesprächen", description: "Füllen Sie den Selbst-Check als Vorbereitung auf das Jahresgespräch aus." },
      { title: "Quartalsreflexion", description: "Regelmäßige Standortbestimmung alle drei Monate." },
    ],
    faq: [
      { question: "Sieht mein Vorgesetzter meine Selbsteinschätzung?", answer: "Nur wenn Sie dies aktiv freigeben, z.B. im Rahmen eines Mitarbeitergesprächs." },
      { question: "Welche Kompetenzen werden abgefragt?", answer: "Fachliche, methodische, soziale und persönliche Kompetenzen – anpassbar an Ihre Praxis." },
    ],
    relatedFeatureSlugs: ["mitarbeitergespraeche", "skills-management", "fortbildung"],
    metaTitle: "Selbst-Check | Persönliche Kompetenzeinschätzung | Effizienz Praxis",
    metaDescription:
      "Strukturierte Selbsteinschätzung für Praxismitarbeiter: Kompetenzbewertung, Entwicklungsprofil und persönliche Zielplanung.",
  },
  {
    slug: "geraete",
    title: "Geräte",
    subtitle: "Medizingeräte, Einweisungen und Wartung verwalten",
    description:
      "Verwalten Sie alle medizinischen Geräte Ihrer Praxis: Einweisungen (MPBetreibV), Wartungsintervalle, Prüfprotokolle und den kompletten Gerätelebenszyklus.",
    detailedDescription: {
      intro:
        "Die Geräteverwaltung digitalisiert das komplette Management Ihrer Medizingeräte. Von der Anschaffung über die Einweisung aller Mitarbeiter bis zur regelmäßigen Wartung und Sicherheitstechnischen Kontrolle (STK) – alles an einem Ort. Die lückenlose Dokumentation erfüllt alle Anforderungen der Medizinprodukte-Betreiberverordnung (MPBetreibV).",
      howItWorks:
        "Erfassen Sie alle Geräte mit technischen Daten, Standort und Verantwortlichen. Für jedes Gerät verwalten Sie Einweisungen (wer wurde wann eingewiesen), Wartungsintervalle und Prüfprotokolle. Automatische Erinnerungen stellen sicher, dass keine Wartung oder STK versäumt wird. Bei Neuanschaffungen wird automatisch eine Einweisungs-Checkliste für alle relevanten Mitarbeiter erstellt.",
      whyItHelps:
        "Die Dokumentation von Geräteeinweisungen und Wartungen ist gesetzlich vorgeschrieben. Lücken können bei Prüfungen zu Beanstandungen führen. Unser System macht die Dokumentation einfach und lückenlos. Sie sehen auf einen Blick, welche Mitarbeiter noch eine Einweisung benötigen und welche Wartungen anstehen.",
    },
    iconName: "Cpu",
    color: "bg-cyan-500/10 text-cyan-600",
    benefits: [
      { title: "MPBetreibV-konform", description: "Vollständige Dokumentation nach Medizinprodukte-Betreiberverordnung" },
      { title: "Einweisungsmanagement", description: "Übersicht über Einweisungen aller Mitarbeiter pro Gerät" },
      { title: "Wartungsplanung", description: "Automatische Erinnerungen an anstehende Wartungen und STK" },
      { title: "Geräte-Lebenszyklus", description: "Von der Anschaffung bis zur Außerbetriebnahme alles dokumentiert" },
      { title: "Prüfungssicher", description: "Alle Nachweise für Behördenprüfungen jederzeit griffbereit" },
    ],
    features: [
      { title: "Geräte-Datenbank", description: "Zentrale Verwaltung aller Medizingeräte mit technischen Daten", iconName: "Cpu" },
      { title: "Einweisungsprotokoll", description: "Dokumentation und Tracking aller Geräteeinweisungen", iconName: "ClipboardCheck" },
      { title: "Wartungskalender", description: "Automatisierte Wartungsplanung mit Erinnerungsfunktion", iconName: "Calendar" },
      { title: "STK-Management", description: "Sicherheitstechnische Kontrollen planen und dokumentieren", iconName: "Shield" },
    ],
    useCases: [
      { title: "Neue Mitarbeiterin", description: "Automatisch wird eine Einweisungsliste für alle relevanten Geräte erstellt." },
      { title: "STK-Termin", description: "Das System erinnert rechtzeitig an die fällige Sicherheitstechnische Kontrolle." },
      { title: "Begehung", description: "Alle Einweisungsprotokolle und Wartungsnachweise auf Knopfdruck bereit." },
    ],
    faq: [
      { question: "Welche Geräte sollte ich erfassen?", answer: "Alle aktiven Medizinprodukte und Geräte, die einer Einweisungspflicht oder regelmäßigen Wartung unterliegen." },
      { question: "Werden die Einweisungsprotokolle rechtlich anerkannt?", answer: "Ja, die digitale Dokumentation mit Zeitstempel und Bestätigung ist rechtlich anerkannt." },
    ],
    relatedFeatureSlugs: ["hygieneplan", "wissen-qm", "arbeitsmittel"],
    metaTitle: "Geräte | Medizingeräte-Management für Arztpraxen | Effizienz Praxis",
    metaDescription:
      "Verwalten Sie Medizingeräte MPBetreibV-konform: Einweisungen, Wartungsplanung, STK-Management und prüfungssichere Dokumentation.",
  },
]

// Helper function to normalize German umlauts for slug matching
function normalizeGermanSlug(slug: string): string {
  return slug.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
}

// Helper function to get all features for a category
export function getFeaturesByCategory(slugs: string[]): FeatureData[] {
  return featuresData.filter((f) => slugs.includes(f.slug))
}

export function getFeatureBySlug(slug: string): FeatureData | undefined {
  const decodedSlug = decodeURIComponent(slug)
  const normalizedSlug = normalizeGermanSlug(decodedSlug)

  return featuresData.find(
    (feature) => feature.slug === slug || feature.slug === decodedSlug || feature.slug === normalizedSlug,
  )
}

// Helper function to get all feature slugs for static generation
export function getAllFeatureSlugs(): string[] {
  return featuresData.map((feature) => feature.slug)
}

// Helper function to get related features by slug array
export function getRelatedFeatures(slugs: string[]): FeatureData[] {
  return slugs.map((slug) => getFeatureBySlug(slug)).filter((f): f is FeatureData => f !== undefined)
}
