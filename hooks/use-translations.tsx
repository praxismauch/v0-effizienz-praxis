"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { getTranslation, type Locale } from "@/lib/translations"

export type Language = "de" | "en"

interface TranslationContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, fallback?: string) => string
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined)

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("de")
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
    const saved = localStorage.getItem("app-language") as Language | null
    if (saved && (saved === "de" || saved === "en")) {
      setLanguageState(saved)
    }
  }, [])

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage)
    if (typeof window !== "undefined") {
      localStorage.setItem("app-language", newLanguage)
    }
  }

  const t = (key: string, fallback?: string): string => {
    const translation = getTranslation(key, language)
    return translation === key && fallback ? fallback : translation
  }

  return <TranslationContext.Provider value={{ language, setLanguage, t }}>{children}</TranslationContext.Provider>
}

export function useTranslations() {
  const context = useContext(TranslationContext)
  if (!context) {
    throw new Error("useTranslations must be used within TranslationProvider")
  }
  return context
}

export function useTranslation() {
  return useTranslations()
}

export type { Locale }
