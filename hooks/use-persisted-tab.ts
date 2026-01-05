"use client"

import { useState, useEffect } from "react"

/**
 * Custom hook to persist tab selection in localStorage
 * @param key - Unique storage key for this tab group
 * @param defaultValue - Default tab value if none is stored
 * @returns [activeTab, setActiveTab] - Current tab and setter function
 */
export function usePersistedTab(key: string, defaultValue: string) {
  const [activeTab, setActiveTab] = useState<string>(defaultValue)
  const [isInitialized, setIsInitialized] = useState(false)

  // Load saved tab from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`tab-${key}`)
      if (saved) {
        setActiveTab(saved)
      }
    } catch (error) {
      console.error("Failed to load saved tab:", error)
    } finally {
      setIsInitialized(true)
    }
  }, [key])

  // Save tab to localStorage when it changes
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(`tab-${key}`, activeTab)
      } catch (error) {
        console.error("Failed to save tab:", error)
      }
    }
  }, [key, activeTab, isInitialized])

  return [activeTab, setActiveTab] as const
}

export default usePersistedTab
