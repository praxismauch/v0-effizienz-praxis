import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import jsPDF from "jspdf"

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createServerClient()
    const { report } = await request.json()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!report) {
      return NextResponse.json({ error: "Report data required" }, { status: 400 })
    }

    // Create PDF document
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    doc.setFont("helvetica")

    let yPosition = 20

    // Header
    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.text("Zeiterfassungs-Report", 20, yPosition)

    yPosition += 10
    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    const months = [
      "Januar",
      "Februar",
      "März",
      "April",
      "Mai",
      "Juni",
      "Juli",
      "August",
      "September",
      "Oktober",
      "November",
      "Dezember",
    ]
    doc.text(`${months[report.month - 1]} ${report.year}`, 20, yPosition)

    yPosition += 10
    doc.setFontSize(10)
    doc.text(
      `Mitarbeiter: ${report.team_members?.first_name || ""} ${report.team_members?.last_name || ""}`,
      20,
      yPosition,
    )

    yPosition += 6
    doc.text(
      `Erstellt am: ${new Date(report.generated_at).toLocaleDateString("de-DE", { year: "numeric", month: "long", day: "numeric" })}`,
      20,
      yPosition,
    )

    yPosition += 15

    // Summary Statistics
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("Zusammenfassung", 20, yPosition)
    yPosition += 8

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")

    const formatMinutes = (minutes: number) => {
      const h = Math.floor(Math.abs(minutes) / 60)
      const m = Math.abs(minutes) % 60
      const sign = minutes < 0 ? "-" : ""
      return `${sign}${h}h ${m}min`
    }

    const stats = [
      { label: "Arbeitstage:", value: report.total_work_days.toString() },
      { label: "Gesamte Arbeitszeit:", value: formatMinutes(report.total_net_minutes) },
      { label: "Pausen:", value: formatMinutes(report.total_break_minutes) },
      { label: "Überstunden:", value: formatMinutes(report.overtime_minutes) },
      { label: "Homeoffice-Tage:", value: report.homeoffice_days.toString() },
      { label: "Plausibilitätswarnungen:", value: report.plausibility_warnings.toString() },
    ]

    stats.forEach(({ label, value }) => {
      doc.text(label, 20, yPosition)
      doc.text(value, 100, yPosition)
      yPosition += 6
    })

    yPosition += 10

    // Daily Breakdown Table
    if (report.report_data?.daily_breakdown?.length > 0) {
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("Tägliche Aufschlüsselung", 20, yPosition)
      yPosition += 8

      // Table Header
      doc.setFontSize(8)
      doc.setFont("helvetica", "bold")
      doc.text("Datum", 20, yPosition)
      doc.text("Start", 50, yPosition)
      doc.text("Ende", 70, yPosition)
      doc.text("Pause", 90, yPosition)
      doc.text("Netto", 110, yPosition)
      doc.text("Ort", 135, yPosition)
      yPosition += 5

      // Draw line
      doc.line(20, yPosition, 190, yPosition)
      yPosition += 4

      // Table Rows
      doc.setFont("helvetica", "normal")
      report.report_data.daily_breakdown.forEach((day: any) => {
        if (yPosition > 270) {
          doc.addPage()
          yPosition = 20
        }

        const dateObj = new Date(day.date)
        const dateStr = dateObj.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })

        doc.text(dateStr, 20, yPosition)

        if (day.start_time) {
          const startTime = new Date(day.start_time)
          doc.text(startTime.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }), 50, yPosition)
        } else {
          doc.text("-", 50, yPosition)
        }

        if (day.end_time) {
          const endTime = new Date(day.end_time)
          doc.text(endTime.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }), 70, yPosition)
        } else {
          doc.text("-", 70, yPosition)
        }

        doc.text(`${day.break_minutes}min`, 90, yPosition)
        doc.text(formatMinutes(day.net_minutes), 110, yPosition)
        doc.text(day.work_location === "homeoffice" ? "HO" : "Praxis", 135, yPosition)

        yPosition += 5
      })
    }

    // Footer
    const totalPages = doc.internal.pages.length - 1
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setFont("helvetica", "italic")
      doc.text(`Seite ${i} von ${totalPages}`, 105, 285, { align: "center" })
    }

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"))

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Zeiterfassung-${report.year}-${String(report.month).padStart(2, "0")}-${report.team_members?.last_name || "Report"}.pdf"`,
      },
    })
  } catch (error) {
    console.error("PDF Export error:", error)
    return NextResponse.json({ error: "PDF-Export fehlgeschlagen" }, { status: 500 })
  }
}
