import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = await createServerClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's practice_id from userprofiles
    const { data: profile } = await supabase
      .from("userprofiles")
      .select("practice_id")
      .eq("id", user.id)
      .single()

    const practiceId = profile?.practice_id

    // Get all active templates
    const { data: templates, error: templatesError } = await supabase
      .from("test_checklist_templates")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })

    if (templatesError) throw templatesError

    if (!templates || templates.length === 0) {
      return NextResponse.json(
        { error: "Keine aktiven Vorlagen gefunden. Bitte erstellen Sie zuerst Vorlagen." },
        { status: 400 },
      )
    }

    // 1. Create the checklist record in test_checklists
    const { data: checklist, error: checklistError } = await supabase
      .from("test_checklists")
      .insert({
        title: `Test-Checkliste ${new Date().toLocaleDateString("de-DE")}`,
        description: `Generiert am ${new Date().toLocaleString("de-DE")} mit ${templates.length} Vorlagen`,
        status: "open",
        total_items: templates.length,
        completed_items: 0,
        progress: 0,
        created_by: user.id,
        practice_id: practiceId,
      })
      .select()
      .single()

    if (checklistError) throw checklistError

    // 2. Create checklist items from templates
    const itemsToInsert = templates.map((template, index) => ({
      checklist_id: checklist.id,
      template_id: template.id,
      category_id: template.category_id,
      title: template.title,
      description: template.description,
      display_order: template.display_order ?? index,
      completed: false,
    }))

    const { error: itemsError } = await supabase
      .from("test_checklist_items")
      .insert(itemsToInsert)

    if (itemsError) {
      // Rollback: delete the checklist if items failed
      await supabase.from("test_checklists").delete().eq("id", checklist.id)
      throw itemsError
    }

    return NextResponse.json(checklist)
  } catch (error) {
    console.error("[v0] Error generating test checklist:", error)
    return NextResponse.json(
      { error: "Failed to generate test checklist", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
