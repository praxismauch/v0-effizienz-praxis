import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: templates, error } = await supabase
      .from("survey_templates")
      .select("*")
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("is_system_template", { ascending: false })
      .order("name")

    if (error) {
      console.error("Error fetching templates:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ templates: templates || [] })
  } catch (error) {
    console.error("Error in GET /api/survey-templates:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
