"use client"

import useSWR from "swr"
import { SHARED_SWR_CONFIG } from "@/lib/swr-config"

export interface DefaultTeam {
  id: string
  name: string
  color: string
  description: string | null
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  practiceCount?: number
  totalPractices?: number
  syncStatus?: "synced" | "partial" | "not_synced"
}

export interface PracticeTeam {
  id: string
  practice_id: number
  name: string
  description: string | null
  color: string
  is_active: boolean
  is_default: boolean
  created_at: string
  updated_at: string | null
  practice: {
    id: number
    name: string
    color: string | null
  } | null
  memberCount: number
}

export interface TeamsStats {
  total: number
  active: number
  inactive: number
  defaultTeams: number
  practicesWithTeams: number
  totalMembers: number
}

interface TeamsResponse {
  teams: PracticeTeam[]
  stats: TeamsStats
}

interface DefaultTeamsResponse {
  defaultTeams: DefaultTeam[]
}

export function useSuperAdminTeams() {
  const { data, error, isLoading, mutate } = useSWR<TeamsResponse>("/api/super-admin/teams", {
    ...SHARED_SWR_CONFIG,
  })

  return {
    teams: data?.teams || [],
    stats: data?.stats || {
      total: 0,
      active: 0,
      inactive: 0,
      defaultTeams: 0,
      practicesWithTeams: 0,
      totalMembers: 0,
    },
    isLoading,
    error,
    refresh: () => mutate(),
  }
}

export function useSuperAdminDefaultTeams() {
  const { data, error, isLoading, mutate } = useSWR<DefaultTeamsResponse>("/api/super-admin/default-teams", {
    ...SHARED_SWR_CONFIG,
  })

  const createDefaultTeam = async (teamData: {
    name: string
    color: string
    description?: string
    display_order?: number
    syncToPractices?: boolean
  }) => {
    const res = await fetch("/api/super-admin/default-teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(teamData),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || "Fehler beim Erstellen des Teams")
    }

    const result = await res.json()
    mutate() // Refresh data
    return result
  }

  const updateDefaultTeam = async (
    id: string,
    teamData: {
      name?: string
      color?: string
      description?: string
      display_order?: number
      is_active?: boolean
      syncChanges?: boolean
    },
  ) => {
    if (!id) throw new Error("Team-ID ist erforderlich")

    const res = await fetch(`/api/super-admin/default-teams/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(teamData),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || "Fehler beim Aktualisieren des Teams")
    }

    const result = await res.json()
    mutate() // Refresh data
    return result
  }

  const deleteDefaultTeam = async (id: string) => {
    if (!id) throw new Error("Team-ID ist erforderlich")

    const res = await fetch(`/api/super-admin/default-teams/${id}`, {
      method: "DELETE",
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || "Fehler beim Löschen des Teams")
    }

    const result = await res.json()
    mutate() // Refresh data
    return result
  }

  const syncAllTeams = async () => {
    const res = await fetch("/api/super-admin/default-teams/sync", {
      method: "POST",
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || "Fehler beim Synchronisieren der Teams")
    }

    const result = await res.json()
    mutate() // Refresh data
    return result
  }

  return {
    defaultTeams: data?.defaultTeams || [],
    isLoading,
    error,
    refresh: () => mutate(),
    createDefaultTeam,
    updateDefaultTeam,
    deleteDefaultTeam,
    syncAllTeams,
  }
}
