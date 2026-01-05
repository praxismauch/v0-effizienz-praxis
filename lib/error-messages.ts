/**
 * Zentrale Fehlerübersetzung für benutzerfreundliche Erklärungen
 * Technische Fehlermeldungen werden in verständliche deutsche Erklärungen umgewandelt
 */

// Mapping von technischen Fehlern zu benutzerfreundlichen Erklärungen
const errorTranslations: Record<string, string> = {
  // Netzwerk-Fehler
  "Failed to fetch":
    "Die Verbindung zum Server konnte nicht hergestellt werden. Bitte überprüfen Sie Ihre Internetverbindung.",
  "Network Error": "Es besteht keine Internetverbindung. Bitte versuchen Sie es später erneut.",
  NetworkError: "Es besteht keine Internetverbindung. Bitte versuchen Sie es später erneut.",
  "net::ERR_INTERNET_DISCONNECTED": "Keine Internetverbindung. Bitte überprüfen Sie Ihre Netzwerkeinstellungen.",
  "net::ERR_CONNECTION_REFUSED":
    "Der Server ist momentan nicht erreichbar. Bitte versuchen Sie es in einigen Minuten erneut.",
  "net::ERR_CONNECTION_TIMED_OUT": "Die Verbindung hat zu lange gedauert. Bitte versuchen Sie es erneut.",
  ECONNREFUSED: "Der Server ist momentan nicht erreichbar. Bitte versuchen Sie es später erneut.",
  ETIMEDOUT: "Die Anfrage hat zu lange gedauert. Bitte versuchen Sie es erneut.",

  // Authentifizierungs-Fehler
  "Invalid login credentials": "Die Anmeldedaten sind nicht korrekt. Bitte überprüfen Sie E-Mail und Passwort.",
  "Invalid credentials": "Die Anmeldedaten sind nicht korrekt. Bitte überprüfen Sie E-Mail und Passwort.",
  "Email not confirmed": "Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse über den Link in der Bestätigungs-E-Mail.",
  "User already registered":
    "Diese E-Mail-Adresse ist bereits registriert. Bitte melden Sie sich an oder nutzen Sie eine andere E-Mail.",
  "Password should be at least": "Das Passwort muss mindestens 8 Zeichen lang sein.",
  "Invalid email": "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
  Unauthorized: "Sie sind nicht angemeldet. Bitte melden Sie sich erneut an.",
  "JWT expired": "Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.",
  "Token expired": "Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.",
  session_not_found: "Ihre Sitzung wurde nicht gefunden. Bitte melden Sie sich erneut an.",
  invalid_grant: "Die Anmeldung ist fehlgeschlagen. Bitte versuchen Sie es erneut.",

  // Datenbank-Fehler
  "duplicate key": "Ein Eintrag mit diesen Daten existiert bereits.",
  "violates unique constraint": "Ein Eintrag mit diesen Daten existiert bereits.",
  "violates foreign key constraint": "Diese Aktion ist nicht möglich, da verknüpfte Daten existieren.",
  "null value in column": "Bitte füllen Sie alle erforderlichen Felder aus.",
  "value too long": "Der eingegebene Text ist zu lang. Bitte kürzen Sie die Eingabe.",
  "relation does not exist": "Diese Funktion ist momentan nicht verfügbar. Bitte versuchen Sie es später erneut.",
  "column does not exist": "Diese Funktion ist momentan nicht verfügbar. Bitte versuchen Sie es später erneut.",
  "permission denied": "Sie haben keine Berechtigung für diese Aktion.",
  "row-level security": "Sie haben keine Berechtigung, auf diese Daten zuzugreifen.",

  // Datei-Upload-Fehler
  "File too large": "Die Datei ist zu groß. Bitte wählen Sie eine kleinere Datei.",
  "Invalid file type": "Dieser Dateityp wird nicht unterstützt.",
  "Upload failed": "Der Upload ist fehlgeschlagen. Bitte versuchen Sie es erneut.",
  "Payload too large": "Die Datei ist zu groß. Maximale Größe: 10 MB.",

  // Server-Fehler
  "Internal Server Error": "Ein unerwarteter Fehler ist aufgetreten. Unser Team wurde informiert.",
  "Internal server error": "Ein unerwarteter Fehler ist aufgetreten. Unser Team wurde informiert.",
  "500": "Ein Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut.",
  "502": "Der Server ist vorübergehend nicht erreichbar. Bitte versuchen Sie es in einigen Minuten erneut.",
  "503": "Der Dienst ist momentan überlastet. Bitte versuchen Sie es später erneut.",
  "504": "Die Anfrage hat zu lange gedauert. Bitte versuchen Sie es erneut.",

  // KI-Fehler
  "Rate limit exceeded": "Zu viele Anfragen. Bitte warten Sie einen Moment und versuchen Sie es dann erneut.",
  rate_limit: "Zu viele Anfragen. Bitte warten Sie einen Moment und versuchen Sie es dann erneut.",
  model_not_found: "Der KI-Dienst ist vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut.",
  context_length_exceeded: "Der Text ist zu lang für die KI-Verarbeitung. Bitte kürzen Sie die Eingabe.",
  insufficient_quota: "Das KI-Kontingent ist erschöpft. Bitte kontaktieren Sie den Administrator.",

  // Validierungs-Fehler
  required: "Bitte füllen Sie dieses Feld aus.",
  "must be a valid": "Bitte geben Sie einen gültigen Wert ein.",
  "cannot be empty": "Dieses Feld darf nicht leer sein.",
  "already exists": "Dieser Eintrag existiert bereits.",
  "not found": "Der angeforderte Eintrag wurde nicht gefunden.",

  // Stripe/Payment-Fehler
  card_declined: "Die Karte wurde abgelehnt. Bitte verwenden Sie eine andere Zahlungsmethode.",
  insufficient_funds: "Unzureichende Deckung. Bitte verwenden Sie eine andere Zahlungsmethode.",
  expired_card: "Die Karte ist abgelaufen. Bitte verwenden Sie eine gültige Karte.",
  incorrect_cvc: "Der Sicherheitscode ist nicht korrekt.",
  processing_error: "Bei der Zahlungsverarbeitung ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
}

// Generische Fehlermuster mit Regex
const errorPatterns: Array<{ pattern: RegExp; message: string }> = [
  { pattern: /timeout/i, message: "Die Anfrage hat zu lange gedauert. Bitte versuchen Sie es erneut." },
  { pattern: /connect.*fail/i, message: "Die Verbindung zum Server konnte nicht hergestellt werden." },
  { pattern: /not authorized/i, message: "Sie haben keine Berechtigung für diese Aktion." },
  { pattern: /access denied/i, message: "Der Zugriff wurde verweigert." },
  { pattern: /quota.*exceeded/i, message: "Das Limit wurde erreicht. Bitte versuchen Sie es später erneut." },
  { pattern: /too many requests/i, message: "Zu viele Anfragen. Bitte warten Sie einen Moment." },
  { pattern: /invalid.*token/i, message: "Ihre Sitzung ist ungültig. Bitte melden Sie sich erneut an." },
  { pattern: /expired/i, message: "Die Sitzung oder der Link ist abgelaufen." },
  { pattern: /duplicate/i, message: "Ein Eintrag mit diesen Daten existiert bereits." },
  { pattern: /constraint/i, message: "Diese Aktion ist aufgrund von Datenabhängigkeiten nicht möglich." },
  { pattern: /parse.*error/i, message: "Die Daten konnten nicht verarbeitet werden." },
  { pattern: /syntax.*error/i, message: "Ein technischer Fehler ist aufgetreten." },
]

// Kontext-spezifische Fallback-Nachrichten
export const contextualFallbacks: Record<string, string> = {
  save: "Die Änderungen konnten nicht gespeichert werden. Bitte versuchen Sie es erneut.",
  delete: "Der Eintrag konnte nicht gelöscht werden. Bitte versuchen Sie es erneut.",
  create: "Der Eintrag konnte nicht erstellt werden. Bitte versuchen Sie es erneut.",
  update: "Die Aktualisierung ist fehlgeschlagen. Bitte versuchen Sie es erneut.",
  load: "Die Daten konnten nicht geladen werden. Bitte aktualisieren Sie die Seite.",
  fetch: "Die Daten konnten nicht abgerufen werden. Bitte überprüfen Sie Ihre Internetverbindung.",
  upload: "Der Upload ist fehlgeschlagen. Bitte versuchen Sie es erneut.",
  download: "Der Download ist fehlgeschlagen. Bitte versuchen Sie es erneut.",
  login: "Die Anmeldung ist fehlgeschlagen. Bitte überprüfen Sie Ihre Zugangsdaten.",
  logout: "Die Abmeldung ist fehlgeschlagen. Bitte versuchen Sie es erneut.",
  send: "Die Nachricht konnte nicht gesendet werden. Bitte versuchen Sie es erneut.",
  generate: "Die Generierung ist fehlgeschlagen. Bitte versuchen Sie es erneut.",
  ai: "Die KI-Anfrage konnte nicht verarbeitet werden. Bitte versuchen Sie es erneut.",
  export: "Der Export ist fehlgeschlagen. Bitte versuchen Sie es erneut.",
  import: "Der Import ist fehlgeschlagen. Bitte überprüfen Sie das Dateiformat.",
  connect: "Die Verbindung konnte nicht hergestellt werden.",
  default: "Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.",
}

/**
 * Übersetzt eine technische Fehlermeldung in eine benutzerfreundliche Erklärung
 * @param error - Der Fehler (Error-Objekt, String oder unbekannt)
 * @param context - Optionaler Kontext für spezifischere Fallback-Nachrichten
 * @returns Eine benutzerfreundliche Fehlermeldung auf Deutsch
 */
export function getUserFriendlyError(error: unknown, context?: keyof typeof contextualFallbacks): string {
  // Extrahiere die Fehlermeldung
  let errorMessage = ""

  if (error instanceof Error) {
    errorMessage = error.message
  } else if (typeof error === "string") {
    errorMessage = error
  } else if (error && typeof error === "object") {
    // Handle verschiedene Error-Objekt-Formate
    const errorObj = error as Record<string, unknown>
    errorMessage =
      (errorObj.message as string) ||
      (errorObj.error as string) ||
      (errorObj.details as string) ||
      JSON.stringify(error)
  }

  // Wenn keine Fehlermeldung vorhanden, nutze Fallback
  if (!errorMessage) {
    return contextualFallbacks[context || "default"]
  }

  // Prüfe direkte Übereinstimmungen
  for (const [key, translation] of Object.entries(errorTranslations)) {
    if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
      return translation
    }
  }

  // Prüfe Regex-Muster
  for (const { pattern, message } of errorPatterns) {
    if (pattern.test(errorMessage)) {
      return message
    }
  }

  // Verwende kontext-spezifischen Fallback
  if (context && contextualFallbacks[context]) {
    return contextualFallbacks[context]
  }

  // Generischer Fallback - prüfe ob Nachricht bereits deutsch/benutzerfreundlich ist
  if (isUserFriendlyMessage(errorMessage)) {
    return errorMessage
  }

  return contextualFallbacks.default
}

/**
 * Prüft ob eine Nachricht bereits benutzerfreundlich ist
 */
function isUserFriendlyMessage(message: string): boolean {
  // Deutsche Nachrichten sind vermutlich bereits benutzerfreundlich
  const germanIndicators = [
    "bitte",
    "konnte nicht",
    "versuchen sie",
    "fehler bei",
    "nicht möglich",
    "überprüfen sie",
    "ist fehlgeschlagen",
  ]
  const lowerMessage = message.toLowerCase()
  return germanIndicators.some((indicator) => lowerMessage.includes(indicator))
}

/**
 * Erstellt eine Toast-Konfiguration mit benutzerfreundlicher Fehlermeldung
 */
export function createErrorToast(
  error: unknown,
  context?: keyof typeof contextualFallbacks,
): {
  title: string
  description: string
  variant: "destructive"
} {
  return {
    title: "Hinweis",
    description: getUserFriendlyError(error, context),
    variant: "destructive",
  }
}

/**
 * Helper für try-catch Blöcke mit benutzerfreundlicher Fehlerbehandlung
 */
export async function withUserFriendlyError<T>(
  fn: () => Promise<T>,
  context?: keyof typeof contextualFallbacks,
): Promise<{ data: T | null; error: string | null }> {
  try {
    const data = await fn()
    return { data, error: null }
  } catch (err) {
    return { data: null, error: getUserFriendlyError(err, context) }
  }
}
