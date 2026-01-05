import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { isRateLimitError } from "@/lib/supabase/safe-query"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    let supabase
    try {
      supabase = await createAdminClient()
    } catch (clientError) {
      if (isRateLimitError(clientError)) {
        return NextResponse.json([])
      }
      throw clientError
    }

    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get("parentId")

    let query = supabase
      .from("document_folders")
      .select("*")
      .eq("practice_id", practiceId)
      .order("created_at", { ascending: false })

    if (parentId) {
      query = query.eq("parent_folder_id", parentId)
    } else {
      query = query.is("parent_folder_id", null)
    }

    const { data, error } = await query

    if (error) {
      if (isRateLimitError(error)) {
        return NextResponse.json([])
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    if (isRateLimitError(error)) {
      return NextResponse.json([])
    }
    console.error("Error in GET /document-folders:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    const supabase = await createAdminClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("document_folders")
      .insert({
        practice_id: practiceId,
        name: body.name,
        description: body.description,
        parent_folder_id: body.parent_folder_id || body.parentFolderId || null,
        color: body.color,
        created_by: body.created_by || body.createdBy,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Supabase error creating folder:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: adminUsers, error: adminError } = await supabase
      .from("users")
      .select("id")
      .eq("practice_id", practiceId)
      .in("role", ["admin", "superadmin"])

    if (adminError) {
      console.error("[v0] Error fetching admin users:", adminError)
    } else if (adminUsers && adminUsers.length > 0) {
      const permissions = adminUsers.map((admin) => ({
        folder_id: data.id,
        user_id: admin.id,
        permission_level: "admin",
        granted_by: body.created_by || body.createdBy,
        granted_at: new Date().toISOString(),
      }))

      const { error: permError } = await supabase.from("document_permissions").insert(permissions)

      if (permError) {
        console.error("[v0] Error granting admin permissions:", permError)
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Unexpected error in POST /document-folders:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
