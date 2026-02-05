/**
 * Common type definitions used across the application
 * Import from "@/lib/types/common" to use these types
 */

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface ApiErrorResponse {
  error: string
  code?: string
  details?: Record<string, string>
}

// ============================================
// Database Entity Base Types
// ============================================

export interface BaseEntity {
  id: string
  created_at: string
  updated_at?: string
}

export interface PracticeEntity extends BaseEntity {
  practice_id: string
}

export interface UserOwnedEntity extends PracticeEntity {
  created_by?: string
  updated_by?: string
}

export interface SoftDeletableEntity {
  deleted_at?: string | null
  deleted_by?: string | null
}

// ============================================
// Common Data Types
// ============================================

export interface User {
  id: string
  email: string
  role: UserRole
  practice_id: string | null
  default_practice_id?: string | null
  is_active: boolean
  first_name?: string
  last_name?: string
  avatar_url?: string
}

export type UserRole =
  | "super_admin"
  | "practice_admin"
  | "manager"
  | "employee"
  | "viewer"
  | "readonly"

export interface Practice {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  postal_code?: string
  country?: string
  timezone?: string
  settings?: PracticeSettings
  created_at: string
  updated_at?: string
}

export interface PracticeSettings {
  ai_enabled?: boolean
  max_users?: number
  features?: string[]
  branding?: {
    logo_url?: string
    primary_color?: string
  }
}

// ============================================
// Form Types
// ============================================

export interface SelectOption<T = string> {
  value: T
  label: string
  disabled?: boolean
  description?: string
}

export interface FormFieldError {
  field: string
  message: string
}

export interface FormValidationResult {
  valid: boolean
  errors: FormFieldError[]
}

// ============================================
// Utility Types
// ============================================

/**
 * Make specific properties required
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>

/**
 * Make specific properties optional
 */
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * Database insert type (omit auto-generated fields)
 */
export type InsertType<T extends BaseEntity> = Omit<T, "id" | "created_at" | "updated_at">

/**
 * Database update type (all fields optional except id)
 */
export type UpdateType<T extends BaseEntity> = Partial<Omit<T, "id" | "created_at">> & { id: string }

/**
 * JSON-serializable types
 */
export type JsonPrimitive = string | number | boolean | null
export type JsonArray = JsonValue[]
export type JsonObject = { [key: string]: JsonValue }
export type JsonValue = JsonPrimitive | JsonArray | JsonObject

// ============================================
// Date/Time Types
// ============================================

export interface DateRange {
  start: Date | string
  end: Date | string
}

export interface TimeSlot {
  start: string // HH:mm format
  end: string // HH:mm format
}

// ============================================
// Status Types
// ============================================

export type LoadingState = "idle" | "loading" | "success" | "error"

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

// ============================================
// Table/List Types
// ============================================

export interface SortConfig {
  column: string
  direction: "asc" | "desc"
}

export interface FilterConfig {
  field: string
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "like" | "in"
  value: string | number | boolean | string[] | number[]
}

export interface TableQueryParams {
  page?: number
  pageSize?: number
  sort?: SortConfig
  filters?: FilterConfig[]
  search?: string
}
