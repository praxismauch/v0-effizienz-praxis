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

    const { data, error } = await adminClient
      .from("inventory_bills")
      .insert({
        practice_id: practiceId,
        file_name: body.file_name,
        file_url: body.file_url,
        file_type: body.file_type,
        file_size: body.file_size,
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
