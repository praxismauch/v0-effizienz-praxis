"use client"

import { Button } from "@/components/ui/button"
import { useTranslation } from "@/contexts/translation-context"
import { Languages } from "lucide-react"

export function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation()

  return (
    <Button variant="outline" size="sm" onClick={() => setLanguage(language === "en" ? "de" : "en")} className="gap-2">
      <Languages className="h-4 w-4" />
      {language === "en" ? "DE" : "EN"}
    </Button>
  )
}

export default LanguageSwitcher
