"use client"

import { TodoListView } from "./todo-list-view"
import { TodoCompactView } from "./todo-compact-view"
import type { TodoCardProps } from "./todo-card-utils"

export type { TodoCardProps }
export { statusConfig, type TeamMember } from "./todo-card-utils"

export function TodoCard(props: TodoCardProps) {
  if (props.viewMode === "list") {
    return <TodoListView {...props} />
  }
  return <TodoCompactView {...props} />
}
