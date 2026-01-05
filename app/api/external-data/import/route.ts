import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"

async function refreshAccessToken(refreshToken: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      grant_type: "refresh_token",
    }),
  })

  return response.json()
}

export async function POST(req: NextRequest) {
  try {
    const { practiceId, source, folderId, includeSubfolders } = await req.json()

    const supabase = await createClient()

    // Get Google Drive credentials
    const { data: credentials } = await supabase
      .from("google_drive_credentials")
      .select("*")
      .eq("practice_id", practiceId)
      .single()

    if (!credentials) {
      return NextResponse.json({ error: "Not connected to Google Drive" }, { status: 400 })
    }

    let accessToken = credentials.access_token

    // Check if token is expired and refresh if needed
    if (credentials.token_expiry && new Date(credentials.token_expiry) < new Date()) {
      const refreshed = await refreshAccessToken(credentials.refresh_token)
      accessToken = refreshed.access_token

      // Update stored token
      await supabase
        .from("google_drive_credentials")
        .update({
          access_token: refreshed.access_token,
          token_expiry: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("practice_id", practiceId)
    }

    // List files in folder using Drive API
    const filesResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and trashed=false&fields=files(id,name,mimeType,size,createdTime)&pageSize=100`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )

    const filesData = await filesResponse.json()
    const files = filesData.files || []
    let filesProcessed = 0

    // Process each file with AI categorization
    for (const file of files) {
      try {
        // Download file metadata/preview
        const fileMetadata = {
          name: file.name,
          type: file.mimeType,
          size: file.size,
        }

        // Use AI to categorize the file
        const { text: aiResponse } = await generateText({
          model: "openai/gpt-4o-mini",
          prompt: `Categorize this file and determine which system section it belongs to:
          
File name: ${file.name}
File type: ${file.mimeType}

Available categories:
- kv-abrechnung: KV billing documents, quarterly reports
- documents: General practice documents, policies, procedures
- protocols: Medical protocols, treatment guidelines
- team: HR documents, contracts, employee files
- other: Anything that doesn't fit above categories

Available target sections:
- KV Abrechnung: For billing documents
- Dokumente: For general documents
- Protokolle: For medical protocols
- Team: For HR/employee files
- Archiv: For other files

Respond with JSON:
{
  "category": "category-name",
  "targetSection": "target-section-name",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}`,
          temperature: 0.3,
        })

        const categorization = JSON.parse(aiResponse)

        // Create import record
        const { error: importError } = await supabase.from("imported_files").insert({
          practice_id: practiceId,
          file_name: file.name,
          file_type: file.mimeType || "unknown",
          file_size: Number.parseInt(file.size || "0"),
          source: "google-drive",
          source_file_id: file.id,
          category: categorization.category,
          target_section: categorization.targetSection,
          ai_confidence: categorization.confidence,
          ai_reasoning: categorization.reasoning,
          status: "completed",
          created_at: new Date().toISOString(),
        })

        if (!importError) {
          filesProcessed++
        }
      } catch (fileError) {
        console.error(`[v0] Failed to process file ${file.name}:`, fileError)

        // Log failed import
        await supabase.from("imported_files").insert({
          practice_id: practiceId,
          file_name: file.name,
          file_type: file.mimeType || "unknown",
          file_size: Number.parseInt(file.size || "0"),
          source: "google-drive",
          source_file_id: file.id,
          status: "failed",
          error_message: fileError instanceof Error ? fileError.message : "Unknown error",
          created_at: new Date().toISOString(),
        })
      }
    }

    return NextResponse.json({
      success: true,
      filesProcessed,
      totalFiles: files.length,
    })
  } catch (error) {
    console.error("[v0] Import error:", error)
    return NextResponse.json({ error: "Failed to import files" }, { status: 500 })
  }
}
