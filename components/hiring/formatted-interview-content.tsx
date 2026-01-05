"use client"

import { cn } from "@/lib/utils"
import type { JSX } from "react"

interface FormattedInterviewContentProps {
  content: string
  className?: string
  maxLines?: number // Add optional prop to limit preview lines
}

export function FormattedInterviewContent({ content, className, maxLines }: FormattedInterviewContentProps) {
  // Parse the content and convert markdown-style formatting to HTML
  const parseContent = (text: string) => {
    const lines = text.split("\n")
    const displayLines = maxLines ? lines.slice(0, maxLines) : lines
    const result: JSX.Element[] = []
    let currentList: string[] = []
    let listType: "ul" | "ol" | null = null

    const flushList = () => {
      if (currentList.length > 0) {
        const ListTag = listType === "ol" ? "ol" : "ul"
        result.push(
          <ListTag
            key={`list-${result.length}`}
            className={cn("space-y-2 my-4", listType === "ol" ? "list-decimal" : "list-disc", "ml-6")}
          >
            {currentList.map((item, idx) => (
              <li
                key={idx}
                className="text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatInlineText(item) }}
              />
            ))}
          </ListTag>,
        )
        currentList = []
        listType = null
      }
    }

    const formatInlineText = (text: string) => {
      // Convert **bold** to <strong>
      return text.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
    }

    displayLines.forEach((line, index) => {
      const trimmed = line.trim()

      // Empty line
      if (!trimmed) {
        flushList()
        return
      }

      // Main section headers (e.g., **1. EINLEITUNG & KENNENLERNEN**)
      if (/^\*\*\d+\.\s+[A-ZÄÖÜ\s&]+\*\*$/.test(trimmed)) {
        flushList()
        const text = trimmed.replace(/^\*\*|\*\*$/g, "")
        result.push(
          <div key={`header-${index}`} className="mt-6 first:mt-0 mb-3">
            <h3 className="text-lg font-bold text-primary border-l-4 border-primary pl-3 py-1">{text}</h3>
          </div>,
        )
        return
      }

      // Subsection headers (e.g., - **Begrüßung und Vorstellung**)
      if (/^-\s+\*\*(.+?)\*\*$/.test(trimmed)) {
        flushList()
        const text = trimmed.replace(/^-\s+\*\*|\*\*$/g, "")
        result.push(
          <div key={`subheader-${index}`} className="mt-4 mb-2">
            <h4 className="text-base font-semibold text-foreground">{text}</h4>
          </div>,
        )
        return
      }

      // Title headers (e.g., **Interviewleitfaden für die Position: [Positionstitel]**)
      if (trimmed.startsWith("**") && trimmed.endsWith("**") && !trimmed.match(/^\*\*\d+\./)) {
        flushList()
        const text = trimmed.replace(/^\*\*|\*\*$/g, "")
        result.push(
          <div key={`title-${index}`} className="mb-4">
            <h2 className="text-xl font-bold text-primary">{text}</h2>
          </div>,
        )
        return
      }

      // Numbered list item (e.g., "1. Item")
      if (/^\d+\.\s+/.test(trimmed)) {
        if (listType !== "ol") {
          flushList()
          listType = "ol"
        }
        currentList.push(trimmed.replace(/^\d+\.\s+/, ""))
        return
      }

      // Bullet list item (e.g., "- Item")
      if (/^-\s+/.test(trimmed)) {
        if (listType !== "ul") {
          flushList()
          listType = "ul"
        }
        currentList.push(trimmed.replace(/^-\s+/, ""))
        return
      }

      // Separator (---)
      if (trimmed === "---") {
        flushList()
        result.push(<hr key={`hr-${index}`} className="my-6 border-border" />)
        return
      }

      // Regular paragraph
      flushList()
      result.push(
        <p
          key={`p-${index}`}
          className="text-sm leading-relaxed mb-3 text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: formatInlineText(trimmed) }}
        />,
      )
    })

    flushList()

    if (maxLines && lines.length > maxLines) {
      result.push(
        <p key="truncated" className="text-xs text-muted-foreground italic mt-2">
          ... ({lines.length - maxLines} weitere Zeilen)
        </p>,
      )
    }

    return result
  }

  return <div className={cn("space-y-2", className)}>{parseContent(content)}</div>
}
