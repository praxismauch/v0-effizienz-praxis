import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import crypto from "crypto"

function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

function parseGermanDate(dateStr: string): string | null {
  const cleaned = dateStr.trim().replace(/['"]/g, "")

  const dotMatch = cleaned.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/)
  if (dotMatch) {
    let [, day, month, year] = dotMatch
    if (year.length === 2) {
      year = Number.parseInt(year) > 50 ? `19${year}` : `20${year}`
    }
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
  }

  const slashMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (slashMatch) {
    let [, day, month, year] = slashMatch
    if (year.length === 2) {
      year = Number.parseInt(year) > 50 ? `19${year}` : `20${year}`
    }
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
  }

  return null
}

function parseGermanAmount(amountStr: string): number {
  const cleaned = amountStr
    .trim()
    .replace(/['"EUR€\s]/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".")

  return Number.parseFloat(cleaned) || 0
}

export async function POST(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    if (!practiceId) {
      console.error("Bank CSV Upload - Missing practice ID")
      return NextResponse.json(
        { error: "Practice ID fehlt" },
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    const supabase = await createAdminClient()
    const formData = await request.formData()
    const file = formData.get("file") as File
    const mappingStr = formData.get("mapping") as string

    if (!file) {
      return NextResponse.json(
        { error: "Keine Datei hochgeladen" },
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    if (!mappingStr) {
      return NextResponse.json(
        { error: "Spaltenzuordnung fehlt" },
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    let mapping
    try {
      mapping = JSON.parse(mappingStr)
    } catch (e) {
      console.error("Bank CSV Upload - Invalid mapping JSON:", e)
      return NextResponse.json(
        { error: "Ungültige Spaltenzuordnung" },
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    let text
    try {
      text = await file.text()
    } catch (e) {
      console.error("Bank CSV Upload - Error reading file:", e)
      return NextResponse.json(
        { error: "Datei konnte nicht gelesen werden" },
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    const lines = text.split(/\r\n|\n/).filter((line) => line.trim() !== "")

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV-Datei ist leer oder ungültig" },
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    const delimiter = lines[0].includes(";") ? ";" : ","
    const dataRows = lines.slice(1)

    const { error: tableCheckError } = await supabase.from("bank_transactions").select("id").limit(1)

    if (tableCheckError) {
      console.error("Bank CSV Upload - Table check error:", tableCheckError)
      return NextResponse.json(
        {
          error: "Die Tabelle 'bank_transactions' existiert nicht",
          details: tableCheckError.message,
          suggestion: "Bitte führen Sie zuerst das SQL-Script 'create-bank-transactions-table.sql' aus.",
        },
        { status: 500, headers: { "Content-Type": "application/json" } },
      )
    }

    let newCount = 0
    let skippedCount = 0
    const errors: string[] = []

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i]
      const cells = parseCSVLine(row, delimiter)

      const requiredMaxIndex = Math.max(
        mapping.dateIndex,
        mapping.amountIndex,
        mapping.senderIndex,
        mapping.descriptionIndex,
        mapping.categoryIndex !== undefined ? mapping.categoryIndex : -1,
      )

      if (cells.length <= requiredMaxIndex) {
        errors.push(`Zeile ${i + 1}: Zu wenige Spalten`)
        continue
      }

      try {
        const dateStr = parseGermanDate(cells[mapping.dateIndex])
        if (!dateStr) {
          errors.push(`Zeile ${i + 1}: Ungültiges Datum: ${cells[mapping.dateIndex]}`)
          continue
        }

        const amount = parseGermanAmount(cells[mapping.amountIndex])
        if (isNaN(amount)) {
          errors.push(`Zeile ${i + 1}: Ungültiger Betrag: ${cells[mapping.amountIndex]}`)
          continue
        }

        const sender = cells[mapping.senderIndex] || "Unbekannt"
        const description = cells[mapping.descriptionIndex] || ""
        const category =
          mapping.categoryIndex !== undefined && cells[mapping.categoryIndex]
            ? cells[mapping.categoryIndex].trim()
            : null

        const contentString = `${practiceId}|${dateStr}|${amount.toFixed(2)}|${sender}|${description}`
        const hash = crypto.createHash("md5").update(contentString).digest("hex")

        const { error } = await supabase.from("bank_transactions").insert({
          practice_id: practiceId,
          transaction_date: dateStr,
          amount: amount,
          sender_receiver: sender.substring(0, 255),
          description: description.substring(0, 1000),
          category: category,
          transaction_hash: hash,
          currency: "EUR",
          raw_data: { imported_row: cells },
        })

        if (error) {
          if (error.code === "23505") {
            skippedCount++
          } else {
            console.error(`Bank CSV Upload - Row ${i + 1}: Insert error:`, error)
            errors.push(`Zeile ${i + 1}: ${error.message}`)
          }
        } else {
          newCount++
        }
      } catch (e) {
        console.error(`Bank CSV Upload - Row ${i + 1}: Parse error:`, e)
        errors.push(`Zeile ${i + 1}: ${e instanceof Error ? e.message : String(e)}`)
      }
    }

    return NextResponse.json(
      {
        success: true,
        total: dataRows.length,
        new: newCount,
        skipped: skippedCount,
        errors: errors.slice(0, 10),
      },
      { headers: { "Content-Type": "application/json" } },
    )
  } catch (error) {
    console.error("Bank CSV Upload - Fatal error:", error)

    return NextResponse.json(
      {
        error: "Fehler beim Verarbeiten der CSV-Datei",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
