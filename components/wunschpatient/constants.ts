export const healthConcernOptions = [
  "Rückenschmerzen",
  "Kopfschmerzen/Migräne",
  "Stress/Burnout",
  "Übergewicht",
  "Diabetes",
  "Herzerkrankungen",
  "Allergien",
  "Hautprobleme",
  "Schlafstörungen",
  "Verdauungsprobleme",
  "Gelenkschmerzen",
  "Immunschwäche",
]

export const lifestyleOptions = [
  "Sportlich aktiv",
  "Gesunde Ernährung",
  "Stressiger Beruf",
  "Familie mit Kindern",
  "Raucher",
  "Wenig Bewegung",
  "Viel Reisen",
  "Home Office",
  "Schichtarbeit",
  "Hohe Arbeitsbelastung",
]

export const valueOptions = [
  "Vertrauen",
  "Erreichbarkeit",
  "Moderne Ausstattung",
  "Persönliche Beziehung",
  "Effizienz",
  "Ganzheitliche Betreuung",
  "Digitale Services",
  "Kurze Wartezeiten",
  "Transparenz",
  "Nachhaltigkeit",
]

export const expectationOptions = [
  "Ausreichend Zeit beim Arzt",
  "Empathische Betreuung",
  "High-Tech Diagnostik",
  "Schnelle Terminvergabe",
  "Online-Terminbuchung",
  "Digitale Befunde",
  "Telemedizin",
  "Präventive Beratung",
  "Ganzheitlicher Ansatz",
  "Second Opinion",
]

export const TABS = ["demografie", "gesundheit", "verhalten", "werte"] as const

export interface WunschpatientFormData {
  name: string
  age_range: string
  gender: string
  occupation: string
  family_status: string
  archetype: string
  health_concerns: string[]
  lifestyle_factors: string[]
  values: string[]
  expectations: string[]
  health_consciousness: string
  prevention_vs_acute: string
  communication_preference: string
  financial_willingness: string
  location_area: string
  transport_method: string
  services_interested: string
}

export const EMPTY_FORM: WunschpatientFormData = {
  name: "",
  age_range: "",
  gender: "",
  occupation: "",
  family_status: "",
  archetype: "",
  health_concerns: [],
  lifestyle_factors: [],
  values: [],
  expectations: [],
  health_consciousness: "",
  prevention_vs_acute: "",
  communication_preference: "",
  financial_willingness: "",
  location_area: "",
  transport_method: "",
  services_interested: "",
}
