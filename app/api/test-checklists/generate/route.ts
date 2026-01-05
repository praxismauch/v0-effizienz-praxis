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

    // Create checklist
    console.log("[v0] Generate checklist - Creating checklist")
    const { data: checklist, error: checklistError } = await supabase
      .from("test_checklists")
      .insert({
        title: `Test-Checkliste ${new Date().toLocaleDateString("de-DE")}`,
        description: `Generiert am ${new Date().toLocaleString("de-DE")}`,
        created_by: user.id,
      })
      .select()
      .single()

    if (checklistError) {
      console.error("[v0] Generate checklist - Checklist error:", checklistError)
      throw checklistError
    }

    console.log("[v0] Generate checklist - Checklist created:", checklist.id)

    // Create checklist items from templates
    if (templates && templates.length > 0) {
      console.log("[v0] Generate checklist - Creating items from templates")
      const items = templates.map((template) => ({
        checklist_id: checklist.id,
        template_id: template.id,
        category_id: template.category_id,
        title: template.title,
        description: template.description,
        display_order: template.display_order,
      }))

      const { error: itemsError } = await supabase.from("test_checklist_items").insert(items)

      if (itemsError) {
        console.error("[v0] Generate checklist - Items error:", itemsError)
        throw itemsError
      }

      console.log("[v0] Generate checklist - Items created:", items.length)
    } else {
      console.log("[v0] Generate checklist - No templates found, creating empty checklist")
    }

    console.log("[v0] Generate checklist - Success")
    return NextResponse.json(checklist)
  } catch (error) {
    console.error("[v0] Error generating test checklist:", error)
    return NextResponse.json(
      { error: "Failed to generate test checklist", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
