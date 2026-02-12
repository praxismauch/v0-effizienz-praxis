import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    console.log("[v0] Generate checklist - Starting")
    const supabase = await createServerClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("[v0] Generate checklist - User:", { hasUser: !!user, userId: user?.id })

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all active templates
    console.log("[v0] Generate checklist - Fetching templates")
    const { data: templates, error: templatesError } = await supabase
      .from("test_checklist_templates")
      .select("*")
      .eq("is_active", true)

    if (templatesError) {
      console.error("[v0] Generate checklist - Templates error:", templatesError)
      throw templatesError
    }

    console.log("[v0] Generate checklist - Found templates:", templates?.length || 0)

    // Return templates directly since we don't have a separate checklists table
    // The templates themselves serve as the checklist items
    console.log("[v0] Generate checklist - Returning templates as checklist")

    const result = {
      id: crypto.randomUUID(),
      title: `Test-Checkliste ${new Date().toLocaleDateString("de-DE")}`,
      description: `Generiert am ${new Date().toLocaleString("de-DE")}`,
      created_by: user.id,
      items: templates?.map((template) => ({
        template_id: template.id,
        category_id: template.category_id,
        title: template.title,
        description: template.description,
        display_order: template.display_order,
        completed: false,
      })) || [],
    }

    console.log("[v0] Generate checklist - Success, items:", result.items.length)
    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Error generating test checklist:", error)
    return NextResponse.json(
      { error: "Failed to generate test checklist", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
