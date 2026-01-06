import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Validate the upload - only allow images for logos
        const allowedExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"]
        const extension = pathname.toLowerCase().substring(pathname.lastIndexOf("."))

        if (pathname.includes("/logo") && !allowedExtensions.includes(extension)) {
          throw new Error("Invalid file type for logo")
        }

        return {
          allowedContentTypes: [
            "image/png",
            "image/jpeg",
            "image/gif",
            "image/webp",
            "image/svg+xml",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          ],
          tokenPayload: JSON.stringify({
            userId: user.id,
          }),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // This is called after the upload is complete
        // You can use this to update your database
        console.log("Upload completed:", blob.url)
        try {
          const payload = JSON.parse(tokenPayload || "{}")
          console.log("Upload by user:", payload.userId)
        } catch {
          // Ignore payload parsing errors
        }
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error("Error handling upload:", error)
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}
