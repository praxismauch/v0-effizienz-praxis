import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: templates, error } = await supabase.from("org_chart_templates").select("*").order("name")

    if (error) {
      console.error("Error fetching org chart templates:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(templates || [])
  } catch (error) {
    console.error("Error in GET org-chart-templates:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
