"use client"

import useSWR from "swr"

interface Practice {
  id: number
  name: string
  type: string
  street: string
  city: string
  zipCode: string
  address: string
  phone: string
  email: string
  website: string
  timezone: string
  currency: string
  color: string
  logo_url: string | null
  ai_enabled: boolean
  isActive: boolean
  created_at: string
  deleted_at: string | null
  memberCount: number
  adminCount: number
  lastActivity: string
  settings: Record<string, unknown>
}

interface PracticesResponse {
  practices: Practice[]
  total: number
}

interface PracticeStats {
  total: number
  active: number
  inactive: number
  deleted: number
}

const fetcher = async (url: string): Promise<PracticesResponse> => {
  const response = await fetch(url)
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Nicht autorisiert")
    } else if (response.status === 403) {
      throw new Error("Zugriff verweigert: Super-Admin-Berechtigung erforderlich")
    }
    const error = await response.json()
    throw new Error(error.error || "Fehler beim Laden der Praxen")
  }
  return response.json()
}

export function useSuperAdminPractices() {
  const { data, error, isLoading, mutate } = useSWR<PracticesResponse>("/api/super-admin/practices", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 5000,
  })

  const practices = data?.practices || []

  // Calculate stats from practices data - no hardcoding
  const stats: PracticeStats = {
    total: practices.filter((p) => !p.deleted_at).length,
    active: practices.filter((p) => p.isActive && !p.deleted_at).length,
    inactive: practices.filter((p) => !p.isActive && !p.deleted_at).length,
    deleted: practices.filter((p) => !!p.deleted_at).length,
  }

  const createPractice = async (practiceData: {
    name: string
    type: string
    street?: string
    city?: string
    zipCode?: string
    phone?: string
    email?: string
    website?: string
    isActive?: boolean
  }) => {
    const response = await fetch("/api/practices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(practiceData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Fehler beim Erstellen der Praxis")
    }

    // Revalidate for instant update
    await mutate()
    return response.json()
  }

  const updatePractice = async (
    practiceId: number,
    updates: Partial<{
      name: string
      type: string
      street: string
      city: string
      zipCode: string
      phone: string
      email: string
      website: string
      isActive: boolean
    }>,
  ) => {
    if (!practiceId || practiceId <= 0) {
      throw new Error("Ungültige Praxis-ID")
    }

    const response = await fetch(`/api/practices/${practiceId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Fehler beim Aktualisieren der Praxis")
    }

    // Revalidate for instant update
    await mutate()
    return response.json()
  }

  const deletePractice = async (practiceId: number) => {
    if (!practiceId || practiceId <= 0) {
      throw new Error("Ungültige Praxis-ID")
    }

    const response = await fetch(`/api/practices/${practiceId}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Fehler beim Löschen der Praxis")
    }

    // Revalidate for instant update
    await mutate()
    return response.json()
  }

  const togglePracticeActive = async (practiceId: number, currentStatus: boolean) => {
    return updatePractice(practiceId, { isActive: !currentStatus })
  }

  return {
    practices,
    stats,
    total: data?.total || 0,
    isLoading,
    error,
    refresh: mutate,
    createPractice,
    updatePractice,
    deletePractice,
    togglePracticeActive,
  }
}

// Export types for use in components
export type { Practice, PracticeStats, PracticesResponse }
