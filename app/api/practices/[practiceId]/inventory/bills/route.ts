import { NextResponse } from "next/server"
import { requirePracticeAccess, handleApiError } from "@/lib/api-helpers"

export async function GET(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const { adminClient } = await requirePracticeAccess(practiceId)

    const { searchParams } = new URL(request.url)
    const archived = searchParams.get("archived") === "true"

    const { data, error } = await adminClient
      .from("inventory_bills")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("is_archived", archived)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching inventory bills:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const { adminClient, user } = await requirePracticeAccess(practiceId)

    const body = await request.json()

    // Check for duplicate bills by file hash or file name + size
    const fileHash = body.file_hash
    if (fileHash) {
      const { data: existingByHash } = await adminClient
        .from("inventory_bills")
        .select("id, file_name, created_at, is_archived, status")
        .eq("practice_id", practiceId)
        .eq("file_hash", fileHash)
        .is("deleted_at", null)
        .maybeSingle()

      if (existingByHash) {
        return NextResponse.json({
          error: "duplicate",
          message: "Diese Rechnung wurde bereits hochgeladen",
          existing_bill: existingByHash,
        }, { status: 409 })
      }
    }

    // Also check by filename + size as fallback
    const { data: existingByMeta } = await adminClient
      .from("inventory_bills")
      .select("id, file_name, created_at, is_archived, status")
      .eq("practice_id", practiceId)
      .eq("file_name", body.file_name)
      .eq("file_size", body.file_size)
      .is("deleted_at", null)
      .maybeSingle()

    if (existingByMeta) {
      return NextResponse.json({
        error: "duplicate",
        message: "Eine Rechnung mit gleichem Namen und Größe existiert bereits",
        existing_bill: existingByMeta,
      }, { status: 409 })
    }

    const { data, error } = await adminClient
      .from("inventory_bills")
      .insert({
        practice_id: practiceId,
        file_name: body.file_name,
        file_url: body.file_url,
        file_type: body.file_type,
        file_size: body.file_size,
        file_hash: fileHash,
        uploaded_by: user.id,
        notes: body.notes,
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating inventory bill:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return handleApiError(error)
  }
}
