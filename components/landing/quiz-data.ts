import { Award, TrendingUp, Lightbulb, RefreshCcw, type LucideIcon } from "lucide-react"

export interface QuizQuestion {
  id: number
  question: string
  options: {
    text: string
    score: number
  }[]
}

export interface QuizResult {
  title: string
  description: string
  color: string
  bg: string
  border: string
  icon: LucideIcon
}

export const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "Wie oft suchen Sie oder Ihr Team nach Dokumenten oder Informationen?",
    options: [
      { text: "Mehrmals täglich - wir verlieren viel Zeit damit", score: 1 },
      { text: "Einmal täglich - es dauert manchmal etwas", score: 2 },
      { text: "Selten - wir finden meist schnell alles", score: 3 },
      { text: "Fast nie - wir haben ein perfektes System", score: 4 },
    ],
  },
  {
    id: 2,
    question: "Wie werden Aufgaben und Verantwortlichkeiten in Ihrer Praxis kommuniziert?",
    options: [
      { text: "Mündlich oder per Zettel - oft geht etwas unter", score: 1 },
      { text: "E-Mail/Chat - aber nicht immer strukturiert", score: 2 },
      { text: "Digitale Tools - meistens klappt es gut", score: 3 },
      { text: "Klares System mit Tracking und Bestätigung", score: 4 },
    ],
  },
  {
    id: 3,
    question: "Wie häufig treten wiederkehrende Fehler oder Missverständnisse auf?",
    options: [
      { text: "Regelmäßig - wir machen oft die gleichen Fehler", score: 1 },
      { text: "Manchmal - einige Prozesse sind fehleranfällig", score: 2 },
      { text: "Selten - wir haben die meisten Prozesse im Griff", score: 3 },
      { text: "Kaum - wir haben standardisierte Abläufe", score: 4 },
    ],
  },
  {
    id: 4,
    question: "Wie gut kennen Ihre Mitarbeitenden ihre Aufgaben und Verantwortlichkeiten?",
    options: [
      { text: "Unklar - es gibt häufig Fragen und Unsicherheiten", score: 1 },
      { text: "Teilweise - manche Bereiche sind nicht definiert", score: 2 },
      { text: "Gut - die meisten wissen, was zu tun ist", score: 3 },
      { text: "Exzellent - klare Rollen und Stellenbeschreibungen", score: 4 },
    ],
  },
  {
    id: 5,
    question: "Wie zufrieden sind Ihre Mitarbeitenden mit den Arbeitsabläufen?",
    options: [
      { text: "Unzufrieden - es gibt viel Frust über Ineffizienzen", score: 1 },
      { text: "Neutral - es könnte besser sein", score: 2 },
      { text: "Zufrieden - die meisten Abläufe funktionieren", score: 3 },
      { text: "Sehr zufrieden - wir haben optimierte Prozesse", score: 4 },
    ],
  },
  {
    id: 6,
    question: "Wie werden Verbesserungsvorschläge in Ihrer Praxis behandelt?",
    options: [
      { text: "Selten besprochen - keine Zeit dafür", score: 1 },
      { text: "Gelegentlich - wenn jemand aktiv darauf hinweist", score: 2 },
      { text: "Regelmäßig - wir haben Teambesprechungen", score: 3 },
      { text: "Systematisch - mit Feedback-System und Umsetzungstracking", score: 4 },
    ],
  },
  {
    id: 7,
    question: "Wie gut können Sie Ihre Praxiskennzahlen (Auslastung, Umsatz, etc.) einsehen?",
    options: [
      { text: "Kaum - wir haben keinen Überblick", score: 1 },
      { text: "Eingeschränkt - nur mit viel manuellem Aufwand", score: 2 },
      { text: "Gut - wir haben einige Auswertungen", score: 3 },
      { text: "Exzellent - Echtzeit-Dashboard mit allen wichtigen KPIs", score: 4 },
    ],
  },
  {
    id: 8,
    question: "Wie viel Zeit verbringen Sie mit administrativen Aufgaben statt mit Patienten?",
    options: [
      { text: "Sehr viel - Administration frisst die meiste Zeit", score: 1 },
      { text: "Viel - ich wünschte, es wäre weniger", score: 2 },
      { text: "Moderat - ein guter Mix", score: 3 },
      { text: "Wenig - die meiste Zeit gehört den Patienten", score: 4 },
    ],
  },
]

export function getResultCategory(score: number): QuizResult {
  const percentage = (score / (quizQuestions.length * 4)) * 100
  if (percentage >= 85) {
    return {
      title: "Effizienz-Champion",
      description:
        "Herzlichen Glückwunsch! Ihre Praxis ist bereits sehr effizient aufgestellt. Mit Effizienz Praxis können Sie Ihre Spitzenposition weiter ausbauen und neue Optimierungspotenziale entdecken.",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      icon: Award,
    }
  } else if (percentage >= 65) {
    return {
      title: "Auf gutem Weg",
      description:
        "Ihre Praxis hat bereits gute Strukturen, aber es gibt noch Luft nach oben. Mit den richtigen Tools können Sie Ihre Effizienz um 20-30% steigern.",
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: TrendingUp,
    }
  } else if (percentage >= 45) {
    return {
      title: "Entwicklungspotenzial",
      description:
        "Es gibt deutliches Optimierungspotenzial in Ihrer Praxis. Strukturierte Prozesse und digitale Tools können Ihnen helfen, Zeit zu sparen und Fehler zu reduzieren.",
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
      icon: Lightbulb,
    }
  } else {
    return {
      title: "Handlungsbedarf",
      description:
        "Ihre Praxis hat erhebliches Verbesserungspotenzial. Die gute Nachricht: Mit den richtigen Maßnahmen können Sie schnell große Fortschritte erzielen.",
      color: "text-rose-600",
      bg: "bg-rose-50",
      border: "border-rose-200",
      icon: RefreshCcw,
    }
  }
}
