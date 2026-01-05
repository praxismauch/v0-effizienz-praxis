"use client"

import type { JSX } from "react"
import { CheckCircle2, AlertCircle, ArrowRight, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { sanitizeAIContent, safeFormatInline } from "@/lib/sanitize"

interface FormattedAIContentProps {
  content: string
  className?: string
  showCard?: boolean
}

export function FormattedAIContent({ content, className, showCard = true }: FormattedAIContentProps) {
  if (!content) return null

  const parseContent = (text: string): JSX.Element[] => {
    const sanitizedText = sanitizeAIContent(text)
    const lines = sanitizedText.split("\n")
    const elements: JSX.Element[] = []
    let currentList: string[] = []
    let listType: "ul" | "ol" | null = null
    let key = 0

    const flushList = () => {
      if (currentList.length > 0 && listType) {
        const ListTag = listType
        elements.push(
          <ListTag
            key={`list-${key++}`}
            className={cn("space-y-2.5 my-4", listType === "ol" ? "list-decimal pl-6" : "list-disc pl-6")}
          >
            {currentList.map((item, i) => (
              <li
                key={i}
                className="leading-relaxed text-foreground/90 pl-2 marker:text-primary/70"
                dangerouslySetInnerHTML={{ __html: safeFormatInline(item) }}
              />
            ))}
          </ListTag>,
        )
        currentList = []
        listType = null
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      if (!line) {
        flushList()
        continue
      }

      // H1 Headers with icon
      if (line.startsWith("# ")) {
        flushList()
        elements.push(
          <h1
            key={`h1-${key++}`}
            className="flex items-center gap-3 text-2xl font-bold mb-6 mt-8 first:mt-0 text-foreground"
          >
            <span>{line.slice(2)}</span>
          </h1>,
        )
        continue
      }

      // H2 Headers with border
      if (line.startsWith("## ")) {
        flushList()
        elements.push(
          <h2 key={`h2-${key++}`} className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-border text-foreground">
            {line.slice(3)}
          </h2>,
        )
        continue
      }

      // H3 Headers with numbered badge if pattern matches
      if (line.startsWith("### ")) {
        flushList()
        const headerContent = line.slice(4)
        const numberMatch = headerContent.match(/^(\d+)\.\s+(.+)/)

        if (numberMatch) {
          elements.push(
            <h3 key={`h3-${key++}`} className="text-lg font-semibold mt-6 mb-3 flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary text-sm font-bold flex-shrink-0">
                {numberMatch[1]}
              </span>
              <span>{numberMatch[2]}</span>
            </h3>,
          )
        } else {
          elements.push(
            <h3 key={`h3-${key++}`} className="text-lg font-semibold mt-6 mb-3 text-foreground">
              {headerContent}
            </h3>,
          )
        }
        continue
      }

      // Unordered list
      if (line.match(/^[-*]\s/)) {
        if (listType !== "ul") {
          flushList()
          listType = "ul"
        }
        currentList.push(line.slice(2))
        continue
      }

      // Ordered list
      if (line.match(/^\d+\.\s/)) {
        if (listType !== "ol") {
          flushList()
          listType = "ol"
        }
        currentList.push(line.replace(/^\d+\.\s/, ""))
        continue
      }

      // Horizontal rule
      if (line === "---" || line === "***") {
        flushList()
        elements.push(<hr key={`hr-${key++}`} className="my-6 border-border/50" />)
        continue
      }

      // Blockquote
      if (line.startsWith("> ")) {
        flushList()
        elements.push(
          <blockquote
            key={`quote-${key++}`}
            className="border-l-4 border-primary/30 pl-4 py-2 my-4 italic text-muted-foreground bg-muted/30 rounded-r"
          >
            {line.slice(2)}
          </blockquote>,
        )
        continue
      }

      // Special callouts
      if (line.startsWith("✓ ") || line.startsWith("✅ ")) {
        flushList()
        elements.push(
          <div
            key={`success-${key++}`}
            className="flex items-start gap-3 p-3 my-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg"
          >
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm leading-relaxed text-green-900 dark:text-green-100">{line.slice(2)}</p>
          </div>,
        )
        continue
      }

      if (line.startsWith("⚠ ") || line.startsWith("⚠️ ")) {
        flushList()
        elements.push(
          <div
            key={`warning-${key++}`}
            className="flex items-start gap-3 p-3 my-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg"
          >
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm leading-relaxed text-yellow-900 dark:text-yellow-100">{line.slice(2)}</p>
          </div>,
        )
        continue
      }

      if (line.startsWith("→ ")) {
        flushList()
        elements.push(
          <div
            key={`action-${key++}`}
            className="flex items-start gap-3 p-3 my-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg"
          >
            <ArrowRight className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm leading-relaxed text-blue-900 dark:text-blue-100">{line.slice(2)}</p>
          </div>,
        )
        continue
      }

      if (line.startsWith("📈 ") || line.startsWith("🎯 ")) {
        flushList()
        elements.push(
          <div
            key={`insight-${key++}`}
            className="flex items-start gap-3 p-3 my-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 rounded-lg"
          >
            <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm leading-relaxed text-purple-900 dark:text-purple-100">{line.slice(2)}</p>
          </div>,
        )
        continue
      }

      // Regular paragraph - use safe formatting
      flushList()
      elements.push(
        <p
          key={`p-${key++}`}
          className="leading-relaxed text-foreground/90 mb-4"
          dangerouslySetInnerHTML={{ __html: safeFormatInline(line) }}
        />,
      )
    }

    flushList()
    return elements
  }

  const parsedContent = parseContent(content)

  if (showCard) {
    return (
      <div className={cn("prose prose-sm max-w-none dark:prose-invert", className)}>
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="p-6 space-y-1">{parsedContent}</div>
        </div>
      </div>
    )
  }

  return <div className={cn("space-y-1 max-w-none", className)}>{parsedContent}</div>
}

export default FormattedAIContent
