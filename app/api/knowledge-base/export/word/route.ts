import { type NextRequest, NextResponse } from "next/server"
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  TabStopPosition,
  TabStopType,
  PageBreak,
  Header,
  Footer,
  ImageRun,
  Tab,
} from "docx"

// ── HTML → docx helpers ─────────────────────────────────────────────

/** Strip all HTML tags and decode common entities */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&auml;/g, "ä")
    .replace(/&ouml;/g, "ö")
    .replace(/&uuml;/g, "ü")
    .replace(/&Auml;/g, "Ä")
    .replace(/&Ouml;/g, "Ö")
    .replace(/&Uuml;/g, "Ü")
    .replace(/&szlig;/g, "ß")
    .replace(/\s+/g, " ")
    .trim()
}

/** Parse inline HTML into TextRun[] with bold/italic support */
function parseInlineHtml(html: string): TextRun[] {
  const runs: TextRun[] = []

  // Normalise whitespace between tags
  let cleaned = html.replace(/\s+/g, " ")

  // Split on <strong>, <b>, <em>, <i> keeping delimiters
  const tokens = cleaned.split(/(<\/?(?:strong|b|em|i)>)/i)

  let bold = false
  let italic = false

  for (const token of tokens) {
    const lower = token.toLowerCase()
    if (lower === "<strong>" || lower === "<b>") {
      bold = true
      continue
    }
    if (lower === "</strong>" || lower === "</b>") {
      bold = false
      continue
    }
    if (lower === "<em>" || lower === "<i>") {
      italic = true
      continue
    }
    if (lower === "</em>" || lower === "</i>") {
      italic = false
      continue
    }

    // Strip any remaining tags
    const text = stripHtml(token)
    if (!text) continue

    runs.push(
      new TextRun({
        text,
        bold,
        italics: italic,
        font: "Calibri",
        size: 22, // 11pt
      })
    )
  }

  return runs.length > 0 ? runs : [new TextRun({ text: " ", font: "Calibri", size: 22 })]
}

/** Parse HTML content string into Paragraph[] */
function htmlToParagraphs(html: string): Paragraph[] {
  const paragraphs: Paragraph[] = []

  if (!html || typeof html !== "string") return paragraphs

  // Split by block elements
  const blocks = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "</p>\n<p>")
    .replace(/<\/li>/gi, "</li>\n")
    .split(/(?:<\/?(?:p|div|br|h[1-6])(?:\s[^>]*)?>)/gi)
    .map((b) => b.trim())
    .filter(Boolean)

  // Also try splitting by newlines if no HTML blocks found
  let processedBlocks = blocks
  if (processedBlocks.length <= 1 && html.includes("\n")) {
    processedBlocks = html.split("\n").map((b) => b.trim()).filter(Boolean)
  }

  // Check for heading tags in the original HTML
  const headingRegex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi
  let match
  const headingsMap = new Map<string, number>()
  while ((match = headingRegex.exec(html)) !== null) {
    const level = parseInt(match[1])
    const text = stripHtml(match[2])
    headingsMap.set(text, level)
  }

  // Check for list items
  const listItemRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi
  const listItems = new Set<string>()
  while ((match = listItemRegex.exec(html)) !== null) {
    listItems.add(stripHtml(match[1]))
  }

  for (const block of processedBlocks) {
    const text = stripHtml(block)
    if (!text) continue

    // Check if this was a heading
    const headingLevel = headingsMap.get(text)
    if (headingLevel) {
      const docxHeading =
        headingLevel === 1
          ? HeadingLevel.HEADING_2
          : headingLevel === 2
            ? HeadingLevel.HEADING_3
            : HeadingLevel.HEADING_4

      paragraphs.push(
        new Paragraph({
          text,
          heading: docxHeading,
          spacing: { before: 240, after: 120 },
        })
      )
      continue
    }

    // Check if this was a list item
    if (listItems.has(text)) {
      paragraphs.push(
        new Paragraph({
          children: parseInlineHtml(block),
          bullet: { level: 0 },
          spacing: { after: 60 },
        })
      )
      continue
    }

    // Check for markdown-style headings (fallback)
    if (text.startsWith("### ")) {
      paragraphs.push(
        new Paragraph({
          text: text.substring(4),
          heading: HeadingLevel.HEADING_4,
          spacing: { before: 200, after: 100 },
        })
      )
      continue
    }
    if (text.startsWith("## ")) {
      paragraphs.push(
        new Paragraph({
          text: text.substring(3),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
        })
      )
      continue
    }
    if (text.startsWith("# ")) {
      paragraphs.push(
        new Paragraph({
          text: text.substring(2),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      )
      continue
    }

    // Markdown bullet
    if (text.startsWith("- ") || text.startsWith("* ")) {
      paragraphs.push(
        new Paragraph({
          children: parseInlineHtml(block.substring(2)),
          bullet: { level: 0 },
          spacing: { after: 60 },
        })
      )
      continue
    }

    // Regular paragraph
    paragraphs.push(
      new Paragraph({
        children: parseInlineHtml(block),
        spacing: { after: 120, line: 276 },
      })
    )
  }

  return paragraphs
}

// ── Colors ──────────────────────────────────────────────────────────

const BRAND_BLUE = "2563EB"
const BRAND_DARK = "1E293B"
const LIGHT_GRAY = "F1F5F9"
const MED_GRAY = "94A3B8"

// ── Main Route ──────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { articles, categories } = await request.json()

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

    const dateStr = new Date().toLocaleDateString("de-DE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    // ── Build sections ──────────────────────────────────────────────

    const children: Paragraph[] = []

    // ── Title Page ──────────────────────────────────────────────────
    children.push(
      new Paragraph({ spacing: { before: 2400 } }), // top margin
      new Paragraph({
        children: [
          new TextRun({
            text: "PRAXIS",
            font: "Calibri",
            size: 72, // 36pt
            bold: true,
            color: BRAND_BLUE,
          }),
          new TextRun({
            text: " HANDBUCH",
            font: "Calibri",
            size: 72,
            bold: true,
            color: BRAND_DARK,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "Qualitätsmanagement-Dokumentation",
            font: "Calibri",
            size: 28, // 14pt
            color: MED_GRAY,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
      // Divider line
      new Paragraph({
        border: {
          bottom: { color: BRAND_BLUE, space: 1, style: BorderStyle.SINGLE, size: 6 },
        },
        spacing: { before: 200, after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: dateStr,
            font: "Calibri",
            size: 22,
            color: MED_GRAY,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `${articles.length} Artikel`,
            font: "Calibri",
            size: 22,
            color: MED_GRAY,
          }),
          new TextRun({
            text: "  |  ",
            font: "Calibri",
            size: 22,
            color: MED_GRAY,
          }),
          new TextRun({
            text: `${sortedCategories.length} Kategorien`,
            font: "Calibri",
            size: 22,
            color: MED_GRAY,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
    )

    // ── Table of Contents ───────────────────────────────────────────
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "INHALTSVERZEICHNIS",
            font: "Calibri",
            size: 32, // 16pt
            bold: true,
            color: BRAND_DARK,
          }),
        ],
        spacing: { before: 400, after: 300 },
        pageBreakBefore: true,
        border: {
          bottom: { color: BRAND_BLUE, space: 4, style: BorderStyle.SINGLE, size: 6 },
        },
      })
    )

    let tocIndex = 1
    sortedCategories.forEach((category) => {
      const count = groupedArticles[category].length

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${tocIndex}. `,
              font: "Calibri",
              size: 24,
              bold: true,
              color: BRAND_BLUE,
            }),
            new TextRun({
              text: category,
              font: "Calibri",
              size: 24,
              bold: true,
              color: BRAND_DARK,
            }),
            new TextRun({
              text: `   (${count} ${count === 1 ? "Artikel" : "Artikel"})`,
              font: "Calibri",
              size: 20,
              color: MED_GRAY,
            }),
          ],
          spacing: { after: 80 },
        })
      )

      // List article titles under each TOC category
      groupedArticles[category].forEach((article: any) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `     ${article.title}`,
                font: "Calibri",
                size: 20,
                color: "64748B",
              }),
            ],
            spacing: { after: 40 },
          })
        )
      })

      children.push(new Paragraph({ spacing: { after: 100 } }))
      tocIndex++
    })

    // ── Articles by Category ────────────────────────────────────────
    let catIndex = 1
    sortedCategories.forEach((category) => {
      const categoryData = categories.find((cat: any) => cat.name === category)
      const catColor = categoryData?.color?.replace("#", "") || BRAND_BLUE

      // Category heading with page break
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${catIndex}. ${category}`,
              font: "Calibri",
              size: 36, // 18pt
              bold: true,
              color: BRAND_DARK,
            }),
          ],
          spacing: { before: 200, after: 100 },
          pageBreakBefore: true,
          border: {
            bottom: { color: catColor, space: 4, style: BorderStyle.SINGLE, size: 12 },
          },
        })
      )

      // Category article count
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${groupedArticles[category].length} Artikel in dieser Kategorie`,
              font: "Calibri",
              size: 20,
              italics: true,
              color: MED_GRAY,
            }),
          ],
          spacing: { after: 300 },
        })
      )

      let artIndex = 1
      groupedArticles[category].forEach((article: any) => {
        // ── Article Title ──
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${catIndex}.${artIndex}  ${article.title}`,
                font: "Calibri",
                size: 28, // 14pt
                bold: true,
                color: BRAND_DARK,
              }),
            ],
            spacing: { before: 400, after: 60 },
            border: {
              bottom: { color: "E2E8F0", space: 2, style: BorderStyle.SINGLE, size: 4 },
            },
          })
        )

        // ── Metadata line ──
        const metaParts: string[] = []
        if (article.version) metaParts.push(`Version ${article.version}`)
        if (article.updated_at)
          metaParts.push(new Date(article.updated_at).toLocaleDateString("de-DE"))
        if (article.status === "published") metaParts.push("Veröffentlicht")

        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: metaParts.join("  |  "),
                font: "Calibri",
                size: 18, // 9pt
                italics: true,
                color: MED_GRAY,
              }),
            ],
            spacing: { after: 200 },
          })
        )

        // ── Content ──
        const contentParagraphs = htmlToParagraphs(article.content)
        children.push(...contentParagraphs)

        // ── Tags ──
        if (article.tags && article.tags.length > 0) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "Schlagwörter: ",
                  font: "Calibri",
                  size: 18,
                  bold: true,
                  color: MED_GRAY,
                }),
                new TextRun({
                  text: article.tags.join(", "),
                  font: "Calibri",
                  size: 18,
                  italics: true,
                  color: MED_GRAY,
                }),
              ],
              spacing: { before: 200, after: 300 },
              border: {
                top: { color: "E2E8F0", space: 4, style: BorderStyle.SINGLE, size: 2 },
              },
            })
          )
        }

        artIndex++
      })

      catIndex++
    })

    // ── Footer note ─────────────────────────────────────────────────
    children.push(
      new Paragraph({ spacing: { before: 400 } }),
      new Paragraph({
        border: {
          top: { color: BRAND_BLUE, space: 4, style: BorderStyle.SINGLE, size: 6 },
        },
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Dieses Dokument wurde automatisch am ${dateStr} erstellt.`,
            font: "Calibri",
            size: 18,
            color: MED_GRAY,
            italics: true,
          }),
        ],
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "Erstellt mit Effizienz-Praxis",
            font: "Calibri",
            size: 18,
            color: BRAND_BLUE,
            italics: true,
          }),
        ],
        alignment: AlignmentType.CENTER,
      })
    )

    // ── Create Document ─────────────────────────────────────────────
    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: "Calibri",
              size: 22,
              color: BRAND_DARK,
            },
          },
        },
      },
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440,    // 1 inch
                right: 1440,
                bottom: 1440,
                left: 1440,
              },
            },
          },
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Praxis Handbuch",
                      font: "Calibri",
                      size: 16,
                      color: MED_GRAY,
                      italics: true,
                    }),
                  ],
                  alignment: AlignmentType.RIGHT,
                  border: {
                    bottom: {
                      color: "E2E8F0",
                      space: 4,
                      style: BorderStyle.SINGLE,
                      size: 2,
                    },
                  },
                }),
              ],
            }),
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Effizienz-Praxis",
                      font: "Calibri",
                      size: 16,
                      color: MED_GRAY,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                  border: {
                    top: {
                      color: "E2E8F0",
                      space: 4,
                      style: BorderStyle.SINGLE,
                      size: 2,
                    },
                  },
                }),
              ],
            }),
          },
          children,
        },
      ],
    })

    const buffer = await Packer.toBuffer(doc)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="Praxis-Handbuch-${new Date().toISOString().split("T")[0]}.docx"`,
      },
    })
  } catch (error) {
    console.error("[v0] Word Export error:", error)
    return NextResponse.json(
      { error: "Word-Export fehlgeschlagen" },
      { status: 500 }
    )
  }
}
