import deTranslations from "@/locales/de.json"
import enTranslations from "@/locales/en.json"

export type TranslationKey = string
export type Translations = typeof deTranslations

const translations = {
  de: deTranslations,
  en: enTranslations,
} as const

export type Locale = keyof typeof translations

export function getTranslation(key: string, locale: Locale = "de"): string {
  const keys = key.split(".")
  let value: any = translations[locale]

  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = value[k]
    } else {
      // Fallback to key if translation not found
      return key
    }
  }

  return typeof value === "string" ? value : key
}

export function getTranslations(locale: Locale = "de"): Translations {
  return translations[locale]
}
