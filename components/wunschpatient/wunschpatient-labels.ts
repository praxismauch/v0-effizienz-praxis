export function getArchetypeLabel(archetype: string) {
  const labels: Record<string, string> = {
    prevention: "Präventionsorientiert",
    chronic: "Chronischer Patient",
    performance: "Leistungsorientiert",
    acute: "Akut-Patient",
    relationship: "Beziehungstyp",
  }
  return labels[archetype] || archetype
}

export function getArchetypeColor(archetype: string) {
  const colors: Record<string, string> = {
    prevention: "bg-green-500",
    chronic: "bg-blue-500",
    performance: "bg-orange-500",
    acute: "bg-red-500",
    relationship: "bg-pink-500",
  }
  return colors[archetype] || "bg-primary"
}

export function getFamilyStatusLabel(status: string) {
  const labels: Record<string, string> = {
    single: "Single",
    partnership: "In Partnerschaft",
    married: "Verheiratet",
    married_children: "Verheiratet mit Kindern",
    single_parent: "Alleinerziehend",
  }
  return labels[status] || status
}

export function getHealthConsciousnessLabel(level: string) {
  const labels: Record<string, string> = {
    very_high: "Sehr hoch",
    high: "Hoch",
    medium: "Mittel",
    low: "Niedrig",
  }
  return labels[level] || level
}

export function getFinancialWillingnessLabel(level: string) {
  const labels: Record<string, string> = {
    very_high: "Sehr hoch",
    high: "Hoch",
    medium: "Mittel",
    low: "Niedrig",
  }
  return labels[level] || level
}

export function getCommunicationLabel(pref: string) {
  const labels: Record<string, string> = {
    digital: "Digital",
    phone: "Telefon",
    in_person: "Persönlich",
    mixed: "Gemischt",
  }
  return labels[pref] || pref
}

export function getTransportLabel(transport: string) {
  const labels: Record<string, string> = {
    car: "Auto",
    public_transport: "ÖPNV",
    bike: "Fahrrad",
    walking: "Zu Fuß",
  }
  return labels[transport] || transport
}
