import { type NextRequest, NextResponse } from "next/server"
import jsPDF from "jspdf"

// ── HTML → plain text helpers ───────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&auml;/g, "ae")
    .replace(/&ouml;/g, "oe")
    .replace(/&uuml;/g, "ue")
    .replace(/&Auml;/g, "Ae")
    .replace(/&Ouml;/g, "Oe")
    .replace(/&Uuml;/g, "Ue")
    .replace(/&szlig;/g, "ss")
    .replace(/\s+/g, " ")
    .trim()
}

interface ContentBlock {
  type: "heading" | "paragraph" | "list-item"
  text: string
  level?: number
  bold?: boolean
}

function parseHtmlToBlocks(html: string): ContentBlock[] {
  const blocks: ContentBlock[] = []
  if (!html || typeof html !== "string") return blocks

  // Extract headings
  const headingRegex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi
  let processedHtml = html

  // Collect headings with their positions
  const headings: { index: number; level: number; text: string }[] = []
  let match
  while ((match = headingRegex.exec(html)) !== null) {
    headings.push({ index: match.index, level: parseInt(match[1]), text: stripHtml(match[2]) })
  }

  // Collect list items
  const listRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi
  const listItems: { index: number; text: string }[] = []
  while ((match = listRegex.exec(html)) !== null) {
    listItems.push({ index: match.index, text: stripHtml(match[1]) })
  }

  // Remove all headings and list items, then split remaining by block tags
  processedHtml = processedHtml
    .replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi, "\n---HEADING_BREAK---\n")
    .replace(/<li[^>]*>[\s\S]*?<\/li>/gi, "\n---LIST_BREAK---\n")
    .replace(/<[uo]l[^>]*>/gi, "")
    .replace(/<\/[uo]l>/gi, "")

  // Split by block elements
  const rawBlocks = processedHtml
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p/gi, "</p>\n<p")
    .split(/(?:<\/?(?:p|div)(?:\s[^>]*)?>)/gi)
    .map((b) => b.trim())
    .filter((b) => b && b !== "---HEADING_BREAK---" && b !== "---LIST_BREAK---")

  // Interleave headings, list items, and paragraphs in order
  // Simple approach: process the entire HTML linearly
  const allBlocks = html
    .replace(/<br\s*\/?>/gi, "\n")
    .split(/(<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>|<li[^>]*>[\s\S]*?<\/li>|<\/?(?:p|div|ul|ol)(?:\s[^>]*)?>)/gi)
    .filter((s) => s && s.trim())

  for (const segment of allBlocks) {
    const trimmed = segment.trim()
    if (!trimmed) continue

    // Is it a heading?
    const hMatch = trimmed.match(/^<h([1-6])[^>]*>([\s\S]*?)<\/h\1>$/i)
    if (hMatch) {
      const text = stripHtml(hMatch[2])
      if (text) blocks.push({ type: "heading", text, level: parseInt(hMatch[1]) })
      continue
    }

    // Is it a list item?
    const liMatch = trimmed.match(/^<li[^>]*>([\s\S]*?)<\/li>$/i)
    if (liMatch) {
      const text = stripHtml(liMatch[1])
      if (text) blocks.push({ type: "list-item", text })
      continue
    }

    // Skip bare tags
    if (/^<\/?(?:p|div|ul|ol|br)(?:\s[^>]*)?>$/i.test(trimmed)) continue

    // Regular text content
    const text = stripHtml(trimmed)
    if (!text) continue

    // Check for markdown headings
    if (text.startsWith("### ")) {
      blocks.push({ type: "heading", text: text.substring(4), level: 3 })
    } else if (text.startsWith("## ")) {
      blocks.push({ type: "heading", text: text.substring(3), level: 2 })
    } else if (text.startsWith("# ")) {
      blocks.push({ type: "heading", text: text.substring(2), level: 1 })
    } else if (text.startsWith("- ") || text.startsWith("* ")) {
      blocks.push({ type: "list-item", text: text.substring(2) })
    } else {
      blocks.push({ type: "paragraph", text })
    }
  }

  // Fallback: if no blocks extracted, just strip all HTML
  if (blocks.length === 0) {
    const fallback = stripHtml(html)
    if (fallback) blocks.push({ type: "paragraph", text: fallback })
  }

  return blocks
}

// ── Colors ──────────────────────────────────────────────────────────

const BRAND_BLUE = [37, 99, 235] as const     // #2563EB
const BRAND_DARK = [30, 41, 59] as const       // #1E293B
const MED_GRAY = [148, 163, 184] as const      // #94A3B8
const LIGHT_GRAY = [241, 245, 249] as const    // #F1F5F9
const TEXT_COLOR = [51, 65, 85] as const        // #334155

// ── PDF Page helpers ────────────────────────────────────────────────

const PAGE_WIDTH = 210
const MARGIN_LEFT = 25
const MARGIN_RIGHT = 25
const MARGIN_TOP = 25
const MARGIN_BOTTOM = 25
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT
const MAX_Y = 297 - MARGIN_BOTTOM

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > MAX_Y) {
    doc.addPage()
    addPageHeader(doc)
    return MARGIN_TOP + 10
  }
  return y
}

function addPageHeader(doc: jsPDF) {
  doc.setDrawColor(...MED_GRAY)
  doc.setLineWidth(0.3)
  doc.line(MARGIN_LEFT, 15, PAGE_WIDTH - MARGIN_RIGHT, 15)
  doc.setFontSize(7)
  doc.setFont("helvetica", "italic")
  doc.setTextColor(...MED_GRAY)
  doc.text("Praxis Handbuch  |  Effizienz-Praxis", PAGE_WIDTH - MARGIN_RIGHT, 12, {
    align: "right",
  })
}

function addPageFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(...MED_GRAY)
    doc.setDrawColor(...LIGHT_GRAY)
    doc.setLineWidth(0.3)
    doc.line(MARGIN_LEFT, 287, PAGE_WIDTH - MARGIN_RIGHT, 287)
    doc.text(`Seite ${i} von ${pageCount}`, PAGE_WIDTH / 2, 292, { align: "center" })
  }
}

// ── Main Route ──────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { articles, categories } = await request.json()

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

    const dateStr = new Date().toLocaleDateString("de-DE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    // Group articles by category
    const groupedArticles = articles.reduce((acc: any, article: any) => {
      const category = article.category || "Ohne Kategorie"
      if (!acc[category]) acc[category] = []
      acc[category].push(article)
      return acc
    }, {})

    const sortedCategories = Object.keys(groupedArticles).sort((a, b) =>
      a.localeCompare(b, "de-DE")
    )

    // ── Title Page ──────────────────────────────────────────────────
    let y = 80

    // Blue accent bar at top
    doc.setFillColor(...BRAND_BLUE)
    doc.rect(0, 0, PAGE_WIDTH, 6, "F")

    // Title
    doc.setFontSize(32)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(...BRAND_BLUE)
    doc.text("PRAXIS", PAGE_WIDTH / 2, y, { align: "center" })
    y += 14
    doc.setTextColor(...BRAND_DARK)
    doc.text("HANDBUCH", PAGE_WIDTH / 2, y, { align: "center" })
    y += 12

    // Subtitle
    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(...MED_GRAY)
    doc.text("Qualitaetsmanagement-Dokumentation", PAGE_WIDTH / 2, y, {
      align: "center",
    })
    y += 15

    // Divider
    doc.setDrawColor(...BRAND_BLUE)
    doc.setLineWidth(0.8)
    doc.line(60, y, PAGE_WIDTH - 60, y)
    y += 12

    // Date
    doc.setFontSize(10)
    doc.text(dateStr, PAGE_WIDTH / 2, y, { align: "center" })
    y += 8

    // Stats
    doc.setFontSize(9)
    doc.text(
      `${articles.length} Artikel  |  ${sortedCategories.length} Kategorien`,
      PAGE_WIDTH / 2,
      y,
      { align: "center" }
    )

    // Bottom accent bar
    doc.setFillColor(...BRAND_BLUE)
    doc.rect(0, 291, PAGE_WIDTH, 6, "F")

    // ── Table of Contents ───────────────────────────────────────────
    doc.addPage()
    addPageHeader(doc)
    y = MARGIN_TOP + 8

    // TOC Header
    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(...BRAND_DARK)
    doc.text("Inhaltsverzeichnis", MARGIN_LEFT, y)
    y += 3
    doc.setDrawColor(...BRAND_BLUE)
    doc.setLineWidth(0.8)
    doc.line(MARGIN_LEFT, y, MARGIN_LEFT + 60, y)
    y += 10

    let tocIndex = 1
    sortedCategories.forEach((category) => {
      y = ensureSpace(doc, y, 12)
      const count = groupedArticles[category].length

      // Category number
      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(...BRAND_BLUE)
      doc.text(`${tocIndex}.`, MARGIN_LEFT, y)

      // Category name
      doc.setTextColor(...BRAND_DARK)
      doc.text(category, MARGIN_LEFT + 10, y)

      // Article count
      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(...MED_GRAY)
      doc.text(`${count} Artikel`, PAGE_WIDTH - MARGIN_RIGHT, y, { align: "right" })
      y += 6

      // List articles
      groupedArticles[category].forEach((article: any) => {
        y = ensureSpace(doc, y, 6)
        doc.setFontSize(8)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(100, 116, 139)
        const titleLines = doc.splitTextToSize(article.title, CONTENT_WIDTH - 15)
        doc.text(titleLines[0], MARGIN_LEFT + 12, y)
        y += 5
      })

      y += 4
      tocIndex++
    })

    // ── Articles ────────────────────────────────────────────────────
    let catIndex = 1
    sortedCategories.forEach((category) => {
      doc.addPage()
      addPageHeader(doc)
      y = MARGIN_TOP + 8

      // ── Category heading ──
      // Blue background bar
      doc.setFillColor(...BRAND_BLUE)
      doc.rect(MARGIN_LEFT, y - 5, CONTENT_WIDTH, 12, "F")

      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(255, 255, 255)
      doc.text(`${catIndex}. ${category}`, MARGIN_LEFT + 4, y + 3)
      y += 14

      // Article count
      doc.setFontSize(9)
      doc.setFont("helvetica", "italic")
      doc.setTextColor(...MED_GRAY)
      doc.text(
        `${groupedArticles[category].length} Artikel in dieser Kategorie`,
        MARGIN_LEFT,
        y
      )
      y += 10

      let artIndex = 1
      groupedArticles[category].forEach((article: any) => {
        y = ensureSpace(doc, y, 30)

        // ── Article Title ──
        doc.setFontSize(13)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(...BRAND_DARK)
        const titleLines = doc.splitTextToSize(
          `${catIndex}.${artIndex}  ${article.title}`,
          CONTENT_WIDTH
        )
        titleLines.forEach((line: string) => {
          y = ensureSpace(doc, y, 7)
          doc.text(line, MARGIN_LEFT, y)
          y += 6
        })

        // Underline
        y += 1
        doc.setDrawColor(226, 232, 240)
        doc.setLineWidth(0.4)
        doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y)
        y += 5

        // ── Metadata ──
        const metaParts: string[] = []
        if (article.version) metaParts.push(`Version ${article.version}`)
        if (article.updated_at)
          metaParts.push(new Date(article.updated_at).toLocaleDateString("de-DE"))
        if (article.status === "published") metaParts.push("Veroeffentlicht")

        doc.setFontSize(8)
        doc.setFont("helvetica", "italic")
        doc.setTextColor(...MED_GRAY)
        doc.text(metaParts.join("  |  "), MARGIN_LEFT, y)
        y += 7

        // ── Content blocks ──
        const contentBlocks = parseHtmlToBlocks(article.content)

        contentBlocks.forEach((block) => {
          switch (block.type) {
            case "heading": {
              y = ensureSpace(doc, y, 10)
              const fontSize = block.level === 1 ? 12 : block.level === 2 ? 11 : 10
              doc.setFontSize(fontSize)
              doc.setFont("helvetica", "bold")
              doc.setTextColor(...BRAND_DARK)
              const headingLines = doc.splitTextToSize(block.text, CONTENT_WIDTH)
              headingLines.forEach((line: string) => {
                y = ensureSpace(doc, y, 6)
                doc.text(line, MARGIN_LEFT, y)
                y += 5.5
              })
              y += 2
              break
            }
            case "list-item": {
              y = ensureSpace(doc, y, 6)
              doc.setFontSize(9.5)
              doc.setFont("helvetica", "normal")
              doc.setTextColor(...TEXT_COLOR)

              // Bullet
              doc.setFillColor(...BRAND_BLUE)
              doc.circle(MARGIN_LEFT + 2, y - 1, 0.8, "F")

              const itemLines = doc.splitTextToSize(block.text, CONTENT_WIDTH - 10)
              itemLines.forEach((line: string, i: number) => {
                y = ensureSpace(doc, y, 5)
                doc.text(line, MARGIN_LEFT + 6, y)
                y += 4.5
              })
              y += 1
              break
            }
            case "paragraph":
            default: {
              y = ensureSpace(doc, y, 6)
              doc.setFontSize(9.5)
              doc.setFont("helvetica", "normal")
              doc.setTextColor(...TEXT_COLOR)
              const paraLines = doc.splitTextToSize(block.text, CONTENT_WIDTH)
              paraLines.forEach((line: string) => {
                y = ensureSpace(doc, y, 5)
                doc.text(line, MARGIN_LEFT, y)
                y += 4.5
              })
              y += 3
              break
            }
          }
        })

        // ── Tags ──
        if (article.tags && article.tags.length > 0) {
          y = ensureSpace(doc, y, 10)
          y += 2
          doc.setDrawColor(226, 232, 240)
          doc.setLineWidth(0.3)
          doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y)
          y += 5
          doc.setFontSize(7.5)
          doc.setFont("helvetica", "italic")
          doc.setTextColor(...MED_GRAY)
          doc.text(`Schlagwoerter: ${article.tags.join(", ")}`, MARGIN_LEFT, y)
          y += 8
        }

        y += 5
        artIndex++
      })

      catIndex++
    })

    // ── Add page footers ────────────────────────────────────────────
    addPageFooter(doc)

    // Generate buffer
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"))

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Praxis-Handbuch-${new Date().toISOString().split("T")[0]}.pdf"`,
      },
    })
  } catch (error) {
    console.error("[v0] PDF Export error:", error)
    return NextResponse.json(
      { error: "PDF-Export fehlgeschlagen" },
      { status: 500 }
    )
  }
}
