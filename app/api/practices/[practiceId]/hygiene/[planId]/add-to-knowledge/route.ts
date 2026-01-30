import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ practiceId: string; planId: string }> },
) {
  const { practiceId, planId } = await context.params
  const supabase = await createClient()

  try {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch the hygiene plan
    const { data: plan, error: planError } = await supabase
      .from("hygiene_plans")
      .select("*")
      .eq("id", planId)
      .eq("practice_id", practiceId)
      .single()

    if (planError || !plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    // Create knowledge base entry from hygiene plan
    const knowledgeContent = `# ${plan.title}

## Beschreibung
${plan.description || "Hygieneplan nach RKI-Richtlinien"}

## Typ und Bereich
- **Typ:** ${plan.plan_type}
- **Bereich:** ${plan.area}
- **Häufigkeit:** ${plan.frequency}
${plan.responsible_role ? `- **Verantwortlich:** ${plan.responsible_role}` : ""}

## Durchführung
${plan.procedure}

${plan.products_used && plan.products_used.length > 0 ? `## Verwendete Produkte
${plan.products_used.map((p: string) => `- ${p}`).join("\n")}` : ""}

${plan.rki_reference ? `## RKI-Referenz
${plan.rki_reference}` : ""}

## Dokumentation
${plan.documentation_required ? "Dokumentation erforderlich" : "Keine Dokumentation erforderlich"}

---
*Erstellt am: ${new Date(plan.created_at).toLocaleDateString("de-DE")}*
*Version: ${plan.version}*
`

    // Insert into knowledge base
    const { data: knowledgeEntry, error: knowledgeError } = await supabase
      .from("knowledge_base")
      .insert({
        practice_id: practiceId,
        title: `Hygieneplan: ${plan.title}`,
        content: knowledgeContent,
        category: "Hygiene",
        tags: [
          "Hygiene",
          "RKI",
          plan.plan_type,
          plan.area,
          "Compliance",
        ],
        created_by: user.id,
        is_public: false,
        status: "published",
      })
      .select()
      .single()

    if (knowledgeError) throw knowledgeError

    // Add a comment to the hygiene plan indicating it was added to knowledge base
    await supabase.from("hygiene_plan_comments").insert({
      plan_id: planId,
      user_id: user.id,
      comment: `Hygieneplan wurde zur Wissensdatenbank hinzugefügt (ID: ${knowledgeEntry.id})`,
      comment_type: "system",
    })

    return NextResponse.json({
      success: true,
      knowledge_entry: knowledgeEntry,
    })
  } catch (error: any) {
    console.error("Error adding to knowledge base:", error)
    return NextResponse.json(
      { error: "Failed to add to knowledge base", details: error.message },
      { status: 500 },
    )
  }
}
