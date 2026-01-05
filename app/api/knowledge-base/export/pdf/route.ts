import { type NextRequest, NextResponse } from "next/server"
import jsPDF from "jspdf"

export async function POST(request: NextRequest) {
  try {
    const { articles, categories } = await request.json()

    // Create PDF document
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    // Set fonts
    doc.setFont("helvetica")

    let yPosition = 20

    // Title page
    doc.setFontSize(24)
    doc.setFont("helvetica", "bold")
    doc.text("Praxis Handbuch", 20, yPosition)

    yPosition += 10
    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    doc.text("Qualitätsmanagement-Dokumentation", 20, yPosition)

    yPosition += 10
    doc.setFontSize(10)
    doc.text(
      `Erstellt am: ${new Date().toLocaleDateString("de-DE", { year: "numeric", month: "long", day: "numeric" })}`,
      20,
      yPosition,
    )

    yPosition += 15

    // Statistics
    doc.setFontSize(10)
    doc.text(`Artikel: ${articles.length}`, 20, yPosition)
    yPosition += 6
    doc.text(`Kategorien: ${categories.length}`, 20, yPosition)

    // Group articles by category
    const groupedArticles = articles.reduce((acc: any, article: any) => {
      const category = article.category || "Ohne Kategorie"
      if (!acc[category]) acc[category] = []
      acc[category].push(article)
      return acc
    }, {})

    const sortedCategories = Object.keys(groupedArticles).sort((a, b) => a.localeCompare(b, "de-DE"))

    // Table of Contents
    doc.addPage()
    yPosition = 20
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text("Inhaltsverzeichnis", 20, yPosition)
    yPosition += 10

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    sortedCategories.forEach((category) => {
      if (yPosition > 270) {
        doc.addPage()
        yPosition = 20
      }
      doc.text(`• ${category} (${groupedArticles[category].length} Artikel)`, 20, yPosition)
      yPosition += 6
    })

    // Articles content
    sortedCategories.forEach((category) => {
      doc.addPage()
      yPosition = 20

      // Category header
      doc.setFontSize(18)
      doc.setFont("helvetica", "bold")
      doc.text(category, 20, yPosition)
      yPosition += 10

      groupedArticles[category].forEach((article: any) => {
        // Check if we need a new page
        if (yPosition > 250) {
          doc.addPage()
          yPosition = 20
        }

        // Article title
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        const titleLines = doc.splitTextToSize(article.title, 170)
        doc.text(titleLines, 20, yPosition)
        yPosition += titleLines.length * 6

        // Version and date
        doc.setFontSize(8)
        doc.setFont("helvetica", "italic")
        doc.text(
          `Version ${article.version} • ${new Date(article.updated_at).toLocaleDateString("de-DE")}`,
          20,
          yPosition,
        )
        yPosition += 8

        // Content
        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        const cleanContent = article.content.replace(/[#*]/g, "").replace(/\n\n/g, "\n").trim()
        const contentLines = doc.splitTextToSize(cleanContent, 170)

        contentLines.forEach((line: string) => {
          if (yPosition > 270) {
            doc.addPage()
            yPosition = 20
          }
          doc.text(line, 20, yPosition)
          yPosition += 5
        })

        yPosition += 10
      })
    })

    // Generate PDF buffer
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
    return NextResponse.json({ error: "PDF-Export fehlgeschlagen" }, { status: 500 })
  }
}
