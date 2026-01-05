import { type NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { practiceId: string } }) {
  const { practiceId } = params

  try {
    const supabase = await createServerClient()

    // Fetch template usage for this practice
    const { data: usedTemplates, error } = await supabase
      .from("parameter_template_usage")
      .select("*")
      .eq("practice_id", practiceId)

    if (error) {
      console.error("Error fetching template usage:", error)
      throw error
    }

    return NextResponse.json({ usedTemplates: usedTemplates || [] })
  } catch (error) {
    console.error("Error in template-usage route:", error)
    return NextResponse.json({ error: "Failed to fetch template usage" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { practiceId: string } }) {
  const { practiceId } = params

  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get("templateId")

    if (!templateId) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Delete template usage tracking
    const { error } = await supabase
      .from("parameter_template_usage")
      .delete()
      .eq("practice_id", practiceId)
      .eq("template_id", templateId)

    if (error) {
      console.error("Error deleting template usage:", error)
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in template-usage DELETE route:", error)
    return NextResponse.json({ error: "Failed to delete template usage" }, { status: 500 })
  }
}
