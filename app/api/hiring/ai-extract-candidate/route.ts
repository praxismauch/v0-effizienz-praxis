import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { generateText } from "ai"

export const runtime = "nodejs"
export const maxDuration = 120

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const files = formData.getAll("files") as File[]
    const practiceId = formData.get("practiceId") as string

    if (files.length === 0) {
      return NextResponse.json({ error: "Keine Dateien hochgeladen" }, { status: 400 })
    }

    // Upload files to Vercel Blob and extract text
    const documentsData: any = {}
    const extractedTexts: string[] = []

    for (const file of files) {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString("base64")
        const mimeType = file.type || "application/octet-stream"

        const blob = await put(file.name, file, {
          access: "public",
          addRandomSuffix: true,
        })

        documentsData[file.name] = {
          url: blob.url,
          uploadedAt: new Date().toISOString(),
          size: file.size,
          type: file.type,
        }

        let fileText = ""

        if (file.type === "application/pdf") {
          // For PDFs, use the file type with data URL
          try {
            const dataUrl = `data:${mimeType};base64,${base64}`
            const visionResponse = await generateText({
              model: "anthropic/claude-sonnet-4-20250514",
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: `Extrahiere den gesamten lesbaren Text aus diesem PDF-Dokument. 
Es handelt sich um einen Lebenslauf oder Bewerbungsunterlagen.
Gib NUR den extrahierten Text zurück, keine Kommentare oder Erklärungen.
Wenn du persönliche Daten wie Name, Adresse, Telefon, E-Mail, Geburtsdatum, Berufserfahrung findest, achte besonders darauf diese korrekt zu extrahieren.`,
                    },
                    {
                      type: "file",
                      data: dataUrl,
                      mediaType: mimeType,
                    },
                  ],
                },
              ],
            })

            fileText = visionResponse.text
          } catch (visionError) {
            console.error("[v0] AI Extract: PDF extraction failed for", file.name, ":", visionError)
            fileText = `Dateiname: ${file.name}\nFehler: Konnte Text nicht aus dem PDF extrahieren.`
          }
        } else if (file.type.startsWith("image/")) {
          // For images, use the image type with base64 data URL
          try {
            const dataUrl = `data:${mimeType};base64,${base64}`
            const visionResponse = await generateText({
              model: "anthropic/claude-sonnet-4-20250514",
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: `Extrahiere den gesamten lesbaren Text aus diesem Bild. 
Es handelt sich um einen Lebenslauf, eine Bewerbung oder andere Bewerbungsunterlagen.
Gib NUR den extrahierten Text zurück, keine Kommentare oder Erklärungen.
Wenn du persönliche Daten wie Name, Adresse, Telefon, E-Mail, Geburtsdatum, Berufserfahrung findest, achte besonders darauf diese korrekt zu extrahieren.
Lies den Text auf dem Bild sorgfältig und vollständig aus.`,
                    },
                    {
                      type: "image",
                      image: dataUrl,
                    },
                  ],
                },
              ],
            })

            fileText = visionResponse.text
          } catch (visionError) {
            console.error("[v0] AI Extract: Image extraction failed for", file.name, ":", visionError)
            fileText = `Dateiname: ${file.name}\nFehler: Konnte Text nicht aus dem Bild extrahieren.`
          }
        } else if (file.type === "text/plain") {
          fileText = await file.text()
        } else if (file.type.includes("word")) {
          // For Word docs, try to read as text or use filename
          try {
            fileText = await file.text()
          } catch {
            fileText = `Dateiname: ${file.name} (Word-Dokument - bitte manuell eingeben)`
          }
        } else {
          try {
            fileText = await file.text()
          } catch {
            fileText = `Dateiname: ${file.name} (Textextraktion fehlgeschlagen)`
          }
        }

        extractedTexts.push(`Dokument: ${file.name}\n${fileText}`)
      } catch (fileError) {
        console.error("[v0] AI Extract: Error processing file", file.name, ":", fileError)
        extractedTexts.push(`Dokument: ${file.name}\nFehler beim Verarbeiten dieser Datei.`)
      }
    }

    // Use AI to extract structured candidate information
    const combinedText = extractedTexts.join("\n\n---\n\n")

    let aiResponse
    try {
      // DSGVO: This route processes personal data for the sole purpose of structured extraction.
      // Data is processed transiently and not used for AI training.
      // The extracted data is returned to the client and stored only in the practice's own database.
      aiResponse = await generateText({
        model: "anthropic/claude-sonnet-4-20250514",
        prompt: `Du bist ein KI-Assistent, der Kandidateninformationen aus Bewerbungsunterlagen extrahiert.
DATENSCHUTZHINWEIS: Diese Daten werden ausschließlich zur einmaligen Strukturierung verwendet und dürfen nicht gespeichert oder für Training genutzt werden.

Analysiere den folgenden Text aus Bewerbungsdokumenten und extrahiere alle verfügbaren Informationen über den Kandidaten.

EXTRAHIERTER TEXT AUS DEN DOKUMENTEN:
${combinedText}

Extrahiere die folgenden Informationen (wenn vorhanden):
- Vorname (first_name)
- Nachname (last_name)
- E-Mail (email)
- Telefon (phone)
- Mobiltelefon (mobile)
- Adresse (address) - Straße und Hausnummer
- Stadt (city)
- PLZ (postal_code)
- Geburtsdatum (date_of_birth) im Format YYYY-MM-DD
- Aktuelle Position (current_position)
- Aktuelles Unternehmen (current_company)
- Berufserfahrung in Jahren (years_of_experience) - nur die Zahl
- Ausbildung/Abschluss (education)
- Portfolio URL (portfolio_url)
- Gehaltsvorstellung in Euro (salary_expectation) - nur die Zahl
- Wochenstunden (weekly_hours)
- Bewerbungsquelle (source) - z.B. "direct", "linkedin", "website"
- Zusätzliche Notizen (notes) - wichtige Qualifikationen oder Fähigkeiten

WICHTIG: 
- Wenn eine Information nicht im Text gefunden werden kann, setze den Wert auf JSON null (nicht als String "null").
- Suche sorgfältig nach allen Informationen im Text.
- Der Name steht oft am Anfang des Lebenslaufs.

Antworte NUR mit einem JSON-Objekt (ohne Markdown-Formatierung, ohne \`\`\`):
{
  "first_name": "Vorname" oder null,
  "last_name": "Nachname" oder null,
  "email": "email@example.com" oder null,
  "phone": "+49..." oder null,
  "mobile": "+49..." oder null,
  "address": "Straße 123" oder null,
  "city": "Stadt" oder null,
  "postal_code": "12345" oder null,
  "date_of_birth": "1990-01-15" oder null,
  "current_position": "Position" oder null,
  "current_company": "Firma" oder null,
  "years_of_experience": "5" oder null,
  "education": "Abschluss" oder null,
  "portfolio_url": "https://..." oder null,
  "salary_expectation": "50000" oder null,
  "weekly_hours": "40" oder null,
  "source": "direct" oder null,
  "notes": "Zusätzliche Infos" oder null
}`,
      })
    } catch (aiError) {
      console.error("[v0] AI Extract: AI generation failed:", aiError)
      return NextResponse.json(
        {
          error: "KI-Analyse fehlgeschlagen",
          details: aiError instanceof Error ? aiError.message : String(aiError),
          documents: documentsData,
        },
        { status: 500 },
      )
    }

    const text = aiResponse.text

    // Parse AI response
    let extracted: any
    try {
      // Remove markdown code blocks if present
      const cleanedText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim()
      extracted = JSON.parse(cleanedText)

      for (const key of Object.keys(extracted)) {
        if (extracted[key] === "null" || extracted[key] === "NULL" || extracted[key] === "") {
          extracted[key] = null
        }
      }
    } catch (parseError) {
      console.error("[v0] AI Extract: Failed to parse AI response:", parseError)
      console.error("[v0] AI Extract: Raw response was:", text)
      extracted = {
        notes: "KI konnte die Informationen nicht automatisch extrahieren. Bitte manuell eingeben.",
      }
    }

    // Add documents to extracted data
    extracted.documents = documentsData

    return NextResponse.json(extracted)
  } catch (error) {
    console.error("[v0] AI Extract: Unexpected error:", error)
    return NextResponse.json(
      {
        error: "Fehler bei der KI-Extraktion",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
