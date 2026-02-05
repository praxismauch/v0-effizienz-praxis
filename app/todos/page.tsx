export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { getCurrentUser, getCurrentPracticeId } from "@/lib/server/get-current-user"
import { getTodosByPractice } from "@/lib/server/get-todo-data"
import { AppLayout } from "@/components/app-layout"
import PageClient from "./page-client"

export default async function TodosPage() {
  // Fetch user and practice data server-side
  const [user, practiceId] = await Promise.all([
    getCurrentUser(),
    getCurrentPracticeId(),
  ])
  
  // Redirect if not authenticated
  if (!user) {
    redirect("/auth/login")
  }
  
  // Fetch todos if practice exists
  const todos = practiceId ? await getTodosByPractice(practiceId) : []

  return (
    <AppLayout>
      <PageClient 
        initialTodos={todos}
        practiceId={practiceId}
        user={user}
      />
    </AppLayout>
  )
}
