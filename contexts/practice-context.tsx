"use client"

import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef, type ReactNode } from "react"
import { useUser } from "./user-context"

const HARDCODED_PRACTICE_ID = "1"

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
          if (data.practices && data.practices.length > 0) {
            setPractices(data.practices)
            const practice1 = data.practices.find((p: Practice) => p.id === HARDCODED_PRACTICE_ID || p.id === "1")
            if (practice1) {
              setCurrentPracticeState(practice1)
            } else {
              setCurrentPracticeState(data.practices[0])
            }
          } else {
            const fallbackPractice: Practice = {
              id: HARDCODED_PRACTICE_ID,
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
            setPractices([fallbackPractice])
            setCurrentPracticeState(fallbackPractice)
          }
        } else {
          const fallbackPractice: Practice = {
            id: HARDCODED_PRACTICE_ID,
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
          setPractices([fallbackPractice])
          setCurrentPracticeState(fallbackPractice)
        }
      } catch (error) {
        console.error("Error fetching practices:", error)
        const fallbackPractice: Practice = {
          id: HARDCODED_PRACTICE_ID,
          name: "Ihre Praxis",
          type: "General Practice",
          street: "",
          city: "",
          zipCode: "",
          phone: "",
          email: currentUser?.email || "",
          createdAt: new Date().toISOString().split("T")[0],
          isActive: true,
          adminCount: 1,
          memberCount: 0,
          lastActivity: new Date().toISOString(),
          color: "",
        }
        setPractices([fallbackPractice])
        setCurrentPracticeState(fallbackPractice)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPractices()
  }, [currentUser, userLoading])

  const setCurrentPractice = useCallback((practice: Practice) => {
    setCurrentPracticeState(practice)
  }, [])

  const addPractice = useCallback(
    async (
      practice: Omit<Practice, "id" | "createdAt" | "adminCount" | "memberCount" | "lastActivity">,
    ): Promise<Practice> => {
      const newPractice: Practice = {
        ...practice,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString().split("T")[0],
        adminCount: 1,
        memberCount: 0,
        lastActivity: new Date().toISOString(),
      }
      setPractices((prev) => [...prev, newPractice])
      return newPractice
    },
    [],
  )

  const updatePractice = useCallback(async (id: string, updates: Partial<Practice>) => {
    setPractices((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)))
    setCurrentPracticeState((prev) => (prev?.id === id ? { ...prev, ...updates } : prev))
  }, [])

  const deletePractice = useCallback(async (id: string) => {
    setPractices((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const getAllPracticesForSuperAdmin = useCallback(() => {
    return practices
  }, [practices])

  const deactivatePractice = useCallback((id: string) => {
    setPractices((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: false } : p)))
  }, [])

  const reactivatePractice = useCallback((id: string) => {
    setPractices((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: true } : p)))
  }, [])

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
