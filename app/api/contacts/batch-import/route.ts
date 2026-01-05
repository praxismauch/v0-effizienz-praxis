import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const practice_id = formData.get("practice_id") as string
    const created_by = formData.get("created_by") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Read the file content
    const text = await file.text()

    // Parse CSV (simple implementation - can be enhanced with a library)
    const lines = text.split("\n")
    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))

    const contacts = []
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue

      const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))
      const contact: any = {
        practice_id,
        created_by,
      }

      headers.forEach((header, index) => {
        // Map CSV headers to database columns
        const columnMap: any = {
          Anrede: "salutation",
          Titel: "title",
          Vorname: "first_name",
          Nachname: "last_name",
          Firma: "company",
          Position: "position",
          "E-Mail": "email",
          Telefon: "phone",
          Mobil: "mobile",
          Fax: "fax",
          Website: "website",
          Straße: "street",
          Hausnummer: "house_number",
          PLZ: "postal_code",
          Stadt: "city",
          Land: "country",
          Kategorie: "category",
          Notizen: "notes",
        }

        const dbColumn = columnMap[header] || header.toLowerCase()
        contact[dbColumn] = values[index] || null
      })

      if (contact.last_name) {
        contacts.push(contact)
      }
    }

    // Insert all contacts
    const supabase = await createAdminClient()
    const { data, error } = await supabase.from("contacts").insert(contacts).select()

    if (error) throw error

    return NextResponse.json({
      success: true,
      imported: data.length,
    })
  } catch (error: any) {
    console.error("Batch import error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
