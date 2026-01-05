import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createAdminClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's practice
    const { data: userData } = await supabase.from("users").select("practice_id").eq("id", user.id).maybeSingle()

    if (!userData?.practice_id) {
      return NextResponse.json({ error: "No practice found" }, { status: 404 })
    }

    const practiceId = userData.practice_id

    // Get practice settings to see which content types should be auto-generated
    const { data: settings } = await supabase
      .from("practice_settings")
      .select("system_settings")
      .eq("practice_id", practiceId)
      .single()

    const handbookConfig = settings?.system_settings?.handbook_auto_content || {}

    const generatedArticles = []

    // Generate Calendar article
    if (handbookConfig.calendar) {
      const { data: events } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("practice_id", practiceId)
        .gte("start_date", new Date().toISOString().split("T")[0])
        .order("start_date", { ascending: true })
        .limit(20)

      const content = `# Kalender-Übersicht

## Anstehende Termine

${
  events
    ?.map(
      (event) => `
### ${event.title}
- **Datum**: ${new Date(event.start_date).toLocaleDateString("de-DE")}
- **Uhrzeit**: ${event.start_time || "Ganztägig"}
- **Typ**: ${event.type}
${event.description ? `- **Beschreibung**: ${event.description}` : ""}
${event.location ? `- **Ort**: ${event.location}` : ""}
`,
    )
    .join("\n") || "Keine anstehenden Termine"
}

---
*Automatisch generiert am ${new Date().toLocaleDateString("de-DE")}*`

      generatedArticles.push({
        title: "📅 Kalender-Übersicht",
        content,
        category: "Automatisch generiert",
        status: "published",
      })
    }

    // Generate Goals article
    if (handbookConfig.goals) {
      const { data: goals } = await supabase
        .from("goals")
        .select("*")
        .eq("practice_id", practiceId)
        .eq("status", "active")
        .order("priority", { ascending: false })

      const content = `# Praxisziele

## Aktive Ziele

${
  goals
    ?.map(
      (goal) => `
### ${goal.title}
- **Priorität**: ${goal.priority}
- **Status**: ${goal.status}
- **Fortschritt**: ${goal.progress_percentage}%
- **Zielwert**: ${goal.target_value} ${goal.unit || ""}
- **Aktueller Wert**: ${goal.current_value} ${goal.unit || ""}
- **Zeitraum**: ${new Date(goal.start_date).toLocaleDateString("de-DE")} bis ${new Date(goal.end_date).toLocaleDateString("de-DE")}

${goal.description || ""}
`,
    )
    .join("\n") || "Keine aktiven Ziele"
}

---
*Automatisch generiert am ${new Date().toLocaleDateString("de-DE")}*`

      generatedArticles.push({
        title: "🎯 Praxisziele",
        content,
        category: "Automatisch generiert",
        status: "published",
      })
    }

    // Generate Workflow Templates article
    if (handbookConfig.workflowTemplates) {
      const { data: workflows } = await supabase
        .from("workflow_templates")
        .select("*")
        .eq("is_active", true)
        .order("name")

      const content = `# Workflow-Vorlagen

## Verfügbare Vorlagen

${
  workflows
    ?.map(
      (workflow) => `
### ${workflow.name}
- **Kategorie**: ${workflow.category}
- **Beschreibung**: ${workflow.description || ""}
- **Schritte**: ${workflow.steps?.length || 0}

${
  workflow.steps
    ?.map(
      (step: any, idx: number) => `
${idx + 1}. **${step.title}**
   - ${step.description || ""}
   ${step.duration_days ? `- Dauer: ${step.duration_days} Tage` : ""}
`,
    )
    .join("\n") || ""
}
`,
    )
    .join("\n---\n") || "Keine Workflow-Vorlagen verfügbar"
}

---
*Automatisch generiert am ${new Date().toLocaleDateString("de-DE")}*`

      generatedArticles.push({
        title: "⚙️ Workflow-Vorlagen",
        content,
        category: "Automatisch generiert",
        status: "published",
      })
    }

    // Generate Responsibilities article
    if (handbookConfig.responsibilities) {
      const { data: responsibilities } = await supabase
        .from("responsibilities")
        .select(`
          *,
          responsible_user:users!responsibilities_responsible_user_id_fkey(first_name, last_name),
          deputy_user:users!responsibilities_deputy_user_id_fkey(first_name, last_name)
        `)
        .eq("practice_id", practiceId)
        .eq("is_active", true)
        .order("group_name")

      const grouped = responsibilities?.reduce((acc: any, resp: any) => {
        const group = resp.group_name || "Allgemein"
        if (!acc[group]) acc[group] = []
        acc[group].push(resp)
        return acc
      }, {})

      const content = `# Zuständigkeiten

## Übersicht der Verantwortlichkeiten

${
  Object.entries(grouped || {})
    .map(
      ([group, items]: [string, any]) => `
### ${group}

${items
  .map(
    (resp: any) => `
#### ${resp.name}
- **Verantwortlich**: ${resp.responsible_user ? `${resp.responsible_user.first_name} ${resp.responsible_user.last_name}` : "Nicht zugewiesen"}
${resp.deputy_user ? `- **Vertretung**: ${resp.deputy_user.first_name} ${resp.deputy_user.last_name}` : ""}
${resp.suggested_hours_per_week ? `- **Geschätzter Zeitaufwand**: ${resp.suggested_hours_per_week} Stunden/Woche` : ""}

${resp.description || ""}
`,
  )
  .join("\n")}
`,
    )
    .join("\n") || "Keine Zuständigkeiten definiert"
}

---
*Automatisch generiert am ${new Date().toLocaleDateString("de-DE")}*`

      generatedArticles.push({
        title: "👥 Zuständigkeiten",
        content,
        category: "Automatisch generiert",
        status: "published",
      })
    }

    // Generate Protocols article (using system_changes as protocol data)
    if (handbookConfig.protocols) {
      const { data: protocols } = await supabase
        .from("system_changes")
        .select("*")
        .eq("practice_id", practiceId)
        .eq("change_type", "meeting")
        .order("created_at", { ascending: false })
        .limit(10)

      const content = `# Gesprächsprotokolle

## Letzte Besprechungen

${
  protocols
    ?.map(
      (protocol) => `
### ${protocol.title}
- **Datum**: ${new Date(protocol.created_at).toLocaleDateString("de-DE")}
- **Art**: ${protocol.entity_type}

${protocol.description || ""}

${
  protocol.metadata
    ? `
**Details:**
${Object.entries(protocol.metadata)
  .map(([key, value]) => `- ${key}: ${value}`)
  .join("\n")}
`
    : ""
}
`,
    )
    .join("\n---\n") || "Keine Gesprächsprotokolle vorhanden"
}

---
*Automatisch generiert am ${new Date().toLocaleDateString("de-DE")}*`

      generatedArticles.push({
        title: "📝 Gesprächsprotokolle",
        content,
        category: "Automatisch generiert",
        status: "published",
      })
    }

    // Delete old auto-generated articles for this practice
    await supabase.from("knowledge_base").delete().eq("practice_id", practiceId).eq("category", "Automatisch generiert")

    // Insert new articles
    if (generatedArticles.length > 0) {
      const articlesWithMetadata = generatedArticles.map((article) => ({
        ...article,
        practice_id: practiceId,
        created_by: user.id,
        version: 1,
        tags: ["Automatisch generiert"],
        published_at: new Date().toISOString(),
      }))

      const { error } = await supabase.from("knowledge_base").insert(articlesWithMetadata)

      if (error) throw error
    }

    return NextResponse.json({
      success: true,
      generated: generatedArticles.length,
      articles: generatedArticles.map((a) => a.title),
    })
  } catch (error: any) {
    console.error("Error auto-generating handbook content:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
