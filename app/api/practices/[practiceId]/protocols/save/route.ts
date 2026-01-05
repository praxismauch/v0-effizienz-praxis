import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const { protocol, title, duration } = await req.json()

    const supabase = await createServerClient()

    // Get the Protokolle folder
    const { data: folder, error: folderError } = await supabase
      .from("document_folders")
      .select("id")
      .eq("practice_id", practiceId)
      .eq("name", "Protokolle")
      .single()

    if (folderError || !folder) {
      return NextResponse.json({ error: "Protokolle folder not found" }, { status: 404 })
    }

    // Create a text document with the protocol content
    const fileName = `${title}.md`
    const { error: docError } = await supabase.from("documents").insert({
      practice_id: practiceId,
      folder_id: folder.id,
      name: fileName,
      type: "text/markdown",
      size: new Blob([protocol]).size,
      content: protocol,
      metadata: {
        duration,
        createdAt: new Date().toISOString(),
      },
    })

    if (docError) {
      console.error("[v0] Error saving protocol:", docError)
      return NextResponse.json({ error: "Failed to save protocol" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Save protocol error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
