"use client"

export interface Parameter {
  id: string
  name: string
  description: string
  type: "number" | "text" | "boolean" | "date" | "select"
  category: string
  unit?: string
  options?: string[]
  isRequired?: boolean
}

export interface CustomForm {
  id: string
  name: string
  description: string
  parameters: string[]
  assignedUsers: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
  dueDate?: string
  frequency?: "once" | "daily" | "weekly" | "monthly" | "quarterly"
}

export interface FormSubmission {
  id: string
  formId: string
  userId: string
  userName: string
  submittedAt: string
  data: Record<string, any>
  status: "draft" | "submitted" | "reviewed"
}

export const DEFAULT_FORM_DATA: Partial<CustomForm> = {
  name: "",
  description: "",
  parameters: [],
  assignedUsers: [],
  isActive: true,
  frequency: "once",
}
