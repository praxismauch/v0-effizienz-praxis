import { put } from "@vercel/blob"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(request: Request, { params }: { params: { practiceId: string } }) {
  try {
    const { practiceId } = params
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return Response.json({ error: "File size exceeds 10MB limit" }, { status: 400 })
    }

    // Upload to Vercel Blob
    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    })

    // Get current user
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    return Response.json({
      success: true,
      url: blob.url,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      practiceId,
      uploadedBy: user.id,
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return Response.json({ error: "Failed to upload file" }, { status: 500 })
  }
}
