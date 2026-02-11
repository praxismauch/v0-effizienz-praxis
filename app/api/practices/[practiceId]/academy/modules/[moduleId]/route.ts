import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

let _supabase: ReturnType<typeof createClient> | null = null
function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error("Supabase not configured")
    _supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  }
  return _supabase
}
const supabase = new Proxy({} as ReturnType<typeof createClient>, { get: (_, prop) => (getSupabase() as any)[prop] })

interface ModuleUpdateData {
  updated_at: string
  title?: string
  description?: string
  display_order?: number
  order_index?: number
  is_published?: boolean
  estimated_minutes?: number
  duration_minutes?: number
  xp_reward?: number
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; moduleId: string }> },
) {
  try {
    const { moduleId } = await params

    const { data, error } = await supabase
      .from("academy_modules")
      .select("*")
      .eq("id", moduleId)
      .is("deleted_at", null)
      .single()

    if (error) {
      console.error("Error fetching module:", error)
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json({ module: data })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("Unexpected error in GET module:", errorMessage)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; moduleId: string }> },
) {
  try {
    const { moduleId } = await params

    const body = await request.json()

    const updateData: ModuleUpdateData = {
      updated_at: new Date().toISOString(),
    }

    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.display_order !== undefined) {
      updateData.display_order = body.display_order
      updateData.order_index = body.display_order
    }
    if (body.is_published !== undefined) updateData.is_published = body.is_published
    if (body.estimated_minutes !== undefined) {
      updateData.estimated_minutes = body.estimated_minutes
      updateData.duration_minutes = body.estimated_minutes
    }
    if (body.xp_reward !== undefined) updateData.xp_reward = body.xp_reward

    const { data, error } = await supabase
      .from("academy_modules")
      .update(updateData)
      .eq("id", moduleId)
      .is("deleted_at", null)
      .select()
      .single()

    if (error) {
      console.error("Error updating module:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ module: data })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("Unexpected error in PUT module:", errorMessage)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; moduleId: string }> },
) {
  try {
    const { moduleId } = await params

    const { data, error } = await supabase
      .from("academy_modules")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", moduleId)
      .select()
      .single()

    if (error) {
      console.error("Error deleting module:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, module: data })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("Unexpected error in DELETE module:", errorMessage)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
