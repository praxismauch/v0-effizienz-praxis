import { put, del } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Upload document for a candidate
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Upload to Vercel Blob with candidate-specific path
    const blob = await put(`candidates/${id}/${file.name}`, file, {
      access: "public",
    })

    // Get current documents from database
    const supabase = await createClient()
    const { data: candidate, error: fetchError } = await supabase
      .from("candidates")
      .select("documents")
      .eq("id", id)
      .single()

    if (fetchError) {
      console.error("[v0] Error fetching candidate:", fetchError)
      return NextResponse.json({ error: "Failed to fetch candidate" }, { status: 500 })
    }

    // Add new document to the array
    const documents = candidate?.documents || []
    const newDocument = {
      url: blob.url,
      name: file.name,
      filename: file.name, // Keep for backward compatibility
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
    }
    documents.push(newDocument)

    // Update candidate with new documents array
    const { error: updateError } = await supabase.from("candidates").update({ documents }).eq("id", id)

    if (updateError) {
      console.error("[v0] Error updating candidate documents:", updateError)
      // Try to delete the uploaded file if database update fails
      await del(blob.url).catch(console.error)
      return NextResponse.json({ error: "Failed to update candidate" }, { status: 500 })
    }

    return NextResponse.json(newDocument)
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}

// Delete document for a candidate
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 })
    }

    // Delete from Vercel Blob
    await del(url)

    // Remove document from database
    const supabase = await createClient()
    const { data: candidate, error: fetchError } = await supabase
      .from("candidates")
      .select("documents")
      .eq("id", id)
      .single()

    if (fetchError) {
      console.error("[v0] Error fetching candidate:", fetchError)
      return NextResponse.json({ error: "Failed to fetch candidate" }, { status: 500 })
    }

    // Filter out the deleted document
    const documents = (candidate?.documents || []).filter((doc: any) => doc.url !== url)

    // Update candidate with filtered documents array
    const { error: updateError } = await supabase.from("candidates").update({ documents }).eq("id", id)

    if (updateError) {
      console.error("[v0] Error updating candidate documents:", updateError)
      return NextResponse.json({ error: "Failed to update candidate" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete error:", error)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}
