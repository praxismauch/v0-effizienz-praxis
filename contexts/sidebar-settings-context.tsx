"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"

interface SidebarSettingsContextType {
  singleGroupMode: boolean
  setSingleGroupMode: (value: boolean) => void
  isLoaded: boolean
}

const SidebarSettingsContext = createContext<SidebarSettingsContextType>({
  singleGroupMode: true,
  setSingleGroupMode: () => {},
  isLoaded: false,
})

export function SidebarSettingsProvider({ children }: { children: ReactNode }) {
  const [singleGroupMode, setSingleGroupModeState] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)
  const { currentUser } = useUser()
  const { currentPractice } = usePractice()

  // Load setting from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebar-single-group-mode")
      if (saved !== null) {
        setSingleGroupModeState(saved === "true")
      }
      setIsLoaded(true)
    }
  }, [])

  // Load from API when user is available
  useEffect(() => {
    const loadFromApi = async () => {
      if (!currentUser?.id) return

      try {
        const practiceId = currentPractice?.id || "1"
        const response = await fetch(`/api/users/${currentUser.id}/sidebar-preferences?practice_id=${practiceId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.preferences?.single_group_mode !== undefined) {
            setSingleGroupModeState(data.preferences.single_group_mode)
            localStorage.setItem("sidebar-single-group-mode", String(data.preferences.single_group_mode))
          }
        }
      } catch (error) {
        console.error("[v0] Error loading sidebar settings:", error)
      }
    }

    loadFromApi()
  }, [currentUser?.id, currentPractice?.id])

  const setSingleGroupMode = async (value: boolean) => {
    setSingleGroupModeState(value)
    localStorage.setItem("sidebar-single-group-mode", String(value))

    // Save to API
    if (currentUser?.id) {
      try {
        const practiceId = currentPractice?.id || "1"
        await fetch(`/api/users/${currentUser.id}/sidebar-preferences`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            practice_id: practiceId,
            single_group_mode: value,
          }),
        })
      } catch (error) {
        console.error("[v0] Error saving sidebar settings:", error)
      }
    }
  }

  return (
    <SidebarSettingsContext.Provider value={{ singleGroupMode, setSingleGroupMode, isLoaded }}>
      {children}
    </SidebarSettingsContext.Provider>
  )
}

export function useSidebarSettings() {
  const context = useContext(SidebarSettingsContext)
  if (!context) {
    throw new Error("useSidebarSettings must be used within a SidebarSettingsProvider")
  }
  return context
}
