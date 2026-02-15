import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@/lib/supabase/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ practiceId: string }> }
) {
  const { practiceId } = await params
  const supabase = await createRouteHandlerClient()

  const { data, error } = await supabase
    .from("knowledge_base_settings")
    .select("*")
    .eq("practice_id", practiceId)
    .single()

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Return defaults if no settings exist
  const settings = data || {
    practice_id: practiceId,
    require_review_before_publish: false,
    auto_versioning: true,
    default_category: "general",
    allowed_categories: ["general", "protocol", "guideline", "template", "faq", "training"],
    max_versions_to_keep: 10,
    require_change_summary: true,
    notify_on_publish: false,
    notify_on_update: false,
  }

  return NextResponse.json(settings)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ practiceId: string }> }
) {
  const { practiceId } = await params
  const supabase = await createRouteHandlerClient()
  const body = await request.json()

  const settingsData = {
    practice_id: practiceId,
    require_review_before_publish: body.require_review_before_publish ?? false,
    auto_versioning: body.auto_versioning ?? true,
    default_category: body.default_category || "general",
    allowed_categories: body.allowed_categories || ["general"],
    max_versions_to_keep: body.max_versions_to_keep ?? 10,
    require_change_summary: body.require_change_summary ?? true,
    notify_on_publish: body.notify_on_publish ?? false,
    notify_on_update: body.notify_on_update ?? false,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from("knowledge_base_settings")
    .upsert(settingsData, { onConflict: "practice_id" })
    .select()
    .single()

  if (error) {
    console.error("Error saving knowledge settings:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
