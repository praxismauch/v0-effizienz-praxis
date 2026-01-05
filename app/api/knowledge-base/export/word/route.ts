import { type NextRequest, NextResponse } from "next/server"
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from "docx"

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

    const sortedCategories = Object.keys(groupedArticles).sort((a, b) => a.localeCompare(b, "de-DE"))

    // Build document sections
    const sections: any[] = []

    // Title page
    sections.push(
      new Paragraph({
        text: "Praxis Handbuch",
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      new Paragraph({
        text: "Qualitätsmanagement-Dokumentation",
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        text: `Erstellt am: ${new Date().toLocaleDateString("de-DE", { year: "numeric", month: "long", day: "numeric" })}`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      new Paragraph({
        text: `Artikel: ${articles.length} • Kategorien: ${categories.length}`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
    )

    // Table of Contents
    sections.push(
      new Paragraph({
        text: "Inhaltsverzeichnis",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
        pageBreakBefore: true,
      }),
    )

    sortedCategories.forEach((category) => {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${category} (${groupedArticles[category].length} Artikel)`,
            }),
          ],
          bullet: { level: 0 },
          spacing: { after: 100 },
        }),
      )
    })

    // Articles by category
    sortedCategories.forEach((category) => {
      const categoryData = categories.find((cat: any) => cat.name === category)

      sections.push(
        new Paragraph({
          text: category,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
          pageBreakBefore: true,
          border: {
            bottom: {
              color: categoryData?.color?.replace("#", "") || "94a3b8",
              space: 1,
              style: BorderStyle.SINGLE,
              size: 12,
            },
          },
        }),
      )

      groupedArticles[category].forEach((article: any) => {
        // Article title
        sections.push(
          new Paragraph({
            text: article.title,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 100 },
          }),
        )

        // Metadata
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Version ${article.version} • Zuletzt aktualisiert: ${new Date(article.updated_at).toLocaleDateString("de-DE")}`,
                italics: true,
                size: 18,
              }),
            ],
            spacing: { after: 200 },
          }),
        )

        // Content - split by paragraphs
        const contentLines = article.content.split("\n").filter((line: string) => line.trim())

        contentLines.forEach((line: string) => {
          const trimmedLine = line.trim()

          // Check for headers
          if (trimmedLine.startsWith("### ")) {
            sections.push(
              new Paragraph({
                text: trimmedLine.substring(4),
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 200, after: 100 },
              }),
            )
          } else if (trimmedLine.startsWith("## ")) {
            sections.push(
              new Paragraph({
                text: trimmedLine.substring(3),
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 200, after: 100 },
              }),
            )
          } else if (trimmedLine.startsWith("# ")) {
            sections.push(
              new Paragraph({
                text: trimmedLine.substring(2),
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 200, after: 100 },
              }),
            )
          } else if (trimmedLine.startsWith("• ") || trimmedLine.startsWith("- ")) {
            // Bullet point
            sections.push(
              new Paragraph({
                text: trimmedLine.substring(2),
                bullet: { level: 0 },
                spacing: { after: 100 },
              }),
            )
          } else {
            // Regular paragraph with bold support
            const parts = trimmedLine.split(/(\*\*.*?\*\*)/)
            const textRuns = parts.map((part) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return new TextRun({
                  text: part.substring(2, part.length - 2),
                  bold: true,
                })
              }
              return new TextRun({ text: part })
            })

            sections.push(
              new Paragraph({
                children: textRuns,
                spacing: { after: 150 },
              }),
            )
          }
        })

        // Tags
        if (article.tags.length > 0) {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `Schlagwörter: ${article.tags.join(", ")}`,
                  italics: true,
                  size: 18,
                }),
              ],
              spacing: { before: 200, after: 300 },
            }),
          )
        }
      })
    })

    // Create document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: sections,
        },
      ],
    })

    // Generate Word document buffer
    const buffer = await Packer.toBuffer(doc)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="Praxis-Handbuch-${new Date().toISOString().split("T")[0]}.docx"`,
      },
    })
  } catch (error) {
    console.error("[v0] Word Export error:", error)
    return NextResponse.json({ error: "Word-Export fehlgeschlagen" }, { status: 500 })
  }
}
