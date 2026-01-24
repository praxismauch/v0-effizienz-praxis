"use client"

import { createContext, useContext, useState, useMemo, useCallback, useEffect, useRef, type ReactNode } from "react"
import useSWR, { useSWRConfig } from "swr"
import { useUser } from "./user-context"
import { SWR_KEYS } from "@/lib/swr-keys"
import { swrFetcher } from "@/lib/swr-fetcher"

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
  refreshPractices: () => Promise<void>
}

const PracticeContext = createContext<PracticeContextType | undefined>(undefined)

export function PracticeProvider({ children }: { children: ReactNode }) {
  const [currentPracticeState, setCurrentPracticeState] = useState<Practice | null>(null)
  const { mutate: globalMutate } = useSWRConfig()

  const hasSetInitialPractice = useRef(false)

  const { isSuperAdmin, currentUser, loading: userLoading } = useUser()

  const { data, error, isLoading, mutate } = useSWR<{ practices: Practice[] }>(
    currentUser?.id ? SWR_KEYS.practices() : null,
    swrFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      // REMOVED: onSuccess callback that was causing render loop
    },
  )

  const practices = useMemo(() => {
    return data?.practices || []
  }, [data?.practices])

  useEffect(() => {
    // Only set initial practice once when data loads and no practice is selected
    if (practices.length > 0 && !currentPracticeState && !hasSetInitialPractice.current) {
      hasSetInitialPractice.current = true
      // Use String() comparison to handle both string and integer IDs
      const userPractice = practices.find((p: Practice) => String(p.id) === String(currentUser?.practiceId))
      setCurrentPracticeState(userPractice || practices[0])
    }
  }, [practices, currentPracticeState, currentUser?.practiceId])

  useEffect(() => {
    if (!currentUser?.id) {
      hasSetInitialPractice.current = false
      setCurrentPracticeState(null)
    }
  }, [currentUser?.id])

  const setCurrentPractice = useCallback((practice: Practice) => {
    setCurrentPracticeState(practice)
  }, [])

  const refreshPractices = useCallback(async () => {
    await mutate()
  }, [mutate])

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

      await mutate(
        (current) => ({
          practices: [...(current?.practices || []), newPractice],
        }),
        { revalidate: false },
      )

      return newPractice
    },
    [mutate],
  )

  const updatePractice = useCallback(
    async (id: string, updates: Partial<Practice>) => {
      await mutate(
        (current) => ({
          practices: (current?.practices || []).map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }),
        { revalidate: false },
      )

      if (currentPracticeState?.id === id) {
        setCurrentPracticeState((prev) => (prev ? { ...prev, ...updates } : prev))
      }
    },
    [mutate, currentPracticeState?.id],
  )

  const deletePractice = useCallback(
    async (id: string) => {
      await mutate(
        (current) => ({
          practices: (current?.practices || []).filter((p) => p.id !== id),
        }),
        { revalidate: false },
      )
    },
    [mutate],
  )

  const getAllPracticesForSuperAdmin = useCallback(() => {
    return practices
  }, [practices])

  const deactivatePractice = useCallback(
    (id: string) => {
      mutate(
        (current) => ({
          practices: (current?.practices || []).map((p) => (p.id === id ? { ...p, isActive: false } : p)),
        }),
        { revalidate: false },
      )
    },
    [mutate],
  )

  const reactivatePractice = useCallback(
    (id: string) => {
      mutate(
        (current) => ({
          practices: (current?.practices || []).map((p) => (p.id === id ? { ...p, isActive: true } : p)),
        }),
        { revalidate: false },
      )
    },
    [mutate],
  )

  const stableContextValue = useMemo(
    () => ({
      practices,
      currentPractice: currentPracticeState,
      setCurrentPractice,
      addPractice,
      updatePractice,
      deletePractice,
      getAllPracticesForSuperAdmin,
      deactivatePractice,
      reactivatePractice,
      refreshPractices,
    }),
    [
      practices,
      currentPracticeState,
      setCurrentPractice,
      addPractice,
      updatePractice,
      deletePractice,
      getAllPracticesForSuperAdmin,
      deactivatePractice,
      reactivatePractice,
      refreshPractices,
    ],
  )

  const contextValue = useMemo(
    () => ({
      ...stableContextValue,
      isLoading: userLoading || isLoading,
    }),
    [stableContextValue, userLoading, isLoading],
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
