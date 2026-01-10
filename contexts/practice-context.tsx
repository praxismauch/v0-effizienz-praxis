"use client"

import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef, type ReactNode } from "react"
import { useUser } from "./user-context"

export interface Practice {
  id: string
  name: string
  type: string
  street: string
  city: string
  zipCode: string
  phone: string
  email: string
  website?: string
  timezone?: string
  currency?: string
  address?: string
  createdAt: string
  isActive: boolean
  adminCount: number
  memberCount: number
  lastActivity: string
  color?: string
}

interface PracticeContextType {
  practices: Practice[]
  currentPractice: Practice | null
  setCurrentPractice: (practice: Practice) => void
  addPractice: (
    practice: Omit<Practice, "id" | "createdAt" | "adminCount" | "memberCount" | "lastActivity">,
  ) => Promise<Practice>
  updatePractice: (id: string, updates: Partial<Practice>) => Promise<void>
  deletePractice: (id: string) => Promise<void>
  getAllPracticesForSuperAdmin: () => Practice[]
  deactivatePractice: (id: string) => void
  reactivatePractice: (id: string) => void
  isLoading: boolean
}

const PracticeContext = createContext<PracticeContextType | undefined>(undefined)

export function PracticeProvider({ children }: { children: ReactNode }) {
  const [practices, setPractices] = useState<Practice[]>([])
  const [currentPractice, setCurrentPracticeState] = useState<Practice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const hasFetched = useRef(false)

  const { isSuperAdmin, currentUser, loading: userLoading } = useUser()

  useEffect(() => {
    if (userLoading) return
    if (!currentUser?.id) {
      setIsLoading(false)
      return
    }
    if (hasFetched.current) return

    const fetchPractices = async () => {
      hasFetched.current = true
      setIsLoading(true)

      try {
        const response = await fetch("/api/practices", {
          credentials: "include",
        })

        if (response.ok) {
          const data = await response.json()
          if (data.practices) {
            setPractices(data.practices)
          }
        } else {
          // Fallback practice if user has practice_id
          if (currentUser?.practice_id) {
            setPractices([
              {
                id: currentUser.practice_id,
                name: "Ihre Praxis",
                type: "General Practice",
                street: "",
                city: "",
                zipCode: "",
                phone: "",
                email: currentUser.email || "",
                createdAt: new Date().toISOString().split("T")[0],
                isActive: true,
                adminCount: 1,
                memberCount: 0,
                lastActivity: new Date().toISOString(),
                color: "",
              },
            ])
          }
        }
      } catch (error) {
        console.error("Error fetching practices:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPractices()
  }, [currentUser, userLoading])

  const setCurrentPractice = useCallback((practice: Practice) => {
    setCurrentPracticeState(practice)
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedPracticeId", practice.id)
    }
  }, [])

  // Initialize current practice selection
  useEffect(() => {
    if (isLoading || !practices.length || initialized) {
      return
    }

    // Try to restore from localStorage
    if (typeof window !== "undefined") {
      const savedPracticeId = localStorage.getItem("selectedPracticeId")
      if (savedPracticeId && savedPracticeId !== "0" && savedPracticeId !== "null") {
        const savedPractice = practices.find((p) => p.id === savedPracticeId)
        if (savedPractice && (isSuperAdmin || savedPractice.isActive)) {
          setCurrentPracticeState(savedPractice)
          setInitialized(true)
          return
        } else {
          localStorage.removeItem("selectedPracticeId")
        }
      }
    }

    // Select default practice
    if (isSuperAdmin) {
      const defaultPracticeId = currentUser?.defaultPracticeId
      if (defaultPracticeId) {
        const defaultPractice = practices.find((p) => p.id === defaultPracticeId)
        if (defaultPractice) {
          setCurrentPracticeState(defaultPractice)
          setInitialized(true)
          return
        }
      }

      const firstActivePractice = practices.find((p) => p.isActive)
      if (firstActivePractice) {
        setCurrentPracticeState(firstActivePractice)
      } else if (practices.length > 0) {
        setCurrentPracticeState(practices[0])
      }
    } else {
      const userPracticeId = currentUser?.practice_id || (currentUser as any)?.practiceId

      if (userPracticeId && userPracticeId !== "0" && userPracticeId !== "null") {
        const userPractice = practices.find((p) => p.id === userPracticeId)
        if (userPractice) {
          setCurrentPracticeState(userPractice)
        } else if (practices.length > 0) {
          setCurrentPracticeState(practices[0])
        }
      } else if (practices.length > 0) {
        setCurrentPracticeState(practices[0])
      }
    }

    setInitialized(true)
  }, [practices, isLoading, isSuperAdmin, currentUser, initialized])

  const addPractice = useCallback(
    async (practiceData: Omit<Practice, "id" | "createdAt" | "adminCount" | "memberCount" | "lastActivity">) => {
      try {
        const response = await fetch("/api/practices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(practiceData),
        })

        if (!response.ok) {
          throw new Error("Failed to create practice")
        }

        const data = await response.json()
        const newPractice = data.practice

        setPractices((prev) => [...prev, newPractice])
        return newPractice
      } catch (error) {
        console.error("Error creating practice:", error)
        throw error
      }
    },
    [],
  )

  const updatePractice = useCallback(
    async (id: string, updates: Partial<Practice>) => {
      // Update local state immediately
      setPractices((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)))

      if (currentPractice?.id === id) {
        setCurrentPracticeState((prev) => (prev ? { ...prev, ...updates } : null))
      }

      try {
        const apiUpdates: any = { ...updates }
        const isActiveUpdate = apiUpdates.isActive
        delete apiUpdates.isActive

        const validFields = [
          "name",
          "type",
          "address",
          "phone",
          "email",
          "website",
          "logo_url",
          "timezone",
          "currency",
          "settings",
          "color",
        ]

        Object.keys(apiUpdates).forEach((key) => {
          if (!validFields.includes(key) && key !== "street" && key !== "city" && key !== "zipCode") {
            delete apiUpdates[key]
          }
        })

        if (updates.street !== undefined || updates.city !== undefined || updates.zipCode !== undefined) {
          const street = updates.street || ""
          const city = updates.city || ""
          const zipCode = updates.zipCode || ""
          apiUpdates.address = [street, city, zipCode].filter(Boolean).join(", ")
          delete apiUpdates.street
          delete apiUpdates.city
          delete apiUpdates.zipCode
        }

        if (isActiveUpdate !== undefined) {
          apiUpdates.isActive = isActiveUpdate
        }

        const response = await fetch(`/api/practices/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiUpdates),
        })

        if (!response.ok) {
          throw new Error("Failed to update practice")
        }
      } catch (error) {
        console.error("Error updating practice:", error)
        // Revert on error
        hasFetched.current = false
        throw error
      }
    },
    [currentPractice],
  )

  const deletePractice = useCallback(
    async (id: string) => {
      if (!id || id === "0" || id === "default" || id.trim() === "") {
        throw new Error("Ungültige Praxis-ID. Diese Praxis kann nicht gelöscht werden.")
      }

      const filteredPractices = practices.filter((p) => p.id !== id)
      setPractices(filteredPractices)

      if (typeof window !== "undefined" && currentPractice?.id === id) {
        localStorage.removeItem("selectedPracticeId")
        const newCurrent = filteredPractices.length > 0 ? filteredPractices[0] : null
        setCurrentPracticeState(newCurrent)
      }

      try {
        const response = await fetch(`/api/practices/${id}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || "Failed to delete practice")
        }
      } catch (error) {
        console.error("Error deleting practice:", error)
        // Revert on error
        hasFetched.current = false
        throw error
      }
    },
    [practices, currentPractice],
  )

  const getAllPracticesForSuperAdmin = useCallback(() => {
    return isSuperAdmin ? practices : practices.filter((p) => p.isActive)
  }, [isSuperAdmin, practices])

  const deactivatePractice = useCallback(
    (id: string) => {
      if (isSuperAdmin) {
        updatePractice(id, { isActive: false })
      }
    },
    [isSuperAdmin, updatePractice],
  )

  const reactivatePractice = useCallback(
    (id: string) => {
      if (isSuperAdmin) {
        updatePractice(id, { isActive: true })
      }
    },
    [isSuperAdmin, updatePractice],
  )

  const contextValue = useMemo(
    () => ({
      practices,
      currentPractice,
      setCurrentPractice,
      addPractice,
      updatePractice,
      deletePractice,
      getAllPracticesForSuperAdmin,
      deactivatePractice,
      reactivatePractice,
      isLoading,
    }),
    [
      practices,
      currentPractice,
      setCurrentPractice,
      addPractice,
      updatePractice,
      deletePractice,
      getAllPracticesForSuperAdmin,
      deactivatePractice,
      reactivatePractice,
      isLoading,
    ],
  )

  return <PracticeContext.Provider value={contextValue}>{children}</PracticeContext.Provider>
}

export function usePractice() {
  const context = useContext(PracticeContext)
  if (context === undefined) {
    throw new Error("usePractice must be used within a PracticeProvider")
  }
  return context
}

export default PracticeProvider
