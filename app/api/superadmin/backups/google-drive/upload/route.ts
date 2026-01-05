import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

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

async function uploadToGoogleDrive(accessToken: string, fileName: string, fileContent: string, folderId?: string) {
  // Create file metadata
  const metadata = {
    name: fileName,
    mimeType: "application/json",
    ...(folderId && { parents: [folderId] }),
  }

  // Upload file
  const form = new FormData()
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }))
  form.append("file", new Blob([fileContent], { type: "application/json" }))

  const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: form,
  })

  return response.json()
}

export async function POST(request: NextRequest) {
  try {
    const { backupId, practiceId } = await request.json()

    if (!backupId) {
      return NextResponse.json({ error: "Backup ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get backup data
    const { data: backup, error: backupError } = await supabase.from("backups").select("*").eq("id", backupId).single()

    if (backupError || !backup) {
      return NextResponse.json({ error: "Backup not found" }, { status: 404 })
    }

    // Get Google Drive credentials
    const { data: credentials, error: credError } = await supabase
      .from("google_drive_credentials")
      .select("*")
      .eq("practice_id", practiceId || "0")
      .maybeSingle()

    if (credError || !credentials) {
      return NextResponse.json({ error: "Google Drive not connected" }, { status: 404 })
    }

    // Check if token is expired
    let accessToken = credentials.access_token
    const tokenExpiry = new Date(credentials.token_expiry)

    if (tokenExpiry < new Date()) {
      // Refresh token
      const newTokens = await refreshAccessToken(credentials.refresh_token)
      accessToken = newTokens.access_token

      // Update stored credentials
      await supabase
        .from("google_drive_credentials")
        .update({
          access_token: newTokens.access_token,
          token_expiry: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("practice_id", practiceId || "0")
    }

    // Prepare backup file name and content
    const fileName = `backup_${backup.id}_${new Date().toISOString()}.json`
    const fileContent = JSON.stringify(backup.metadata || {}, null, 2)

    // Upload to Google Drive
    const uploadResult = await uploadToGoogleDrive(
      accessToken,
      fileName,
      fileContent,
      credentials.google_drive_folder_id,
    )

    if (!uploadResult.id) {
      throw new Error("Upload failed")
    }

    // Update backup record
    await supabase
      .from("backups")
      .update({
        google_drive_file_id: uploadResult.id,
        google_drive_synced_at: new Date().toISOString(),
      })
      .eq("id", backupId)

    return NextResponse.json({
      success: true,
      fileId: uploadResult.id,
      fileName: uploadResult.name,
    })
  } catch (error) {
    console.error("[v0] Google Drive upload error:", error)
    return NextResponse.json({ error: "Failed to upload to Google Drive" }, { status: 500 })
  }
}
