"use client"

import { useState, useEffect, useRef } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff } from "lucide-react"
import { formatTextToHtml } from "@/lib/format-text"

interface FormattedTextareaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  required?: boolean
  id?: string
}

export function FormattedTextarea({ value, onChange, placeholder, rows = 4, required, id }: FormattedTextareaProps) {
  const [showFormatted, setShowFormatted] = useState(false)
  const prevValueRef = useRef(value)

  useEffect(() => {
    const prevValue = prevValueRef.current
    const currentValue = value

    // If value changed significantly (more than 50 chars added at once), show preview
    if (currentValue && currentValue.length > prevValue.length + 50) {
      setShowFormatted(true)
    }

    prevValueRef.current = currentValue
  }, [value])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowFormatted(!showFormatted)}
          className="h-8 px-2 text-xs"
        >
          {showFormatted ? (
            <>
              <EyeOff className="h-3 w-3 mr-1" />
              Bearbeiten
            </>
          ) : (
            <>
              <Eye className="h-3 w-3 mr-1" />
              Vorschau
            </>
          )}
        </Button>
      </div>

      {showFormatted ? (
        <div
          className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
          style={{ minHeight: `${rows * 1.5}rem` }}
        >
          <div
            className="formatted-text prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: formatTextToHtml(value) }}
          />
        </div>
      ) : (
        <Textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          required={required}
        />
      )}
    </div>
  )
}

export default FormattedTextarea
