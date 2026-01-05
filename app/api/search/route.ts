export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q")

    if (!query) {
      return NextResponse.json({ results: [] })
    }

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's practice
    const { data: userData } = await supabase.from("users").select("practice_id").eq("id", user.id).maybeSingle()

    if (!userData?.practice_id) {
      return NextResponse.json({ results: [] })
    }

    const practiceId = userData.practice_id
    const searchTerm = `%${query.toLowerCase()}%`

    // Search across multiple tables
    const results: any[] = []

    // Search todos/tasks
    const { data: todos } = await supabase
      .from("todos")
      .select("id, title, description, priority, status")
      .eq("practice_id", practiceId)
      .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
      .limit(10)

    if (todos) {
      results.push(
        ...todos.map((todo) => ({
          id: `todo-${todo.id}`,
          type: "Aufgabe",
          title: todo.title,
          description: todo.description,
          link: `/todos?id=${todo.id}`,
          priority: todo.priority,
          status: todo.status,
        })),
      )
    }

    // Search team members
    const { data: teamMembers } = await supabase
      .from("users")
      .select("id, name, email, role")
      .eq("practice_id", practiceId)
      .or(`name.ilike.${searchTerm},email.ilike.${searchTerm}`)
      .limit(10)

    if (teamMembers) {
      results.push(
        ...teamMembers.map((member) => ({
          id: `member-${member.id}`,
          type: "Mitarbeiter",
          title: member.name,
          description: member.email,
          link: `/team/${member.id}`,
          role: member.role,
        })),
      )
    }

    // Search workflows
    const { data: workflows } = await supabase
      .from("workflows")
      .select("id, title, description, status")
      .eq("practice_id", practiceId)
      .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
      .limit(10)

    if (workflows) {
      results.push(
        ...workflows.map((workflow) => ({
          id: `workflow-${workflow.id}`,
          type: "Workflow",
          title: workflow.title,
          description: workflow.description,
          link: `/workflows?id=${workflow.id}`,
          status: workflow.status,
        })),
      )
    }

    // Search protocols
    const { data: protocols } = await supabase
      .from("protocols")
      .select("id, title, content")
      .eq("practice_id", practiceId)
      .or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`)
      .limit(10)

    if (protocols) {
      results.push(
        ...protocols.map((protocol) => ({
          id: `protocol-${protocol.id}`,
          type: "Protokoll",
          title: protocol.title,
          description: protocol.content?.substring(0, 100),
          link: `/protocols?id=${protocol.id}`,
        })),
      )
    }

    return NextResponse.json({ results, query })
  } catch (error) {
    console.error("[v0] Search error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
