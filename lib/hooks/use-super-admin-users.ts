"use client"

import useSWR from "swr"

interface User {
  id: string
  email: string
  name: string
  role: string
  is_active: boolean
  created_at: string
  updated_at: string | null
  last_login: string | null
  practice_id: string | null
  practice_name: string | null
  practice_color: string | null
  practices: Array<{
    practiceId: string
    practiceName: string
    role: string
    isPrimary: boolean
  }>
  phone: string | null
  avatar: string | null
  preferred_language: string
  specialization: string | null
  approval_status: string | null
}

interface Practice {
  id: string
  name: string
  color: string | null
}

interface UserStats {
  total: number
  active: number
  inactive: number
  superAdmins: number
  withPractice: number
  withoutPractice: number
}

interface UsersResponse {
  users: User[]
  stats: UserStats
  practices: Practice[]
}

const fetcher = async (url: string): Promise<UsersResponse> => {
  const response = await fetch(url)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Fehler beim Laden der Benutzer")
  }
  return response.json()
}

export function useSuperAdminUsers() {
  const { data, error, isLoading, mutate } = useSWR<UsersResponse>("/api/super-admin/users", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 5000,
  })

  const createUser = async (userData: {
    email: string
    password: string
    name: string
    role?: string
    practiceId?: string | number | null // Support string (database format), number (legacy), or null
    preferred_language?: string
  }) => {
    const payload: Record<string, unknown> = {
      email: userData.email,
      password: userData.password,
      name: userData.name,
      role: userData.role,
      preferred_language: userData.preferred_language,
    }

    // Convert practiceId to string format (database expects TEXT)
    if (userData.practiceId !== undefined && userData.practiceId !== null && userData.practiceId !== "none") {
      payload.practiceId = String(userData.practiceId)
    }

    const response = await fetch("/api/super-admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Benutzer konnte nicht erstellt werden")
    }

    // Revalidate the cache for instant update
    await mutate()
    return response.json()
  }

  const updateUser = async (
    id: string,
    updates: {
      name?: string
      email?: string
      is_active?: boolean
      role?: string
      practice_id?: string | number | null // Support string (database format), number (legacy), or null
      preferred_language?: string
      phone?: string
      specialization?: string
    },
  ) => {
    if (!id || id === "undefined" || id === "null") {
      throw new Error("Ungültige Benutzer-ID")
    }

    const response = await fetch(`/api/super-admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Benutzer konnte nicht aktualisiert werden")
    }

    // Revalidate the cache for instant update
    await mutate()
    return response.json()
  }

  const deleteUser = async (userId: string) => {
    if (!userId || userId === "undefined" || userId === "null") {
      throw new Error("Ungültige Benutzer-ID")
    }

    const response = await fetch(`/api/super-admin/users/${userId}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Benutzer konnte nicht gelöscht werden")
    }

    // Revalidate the cache for instant update
    await mutate()
    return response.json()
  }

  const toggleUserActive = async (userId: string, currentStatus: boolean) => {
    return updateUser(userId, { is_active: !currentStatus })
  }

  return {
    users: data?.users || [],
    stats: data?.stats || { total: 0, active: 0, inactive: 0, superAdmins: 0, withPractice: 0, withoutPractice: 0 },
    practices: data?.practices || [],
    isLoading,
    error,
    refresh: mutate,
    createUser,
    updateUser,
    deleteUser,
    toggleUserActive,
  }
}
