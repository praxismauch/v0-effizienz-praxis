export const availablePermissions = [
  { id: "all", label: "Alle Berechtigungen", description: "Voller Zugriff auf alle Systemfunktionen" },
  // Übersicht
  { id: "dashboard", label: "Dashboard", description: "Übersichtsseite und Statistiken anzeigen" },
  { id: "analytics", label: "Analysen", description: "Praxisanalysen und Auswertungen einsehen" },
  // Praxismanagement
  { id: "leitbild", label: "Leitbild", description: "Praxisleitbild und Vision verwalten" },
  { id: "wunschpatient", label: "Wunschpatient", description: "Wunschpatienten-Profile erstellen und bearbeiten" },
  { id: "profile", label: "Praxisprofil", description: "Praxisprofil und Informationen bearbeiten" },
  // Team & Personal
  { id: "team", label: "Teamverwaltung", description: "Teammitglieder und Zuweisungen verwalten" },
  { id: "hiring", label: "Recruiting", description: "Stellenausschreibungen und Bewerber verwalten" },
  { id: "training", label: "Fortbildungen", description: "Fortbildungen und Schulungen verwalten" },
  { id: "skills", label: "Kompetenzen", description: "Mitarbeiterkompetenzen und Fähigkeiten pflegen" },
  { id: "responsibilities", label: "Zuständigkeiten", description: "Verantwortungsbereiche definieren" },
  // Planung & Organisation
  { id: "calendar", label: "Kalenderverwaltung", description: "Praxiskalender und Termine verwalten" },
  { id: "tasks", label: "Aufgaben", description: "Aufgaben erstellen und verwalten" },
  { id: "goals", label: "Ziele", description: "Praxis- und Teamziele definieren" },
  { id: "workflows", label: "Workflows", description: "Arbeitsabläufe und Prozesse verwalten" },
  // Daten & Dokumente
  { id: "documents", label: "Dokumente", description: "Dokumente hochladen und verwalten" },
  { id: "knowledge", label: "Wissensdatenbank", description: "Wissensdatenbank pflegen und nutzen" },
  { id: "contacts", label: "Kontakte", description: "Geschäftskontakte und Partner verwalten" },
  // Infrastruktur
  { id: "rooms", label: "Räume", description: "Praxisräume verwalten" },
  { id: "workplaces", label: "Arbeitsplätze", description: "Arbeitsplätze konfigurieren" },
  { id: "equipment", label: "Ausstattung", description: "Geräte und Ausstattung verwalten" },
  // Finanzen & Abrechnung
  { id: "billing", label: "Abrechnung", description: "Abrechnungs- und Finanzunterlagen verwalten" },
  { id: "reports", label: "Berichte", description: "Praxisberichte generieren und einsehen" },
  // Administration
  { id: "settings", label: "Einstellungen", description: "Praxiseinstellungen konfigurieren" },
  { id: "security", label: "Sicherheit", description: "Sicherheitseinstellungen und Benutzerrechte" },
]

export const formatDate = (date: Date | string) => {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d)
}

export const calculateAge = (dateOfBirth: string | null): number | null => {
  if (!dateOfBirth) return null
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

export interface TeamEditFormData {
  firstName: string
  lastName: string
  email: string
  role: string
  permissions: string[]
  teamIds: string[]
  avatar: string
  status: string
  dateOfBirth: string
}
