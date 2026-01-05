/**
 * Standardized API Response Helpers
 * Provides consistent response formatting across all API endpoints
 */
import { NextResponse } from "next/server"

// Standard HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const

// Error codes for client identification
export const ERROR_CODES = {
  // Authentication
  AUTH_REQUIRED: "AUTH_REQUIRED",
  AUTH_INVALID: "AUTH_INVALID",
  AUTH_EXPIRED: "AUTH_EXPIRED",
  AUTH_FORBIDDEN: "AUTH_FORBIDDEN",

  // Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_FIELD: "MISSING_FIELD",
  INVALID_FORMAT: "INVALID_FORMAT",

  // Resources
  NOT_FOUND: "NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  CONFLICT: "CONFLICT",

  // Rate limiting
  RATE_LIMITED: "RATE_LIMITED",

  // Server errors
  INTERNAL_ERROR: "INTERNAL_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",

  // Practice/User specific
  PRACTICE_NOT_FOUND: "PRACTICE_NOT_FOUND",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  PERMISSION_DENIED: "PERMISSION_DENIED",
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

interface ApiErrorOptions {
  code?: ErrorCode
  details?: Record<string, unknown>
  headers?: Record<string, string>
}

interface ApiSuccessOptions {
  headers?: Record<string, string>
  cache?: {
    maxAge?: number
    staleWhileRevalidate?: number
    private?: boolean
  }
}

/**
 * Create a successful JSON response
 */
export function apiSuccess<T>(data: T, status = HTTP_STATUS.OK, options: ApiSuccessOptions = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  // Add cache headers if specified
  if (options.cache) {
    const parts: string[] = []
    if (options.cache.private) {
      parts.push("private")
    } else {
      parts.push("public")
    }
    if (options.cache.maxAge !== undefined) {
      parts.push(`max-age=${options.cache.maxAge}`)
    }
    if (options.cache.staleWhileRevalidate !== undefined) {
      parts.push(`stale-while-revalidate=${options.cache.staleWhileRevalidate}`)
    }
    if (parts.length > 0) {
      headers["Cache-Control"] = parts.join(", ")
    }
  }

  return NextResponse.json(data, { status, headers })
}

/**
 * Create a successful response with pagination metadata
 */
export function apiPaginatedSuccess<T>(
  data: T[],
  pagination: {
    page: number
    limit: number
    total: number
  },
  options: ApiSuccessOptions = {},
) {
  return apiSuccess(
    {
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: Math.ceil(pagination.total / pagination.limit),
        hasMore: pagination.page * pagination.limit < pagination.total,
      },
    },
    HTTP_STATUS.OK,
    options,
  )
}

/**
 * Create an error response
 */
export function apiError(message: string, status = HTTP_STATUS.INTERNAL_SERVER_ERROR, options: ApiErrorOptions = {}) {
  const response = {
    error: true,
    code: options.code || ERROR_CODES.INTERNAL_ERROR,
    message,
    ...(options.details && { details: options.details }),
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(response, {
    status,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  })
}

// Convenience error functions

export function apiBadRequest(message: string, options: ApiErrorOptions = {}) {
  return apiError(message, HTTP_STATUS.BAD_REQUEST, {
    code: ERROR_CODES.VALIDATION_ERROR,
    ...options,
  })
}

export function apiUnauthorized(message = "Authentifizierung erforderlich", options: ApiErrorOptions = {}) {
  return apiError(message, HTTP_STATUS.UNAUTHORIZED, {
    code: ERROR_CODES.AUTH_REQUIRED,
    ...options,
  })
}

export function apiForbidden(message = "Zugriff verweigert", options: ApiErrorOptions = {}) {
  return apiError(message, HTTP_STATUS.FORBIDDEN, {
    code: ERROR_CODES.AUTH_FORBIDDEN,
    ...options,
  })
}

export function apiNotFound(resource = "Ressource", options: ApiErrorOptions = {}) {
  return apiError(`${resource} nicht gefunden`, HTTP_STATUS.NOT_FOUND, {
    code: ERROR_CODES.NOT_FOUND,
    ...options,
  })
}

export function apiConflict(message: string, options: ApiErrorOptions = {}) {
  return apiError(message, HTTP_STATUS.CONFLICT, {
    code: ERROR_CODES.CONFLICT,
    ...options,
  })
}

export function apiValidationError(errors: string | string[] | Record<string, string>, options: ApiErrorOptions = {}) {
  const message = Array.isArray(errors)
    ? errors.join(", ")
    : typeof errors === "string"
      ? errors
      : Object.entries(errors)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join(", ")

  return apiError(message, HTTP_STATUS.BAD_REQUEST, {
    code: ERROR_CODES.VALIDATION_ERROR,
    details: typeof errors === "object" && !Array.isArray(errors) ? { fields: errors } : undefined,
    ...options,
  })
}

export function apiRateLimited(retryAfter: number, options: ApiErrorOptions = {}) {
  return apiError(
    `Zu viele Anfragen. Bitte versuchen Sie es in ${retryAfter} Sekunden erneut.`,
    HTTP_STATUS.TOO_MANY_REQUESTS,
    {
      code: ERROR_CODES.RATE_LIMITED,
      headers: {
        "Retry-After": String(retryAfter),
      },
      ...options,
    },
  )
}

export function apiInternalError(message = "Ein interner Fehler ist aufgetreten", options: ApiErrorOptions = {}) {
  return apiError(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, {
    code: ERROR_CODES.INTERNAL_ERROR,
    ...options,
  })
}

export function apiDatabaseError(message = "Datenbankfehler", options: ApiErrorOptions = {}) {
  return apiError(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, {
    code: ERROR_CODES.DATABASE_ERROR,
    ...options,
  })
}

/**
 * Create a method not allowed response
 */
export function apiMethodNotAllowed(allowedMethods: string[]) {
  return apiError(
    `Methode nicht erlaubt. Erlaubte Methoden: ${allowedMethods.join(", ")}`,
    HTTP_STATUS.METHOD_NOT_ALLOWED,
    {
      code: ERROR_CODES.VALIDATION_ERROR,
      headers: {
        Allow: allowedMethods.join(", "),
      },
    },
  )
}

/**
 * Create a service unavailable response
 */
export function apiServiceUnavailable(message = "Service vorübergehend nicht verfügbar") {
  return apiError(message, HTTP_STATUS.SERVICE_UNAVAILABLE, {
    code: ERROR_CODES.EXTERNAL_SERVICE_ERROR,
  })
}

/**
 * Create a created response (201)
 */
export function apiCreated<T>(data: T, options: ApiSuccessOptions = {}) {
  return apiSuccess(data, HTTP_STATUS.CREATED, options)
}

/**
 * Create a no content response (204)
 */
export function apiNoContent() {
  return new Response(null, { status: HTTP_STATUS.NO_CONTENT })
}

/**
 * Parse and handle Supabase errors
 */
export function handleSupabaseError(error: { message?: string; code?: string } | null) {
  if (!error) return null

  const message = error.message || "Datenbankfehler"

  // Handle specific Supabase error codes
  if (error.code === "PGRST116") {
    return apiNotFound()
  }
  if (error.code === "23505") {
    return apiConflict("Ein Eintrag mit diesen Daten existiert bereits")
  }
  if (error.code === "23503") {
    return apiBadRequest("Referenzierte Ressource nicht gefunden")
  }
  if (error.code === "42501") {
    return apiForbidden("Keine Berechtigung für diese Aktion")
  }

  return apiDatabaseError(message)
}

/**
 * Utility to safely get error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return "Ein unbekannter Fehler ist aufgetreten"
}

/**
 * Wrap an async API handler with error handling
 */
export function withErrorHandler(handler: (req: Request, ...args: unknown[]) => Promise<Response>) {
  return async (req: Request, ...args: unknown[]) => {
    try {
      return await handler(req, ...args)
    } catch (error) {
      console.error("[v0] API Error:", error)

      if (error instanceof Error) {
        // Check for specific error types
        if (error.message.includes("not found") || error.message.includes("nicht gefunden")) {
          return apiNotFound()
        }
        if (error.message.includes("unauthorized") || error.message.includes("not authenticated")) {
          return apiUnauthorized()
        }
        if (error.message.includes("forbidden") || error.message.includes("permission")) {
          return apiForbidden()
        }
      }

      return apiInternalError()
    }
  }
}
