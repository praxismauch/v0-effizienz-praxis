"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePractice } from "@/contexts/practice-context"

interface OrgaCategory {
  id: string
  name: string
  color: string
  sort_order?: number
}

interface OrgaCategorySelectProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
  showNoneOption?: boolean
  noneOptionLabel?: string
}

export function OrgaCategorySelect({
  value,
  onValueChange,
  placeholder = "Kategorie wählen...",
  disabled = false,
  required = false,
  showNoneOption = true,
  noneOptionLabel = "Keine Kategorie",
}: OrgaCategorySelectProps) {
  const { currentPractice } = usePractice()
  const [categories, setCategories] = useState<OrgaCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      if (!currentPractice?.id) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/practices/${currentPractice.id}/orga-categories`)
        if (response.ok) {
          const data = await response.json()
          const cats = data.categories || []
          // Sort by sort_order, then by name
          cats.sort((a: OrgaCategory, b: OrgaCategory) => {
            if (a.sort_order !== undefined && b.sort_order !== undefined) {
              return a.sort_order - b.sort_order
            }
            return a.name.localeCompare(b.name)
          })
          setCategories(cats)
        }
      } catch (error) {
        console.error("[v0] Error fetching orga categories:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [currentPractice?.id])

  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled || loading}
      required={required}
    >
      <SelectTrigger>
        <SelectValue placeholder={loading ? "Kategorien werden geladen..." : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {showNoneOption && (
          <SelectItem value="none">
            <span className="text-muted-foreground">{noneOptionLabel}</span>
          </SelectItem>
        )}
        {categories.length === 0 && !loading ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            Keine Kategorien verfügbar
          </div>
        ) : (
          categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.name}>
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color || "#64748b" }}
                />
                <span>{cat.name}</span>
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  )
}

export default OrgaCategorySelect
