/**
 * Ticket Configuration Types
 *
 * Type definitions for dynamic ticket configuration system.
 * These types match the database schema created in Batch 1.
 */

// Core ticket enum values (from database)
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed" | "wont_fix"
export type TicketPriority = "low" | "medium" | "high" | "urgent"
export type TicketType = "bug" | "feature_request" | "question" | "other"

// Configuration objects from database
export interface TicketStatusConfig {
  id: string
  value: TicketStatus
  label_de: string
  label_en: string | null
  color_class: string
  icon_name: string | null
  sort_order: number
  is_active: boolean
  is_system: boolean
  metadata: Record<string, any> | null
  created_at: string
  updated_at: string
}

export interface TicketPriorityConfig {
  id: string
  value: TicketPriority
  label_de: string
  label_en: string | null
  color_class: string
  icon_name: string | null
  urgency_level: number
  escalation_hours: number | null
  sort_order: number
  is_active: boolean
  is_system: boolean
  metadata: Record<string, any> | null
  created_at: string
  updated_at: string
}

export interface TicketTypeConfig {
  id: string
  value: TicketType
  label_de: string
  label_en: string | null
  icon_name: string | null
  description: string | null
  requires_reproduction_steps: boolean
  sort_order: number
  is_active: boolean
  is_system: boolean
  metadata: Record<string, any> | null
  created_at: string
  updated_at: string
}

// Complete configuration response from API
export interface TicketConfig {
  statuses: TicketStatusConfig[]
  priorities: TicketPriorityConfig[]
  types: TicketTypeConfig[]
  _metadata?: {
    cached_until: string
    version: string
  }
}

// Simplified option format for dropdowns
export interface TicketOption {
  value: string
  label: string
  color?: string
  icon?: string
}

// Language preference
export type TicketLanguage = "de" | "en"
