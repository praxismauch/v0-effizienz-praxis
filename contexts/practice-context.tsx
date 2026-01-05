"use client"

import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from "react"
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

  const { isSuperAdmin, currentUser, loading: userLoading } = useUser()
  const stateRef = useRef({
    initialized: false,
    isLoadingPractices: false,
    lastUserId: null as string | null,
  })

  const abortControllerRef = useRef<AbortController | null>(null)

  const setCurrentPractice = useCallback((practice: Practice) => {
    setCurrentPracticeState(practice)
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedPracticeId", practice.id)
    }
  }, [])

  const loadPractices = useCallback(async (signal: AbortSignal) => {
    try {
      const response = await fetch("/api/practices", {
        signal,
        cache: "default",
      })

      if (signal.aborted) return null

      if (!response.ok) {
        return null
      }

      const text = await response.text()
      if (!text || text.trim().length === 0) {
        return null
      }

      try {
        const data = JSON.parse(text)
        return data.practices || []
      } catch {
        return null
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return null
      }
      return null
    }
  }, [])

  useEffect(() => {
    const userId = currentUser?.id
    const state = stateRef.current

    if (!userId) {
      if (!userLoading) {
        setIsLoading(false)
      }
      return
    }

    if (state.isLoadingPractices || state.lastUserId === userId) {
      if (state.lastUserId === userId) {
        setIsLoading(false)
      }
      return
    }

    state.lastUserId = userId
    state.isLoadingPractices = true
    setIsLoading(true)

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    const fetchPractices = async () => {
      const loadedPractices = await loadPractices(abortControllerRef.current!.signal)

      if (loadedPractices === null) {
        if (currentUser?.practice_id) {
          const userPractice: Practice = {
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
          }
          setPractices([userPractice])
          if (!currentPractice) {
            setCurrentPracticeState(userPractice)
          }
        } else {
          setPractices([])
        }
      } else {
        setPractices(loadedPractices)
      }

      setIsLoading(false)
      state.isLoadingPractices = false
    }

    fetchPractices()

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [currentUser, userLoading, loadPractices, currentPractice])

  useEffect(() => {
    const state = stateRef.current

    if (isLoading || !practices.length || currentPractice) {
      return
    }

    if (typeof window !== "undefined") {
      const savedPracticeId = localStorage.getItem("selectedPracticeId")
      if (savedPracticeId && savedPracticeId !== "0" && savedPracticeId !== "null") {
        const savedPractice = practices.find((p) => p.id === savedPracticeId)
        if (savedPractice && (isSuperAdmin || savedPractice.isActive)) {
          setCurrentPracticeState(savedPractice)
          state.initialized = true
          return
        } else {
          localStorage.removeItem("selectedPracticeId")
        }
      }
    }

    if (isSuperAdmin) {
      const defaultPracticeId = currentUser?.defaultPracticeId
      if (defaultPracticeId) {
        const defaultPractice = practices.find((p) => p.id === defaultPracticeId)
        if (defaultPractice) {
          setCurrentPracticeState(defaultPractice)
          state.initialized = true
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

    state.initialized = true
  }, [practices, isLoading, isSuperAdmin, currentUser, currentPractice])

  const addPractice = async (
    practiceData: Omit<Practice, "id" | "createdAt" | "adminCount" | "memberCount" | "lastActivity">,
  ) => {
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
      const newPractice: Practice = {
        ...practiceData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString().split("T")[0],
        adminCount: 0,
        memberCount: 0,
        lastActivity: new Date().toISOString(),
        color: "",
      }
      setPractices((prev) => [...prev, newPractice])
      return newPractice
    }
  }

  const updatePractice = async (id: string, updates: Partial<Practice>) => {
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
        const errorText = await response.text()
        throw new Error("Failed to update practice")
      }

      const data = await response.json()

      if (data.practice) {
        setPractices((prev) =>
          prev.map((practice) => (practice.id === id ? { ...practice, ...data.practice } : practice)),
        )
        if (currentPractice?.id === id) {
          setCurrentPracticeState((prev) => (prev ? { ...prev, ...data.practice } : null))
        }
      }
    } catch (error) {
      throw error
    }
  }

  const deletePractice = async (id: string) => {
    if (!id || id === "0" || id === "default" || id.trim() === "") {
      throw new Error("Ungültige Praxis-ID. Diese Praxis kann nicht gelöscht werden.")
    }

    try {
      const response = await fetch(`/api/practices/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to delete practice")
      }

      if (typeof window !== "undefined" && currentPractice?.id === id) {
        localStorage.removeItem("selectedPracticeId")
      }

      setPractices((prev) => {
        const filtered = prev.filter((practice) => practice.id !== id)

        if (currentPractice?.id === id) {
          const newCurrent = filtered.length > 0 ? filtered[0] : null
          setCurrentPracticeState(newCurrent)
        }

        return filtered
      })
    } catch (error) {
      throw error
    }
  }

  const getAllPracticesForSuperAdmin = () => {
    return isSuperAdmin ? practices : practices.filter((p) => p.isActive)
  }

  const deactivatePractice = (id: string) => {
    if (isSuperAdmin) {
      updatePractice(id, { isActive: false })
    }
  }

  const reactivatePractice = (id: string) => {
    if (isSuperAdmin) {
      updatePractice(id, { isActive: true })
    }
  }

  return (
    <PracticeContext.Provider
      value={{
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
      }}
    >
      {children}
    </PracticeContext.Provider>
  )
}

export function usePractice() {
  const context = useContext(PracticeContext)
  if (context === undefined) {
    throw new Error("usePractice must be used within a PracticeProvider")
  }
  return context
}

export default PracticeProvider
