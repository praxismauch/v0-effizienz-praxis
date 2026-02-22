/**
 * Utility to validate and ensure practiceId is available throughout the app
 */

export function validatePracticeId(practiceId: string | number | null | undefined, source = "Unknown"): string {

  if (!practiceId || practiceId === "" || practiceId === "0" || practiceId === "undefined" || practiceId === "null") {
    const error = `Invalid or missing practice ID from ${source}: ${practiceId}`
    console.error(`[v0] ${error}`)
    throw new Error("Keine Praxis zugeordnet. Bitte laden Sie die Seite neu.")
  }

  return String(practiceId)
}

export function isPracticeIdValid(practiceId: string | number | null | undefined): boolean {
  return !!(
    practiceId &&
    practiceId !== "" &&
    practiceId !== "0" &&
    practiceId !== "undefined" &&
    practiceId !== "null"
  )
}
