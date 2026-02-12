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
            className={cn("space-y-1 my-3", listType === "ol" ? "list-decimal" : "list-disc", "ml-5")}
          >
            {currentList.map((item, idx) => (
              <li
                key={idx}
                className="text-sm leading-relaxed text-foreground"
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
      return text
        // Convert **bold** to <strong>
        .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
        // Convert *italic* to <em> (but not inside **)
        .replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>')
        // Convert `code` to <code>
        .replace(/`([^`]+?)`/g, '<code class="px-1 py-0.5 rounded bg-muted text-xs font-mono">$1</code>')
    }

    displayLines.forEach((line, index) => {
      const trimmed = line.trim()

      // Empty line
      if (!trimmed) {
        flushList()
        return
      }

      // Markdown H1 (# Header)
      if (/^#\s+(.+)$/.test(trimmed)) {
        flushList()
        const text = trimmed.replace(/^#\s+/, "")
        result.push(
          <div key={`h1-${index}`} className="mt-6 first:mt-0 mb-3 pb-2 border-b-2 border-primary/30">
            <h1 className="text-lg font-bold text-primary leading-tight">{text}</h1>
          </div>,
        )
        return
      }

      // Markdown H2 (## Header)
      if (/^##\s+(.+)$/.test(trimmed)) {
        flushList()
        const text = trimmed.replace(/^##\s+/, "")
        result.push(
          <div key={`h2-${index}`} className="mt-5 first:mt-0 mb-2">
            <h2 className="text-base font-bold text-primary border-l-4 border-primary/70 pl-3 py-1 leading-tight">{text}</h2>
          </div>,
        )
        return
      }

      // Markdown H3 (### Header)
      if (/^###\s+(.+)$/.test(trimmed)) {
        flushList()
        const text = trimmed.replace(/^###\s+/, "")
        result.push(
          <div key={`h3-${index}`} className="mt-4 first:mt-0 mb-2">
            <h3 className="text-sm font-semibold text-foreground">{text}</h3>
          </div>,
        )
        return
      }

      // Markdown H4 (#### Header)
      if (/^####\s+(.+)$/.test(trimmed)) {
        flushList()
        const text = trimmed.replace(/^####\s+/, "")
        result.push(
          <div key={`h4-${index}`} className="mt-3 first:mt-0 mb-1">
            <h4 className="text-sm font-medium text-muted-foreground">{text}</h4>
          </div>,
        )
        return
      }

      // Main section headers (e.g., **1. EINLEITUNG & KENNENLERNEN**)
      if (/^\*\*\d+\.\s+[A-ZÄÖÜ\s&()]+\*\*$/.test(trimmed)) {
        flushList()
        const text = trimmed.replace(/^\*\*|\*\*$/g, "")
        result.push(
          <div key={`header-${index}`} className="mt-5 first:mt-0 mb-2">
            <h3 className="text-base font-bold text-primary border-l-4 border-primary/70 pl-3 py-1 leading-tight">{text}</h3>
          </div>,
        )
        return
      }

      // Subsection headers (e.g., - **Begrüßung und Vorstellung**)
      if (/^-\s+\*\*(.+?)\*\*$/.test(trimmed)) {
        flushList()
        const text = trimmed.replace(/^-\s+\*\*|\*\*$/g, "")
        result.push(
          <div key={`subheader-${index}`} className="mt-3 mb-2">
            <h4 className="text-sm font-semibold text-foreground">{text}</h4>
          </div>,
        )
        return
      }

      // Title headers (e.g., **Interviewleitfaden für die Position: [Positionstitel]**)
      if (trimmed.startsWith("**") && trimmed.endsWith("**") && !trimmed.match(/^\*\*\d+\./)) {
        flushList()
        const text = trimmed.replace(/^\*\*|\*\*$/g, "")
        result.push(
          <div key={`title-${index}`} className="mb-3">
            <h2 className="text-base font-bold text-primary leading-tight">{text}</h2>
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
        result.push(<hr key={`hr-${index}`} className="my-4 border-border/50" />)
        return
      }

      // Regular paragraph
      flushList()
      result.push(
        <p
          key={`p-${index}`}
          className="text-sm leading-relaxed mb-2 text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: formatInlineText(trimmed) }}
        />,
      )
    })

    flushList()

    if (maxLines && lines.length > maxLines) {
      result.push(
        <p key="truncated" className="text-xs text-muted-foreground italic mt-3 pt-2 border-t border-border/30">
          ... ({lines.length - maxLines} weitere Zeilen)
        </p>,
      )
    }

    return result
  }

  return <div className={cn("space-y-1 text-sm", className)}>{parseContent(content)}</div>
}
