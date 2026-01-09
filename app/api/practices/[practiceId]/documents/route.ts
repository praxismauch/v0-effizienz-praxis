import { requirePracticeAccess, handleApiError } from "@/lib/api-helpers"
import { type NextRequest, NextResponse } from "next/server"
import { isRateLimitError } from "@/lib/supabase/safe-query"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    const practiceIdInt = Number.parseInt(practiceId, 10)

    const { adminClient: supabase } = await requirePracticeAccess(practiceId)

    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get("folderId")
    const getAllDocuments = searchParams.get("all") === "true"

    let data: any[] = []
    try {
      let query = supabase
        .from("documents")
        .select("*")
        .eq("practice_id", practiceIdInt)
        .eq("is_archived", false)
        .order("created_at", { ascending: false })

      if (!getAllDocuments) {
        if (folderId) {
          query = query.eq("folder_id", folderId)
        } else {
          query = query.is("folder_id", null)
        }
      }

      const result = await query

      if (result.error) {
        if (isRateLimitError(result.error)) {
          return NextResponse.json([])
        }
        console.warn("[v0] Documents GET Supabase error:", result.error.message)
        return NextResponse.json([])
      }

      data = result.data || []
    } catch (queryError: any) {
      if (isRateLimitError(queryError)) {
        return NextResponse.json([])
      }
      console.warn("[v0] Documents query exception:", queryError?.message)
      return NextResponse.json([])
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    const practiceIdInt = Number.parseInt(practiceId, 10)

    const { adminClient: supabase } = await requirePracticeAccess(practiceId)

    const body = await request.json()

    const createdBy = body.created_by || body.createdBy

    try {
      const { data, error } = await supabase
        .from("documents")
        .insert({
          practice_id: practiceIdInt,
          name: body.name,
          description: body.description,
          file_url: body.file_url || body.fileUrl,
          file_type: body.file_type || body.fileType,
          file_size: body.file_size || body.fileSize,
          folder_id: body.folder_id || body.folderId,
          created_by: createdBy,
          tags: body.tags || [],
          ai_analysis: body.ai_analysis || body.aiAnalysis || null,
        })
        .select()
        .single()

      if (error) {
        console.error("[v0] Error creating document:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(data)
    } catch (queryError: any) {
      if (isRateLimitError(queryError)) {
        return NextResponse.json({ error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut." }, { status: 429 })
      }
      throw queryError
    }
  } catch (error: any) {
    return handleApiError(error)
  }
}
