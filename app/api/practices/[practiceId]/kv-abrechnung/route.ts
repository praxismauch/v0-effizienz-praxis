import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: NextRequest, context: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await context.params
    const practiceIdStr = String(practiceId)

    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from("kv_abrechnung")
      .select("*")
      .eq("practice_id", practiceIdStr)
      .order("year", { ascending: false })
      .order("quarter", { ascending: false })

    if (error) {
      console.error("KV API GET - Database error:", error)
      return NextResponse.json({ error: error.message || "Database error" }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("KV API GET - Error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await context.params
    const practiceIdStr = String(practiceId)

    const supabase = await createAdminClient()
    const body = await request.json()

    const createdBy = body.created_by || body.createdBy

    if (!createdBy) {
      return NextResponse.json({ error: "created_by is required" }, { status: 400 })
    }

    const { data: existingData, error: fetchError } = await supabase
      .from("kv_abrechnung")
      .select("*")
      .eq("practice_id", practiceIdStr)
      .eq("year", body.year)
      .eq("quarter", body.quarter)
      .maybeSingle()

    if (fetchError) {
      console.error("KV API POST - Error fetching existing:", fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    const newFile = {
      url: body.image_url || body.imageUrl || body.file_url || body.fileUrl,
      uploaded_at: new Date().toISOString(),
      file_name: body.file_name || body.fileName || "uploaded-file.pdf",
      file_size: body.file_size || body.fileSize || 0,
    }

    let data, error

    if (existingData) {
      const existingFiles = Array.isArray(existingData.files) ? existingData.files : []
      const updatedFiles = [...existingFiles, newFile]

      const result = await supabase
        .from("kv_abrechnung")
        .update({
          files: updatedFiles,
          image_url: body.image_url || body.imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", String(existingData.id))
        .select()
        .single()

      data = result.data
      error = result.error
    } else {
      const result = await supabase
        .from("kv_abrechnung")
        .insert({
          practice_id: practiceIdStr,
          year: body.year,
          quarter: body.quarter,
          image_url: body.image_url || body.imageUrl,
          files: [newFile],
          created_by: createdBy,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      data = result.data
      error = result.error
    }

    if (error) {
      console.error("KV API POST - Error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("KV API POST - Error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
