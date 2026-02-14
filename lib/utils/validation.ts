// Validation utilities for testing and production use
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPhoneNumber(phone: string): boolean {
  // German phone number format
  const phoneRegex = /^(\+49|0)[1-9]\d{1,14}$/
  return phoneRegex.test(phone.replace(/\s/g, ""))
}

export function isValidPostalCode(postalCode: string, country = "DE"): boolean {
  if (country === "DE") {
    return /^\d{5}$/.test(postalCode)
  }
  return true
}

export function isValidPracticeId(practiceId: string | null | undefined): boolean {
  if (!practiceId) return false
  if (practiceId === "0" || practiceId === "null") return false
  return practiceId.length > 0
}

export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
}

export function validateWorkflowData(workflow: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!workflow.name || workflow.name.length < 3) {
    errors.push("Workflow name must be at least 3 characters")
  }

  if (!isValidPracticeId(workflow.practice_id)) {
    errors.push("Invalid practice ID")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function validateUserData(user: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!user.email || !isValidEmail(user.email)) {
    errors.push("Invalid email address")
  }

  if (!user.full_name || user.full_name.length < 2) {
    errors.push("Full name must be at least 2 characters")
  }

  const validRoles = ["superadmin", "practiceadmin", "poweruser", "user"]
  if (!validRoles.includes(user.role)) {
    errors.push("Invalid user role")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
