import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { practiceId: string } }) {
  const supabase = await createServerClient()
  const { searchParams } = new URL(request.url)
  const documentId = searchParams.get("documentId")
  const folderId = searchParams.get("folderId")

  let query = supabase.from("document_permissions").select(`
      *,
      user:users(id, name, email),
      team:teams(id, name)
    `)

  if (documentId) {
    query = query.eq("document_id", documentId)
  } else if (folderId) {
    query = query.eq("folder_id", folderId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest, { params }: { params: { practiceId: string } }) {
  const supabase = await createServerClient()
  const body = await request.json()

  const { data, error } = await supabase
    .from("document_permissions")
    .insert({
      document_id: body.document_id,
      folder_id: body.folder_id,
      user_id: body.user_id,
      team_id: body.team_id,
      permission_level: body.permission_level,
      granted_by: body.granted_by,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest, { params }: { params: { practiceId: string } }) {
  const supabase = await createServerClient()
  const { searchParams } = new URL(request.url)
  const permissionId = searchParams.get("permissionId")

  if (!permissionId) {
    return NextResponse.json({ error: "Permission ID required" }, { status: 400 })
  }

  const { error } = await supabase.from("document_permissions").delete().eq("id", permissionId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
