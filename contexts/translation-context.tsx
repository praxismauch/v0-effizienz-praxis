"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { getTranslation } from "@/lib/translations"

export type Language = "en" | "de"

interface TranslationContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, fallback?: string) => string
  translations: never[]
  isLoading: boolean
  refreshTranslations: () => Promise<void>
  hasMounted: boolean
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined)

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("de")
  const [hasMounted, setHasMounted] = useState(false)

  // Hydration-safe: only access localStorage after mount
  useEffect(() => {
    setHasMounted(true)
    try {
      const saved = localStorage.getItem("app-language") as Language | null
      if (saved && (saved === "de" || saved === "en")) {
        setLanguageState(saved)
      }
    } catch {
      // localStorage may not be available (SSR, private browsing)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    if (lang !== language) {
      setLanguageState(lang)
      // Only persist after hydration to avoid SSR mismatches
      if (hasMounted) {
        try {
          localStorage.setItem("app-language", lang)
        } catch {
          // localStorage may not be available
        }
      }
    }
  }

  const t = (key: string, fallback?: string): string => {
    const translation = getTranslation(key, language)
    return translation === key && fallback ? fallback : translation
  }

  const refreshTranslations = async () => {
    // No longer needed with file-based translations
  }

  return (
    <TranslationContext.Provider
      value={{
        language,
        setLanguage,
        t,
        translations: [],
        isLoading: !hasMounted,
        refreshTranslations,
        hasMounted,
      }}
    >
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(TranslationContext)
  if (context === undefined) {
    throw new Error("useTranslation must be used within a TranslationProvider")
  }
  return context
}

export const useTranslations = useTranslation

export default TranslationProvider
