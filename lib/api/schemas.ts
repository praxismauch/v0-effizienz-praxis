/**
 * Zod schemas for API input validation
 * Centralized validation schemas for all API endpoints
 */
import { z } from "zod"

// Common schemas
export const uuidSchema = z.string().uuid("Invalid UUID format")

export const practiceIdSchema = z
  .string()
  .uuid("Invalid practice ID")
  .refine((val) => val !== "0" && val !== "null", "Practice ID cannot be '0' or 'null'")

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
})

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  practice_name: z.string().optional(),
})

export const passwordResetSchema = z.object({
  email: z.string().email("Invalid email address"),
})

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, "Current password is required"),
  new_password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
})

// User schemas
export const userIdSchema = z.string().uuid("Invalid user ID")

export const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["superadmin", "admin", "user", "viewer"]).default("user"),
  practice_id: practiceIdSchema.optional(),
})

export const updateUserSchema = createUserSchema.partial()

// Practice schemas
export const createPracticeSchema = z.object({
  name: z.string().min(2, "Practice name must be at least 2 characters"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  tax_id: z.string().optional(),
})

export const updatePracticeSchema = createPracticeSchema.partial()

// Team member schemas
export const createTeamMemberSchema = z.object({
  user_id: userIdSchema,
  practice_id: practiceIdSchema,
  position: z.string().optional(),
  department: z.string().optional(),
  status: z.enum(["active", "inactive", "pending"]).default("active"),
})

export const createTeamMemberExtendedSchema = z.object({
  first_name: z.string().min(1, "Vorname ist erforderlich"),
  last_name: z.string().min(1, "Nachname ist erforderlich"),
  email: z.string().email("Ungültige E-Mail-Adresse"),
  phone: z.string().optional(),
  position: z.string().optional(),
  department: z.string().optional(),
  role: z.enum(["admin", "user", "viewer"]).default("user"),
  hire_date: z.string().datetime().optional(),
  status: z.enum(["active", "inactive", "pending"]).default("active"),
  skills: z
    .array(
      z.object({
        skill_id: uuidSchema,
        level: z.number().min(0).max(3),
      }),
    )
    .optional(),
})

// Todo schemas
export const createTodoSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  due_date: z.string().datetime().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  practice_id: practiceIdSchema,
  assigned_to: userIdSchema.optional(),
})

export const updateTodoSchema = createTodoSchema.partial().extend({
  completed: z.boolean().optional(),
})

// Goal schemas
export const createGoalSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  target_value: z.number().optional(),
  current_value: z.number().default(0),
  unit: z.string().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  status: z.enum(["not_started", "in_progress", "completed", "cancelled"]).default("not_started"),
  practice_id: practiceIdSchema,
})

export const updateGoalSchema = createGoalSchema.partial()

// Workflow schemas
export const createWorkflowSchema = z.object({
  name: z.string().min(3, "Workflow name must be at least 3 characters"),
  description: z.string().optional(),
  practice_id: practiceIdSchema,
  status: z.enum(["draft", "active", "in_progress", "completed", "archived"]).default("draft"),
  category: z.string().optional(),
})

export const updateWorkflowSchema = createWorkflowSchema.partial()

// Document schemas
export const createDocumentSchema = z.object({
  name: z.string().min(1, "Document name is required"),
  description: z.string().optional(),
  file_url: z.string().url("Invalid file URL"),
  file_type: z.string().optional(),
  file_size: z.number().optional(),
  folder_id: uuidSchema.optional(),
  practice_id: practiceIdSchema,
  tags: z.array(z.string()).optional(),
})

// Skill schemas
export const updateSkillLevelSchema = z.object({
  skill_id: uuidSchema,
  current_level: z.number().min(0).max(3),
  target_level: z.number().min(0).max(3).optional(),
  change_reason: z.string().min(1, "Change reason is required"),
  notes: z.string().optional(),
})

// Application/Hiring schemas
export const createApplicationSchema = z.object({
  candidate_id: uuidSchema,
  practice_id: practiceIdSchema,
  job_posting_id: uuidSchema.optional(),
  stage: z.string().optional(),
  status: z.enum(["pending", "reviewing", "accepted", "rejected"]).default("pending"),
})

// Calendar event schemas
export const createCalendarEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  all_day: z.boolean().default(false),
  practice_id: practiceIdSchema,
  category: z.string().optional(),
  attendees: z.array(uuidSchema).optional(),
})

export const createCalendarEventExtendedSchema = z.object({
  title: z.string().min(1, "Titel ist erforderlich"),
  description: z.string().optional(),
  start_date: z.string(),
  end_date: z.string(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  all_day: z.boolean().default(false),
  type: z
    .enum(["appointment", "meeting", "reminder", "training", "interview", "holiday", "other"])
    .default("appointment"),
  color: z.string().optional(),
  location: z.string().optional(),
  attendees: z.array(uuidSchema).optional(),
  recurrence: z
    .object({
      frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
      interval: z.number().min(1).default(1),
      endDate: z.string().datetime().optional(),
      count: z.number().optional(),
    })
    .optional(),
})

// AI Analysis schemas
export const aiAnalysisRequestSchema = z.object({
  practiceId: practiceIdSchema,
  userId: userIdSchema,
  analysisType: z.enum(["full", "quick", "custom"]).optional(),
  focusAreas: z.array(z.string()).optional(),
})

// File upload schemas
export const fileUploadSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
  contentType: z
    .string()
    .refine(
      (type) =>
        [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ].includes(type),
      "Invalid file type",
    ),
  size: z.number().max(10 * 1024 * 1024, "File size must be less than 10MB"),
})

// Search/filter schemas
export const searchSchema = z.object({
  q: z.string().max(200, "Search query too long").optional(),
  status: z.string().optional(),
  category: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
})

// ID param schema
export const idParamSchema = z.object({
  id: uuidSchema,
})

export const practiceIdParamSchema = z.object({
  practiceId: practiceIdSchema,
})

// Batch operation schemas
export const batchDeleteSchema = z.object({
  ids: z.array(uuidSchema).min(1, "At least one ID is required").max(100, "Cannot delete more than 100 items at once"),
})

export const batchUpdateSchema = z.object({
  ids: z.array(uuidSchema).min(1, "At least one ID is required").max(100, "Cannot update more than 100 items at once"),
  updates: z.record(z.unknown()),
})

// Survey schemas
export const createSurveySchema = z.object({
  title: z.string().min(1, "Titel ist erforderlich"),
  description: z.string().optional(),
  type: z.enum(["team", "patient", "custom"]).default("custom"),
  is_anonymous: z.boolean().default(false),
  target_audience: z.enum(["all", "selected", "anonymous"]).default("all"),
  start_date: z.string().datetime().optional().nullable(),
  end_date: z.string().datetime().optional().nullable(),
  notify_admin_on_response: z.boolean().default(false),
  questions: z
    .array(
      z.object({
        text: z.string().min(1),
        type: z.enum(["text", "rating", "multiple_choice", "single_choice", "yes_no", "scale"]),
        required: z.boolean().default(false),
        options: z.array(z.string()).optional(),
        order_index: z.number().default(0),
      }),
    )
    .optional(),
})

export const surveyResponseSchema = z.object({
  survey_id: uuidSchema,
  respondent_name: z.string().optional(),
  respondent_email: z.string().email().optional(),
  answers: z.array(
    z.object({
      question_id: uuidSchema,
      value: z.union([z.string(), z.number(), z.array(z.string())]),
    }),
  ),
})

// Inventory schemas
export const createInventoryItemSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  description: z.string().optional(),
  category: z.enum(["medical", "office", "hygiene", "equipment", "lab", "general"]).default("general"),
  sku: z.string().optional(),
  current_stock: z.number().min(0).default(0),
  minimum_stock: z.number().min(0).default(0),
  reorder_point: z.number().min(0).default(0),
  unit: z.string().default("Stück"),
  unit_price: z.number().min(0).optional(),
  supplier_id: uuidSchema.optional().nullable(),
  location: z.string().optional(),
  expiry_date: z.string().datetime().optional().nullable(),
})

export const inventoryConsumptionSchema = z.object({
  item_id: uuidSchema,
  quantity: z.number().min(1, "Menge muss mindestens 1 sein"),
  notes: z.string().optional(),
})

// Message schemas
export const createMessageSchema = z.object({
  recipient_id: uuidSchema,
  subject: z.string().min(1, "Betreff ist erforderlich"),
  content: z.string().min(1, "Nachricht ist erforderlich"),
  parent_id: uuidSchema.optional().nullable(),
})

// Knowledge base schemas
export const createKnowledgeArticleSchema = z.object({
  title: z.string().min(1, "Titel ist erforderlich"),
  content: z.string().min(1, "Inhalt ist erforderlich"),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  is_public: z.boolean().default(false),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
})

// Training schemas
export const createTrainingEventSchema = z.object({
  title: z.string().min(1, "Titel ist erforderlich"),
  description: z.string().optional(),
  course_id: uuidSchema.optional(),
  date: z.string(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  location: z.string().optional(),
  is_online: z.boolean().default(false),
  max_participants: z.number().min(1).optional(),
  instructor: z.string().optional(),
})

// Room schemas
export const createRoomSchema = z.object({
  name: z.string().min(1, "Raumname ist erforderlich"),
  description: z.string().optional(),
  capacity: z.number().min(1).optional(),
  equipment: z.array(z.string()).optional(),
  is_active: z.boolean().default(true),
})

// Contact schemas
export const createContactSchema = z.object({
  first_name: z.string().min(1, "Vorname ist erforderlich"),
  last_name: z.string().min(1, "Nachname ist erforderlich"),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  type: z.enum(["patient", "supplier", "partner", "other"]).default("other"),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

// Protocol schemas
export const createProtocolSchema = z.object({
  title: z.string().min(1, "Titel ist erforderlich"),
  content: z.string().optional(),
  type: z.string().optional(),
  date: z.string(),
  attendees: z.array(uuidSchema).optional(),
  action_items: z
    .array(
      z.object({
        description: z.string(),
        assignee_id: uuidSchema.optional(),
        due_date: z.string().datetime().optional(),
        completed: z.boolean().default(false),
      }),
    )
    .optional(),
})

// Validation helper function
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  const errorMessages = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
  return { success: false, error: errorMessages }
}

// Type exports
export type CreateUserInput = z.infer<typeof createUserSchema>
export type CreatePracticeInput = z.infer<typeof createPracticeSchema>
export type CreateTodoInput = z.infer<typeof createTodoSchema>
export type CreateGoalInput = z.infer<typeof createGoalSchema>
export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>
export type UpdateSkillLevelInput = z.infer<typeof updateSkillLevelSchema>
export type AIAnalysisRequest = z.infer<typeof aiAnalysisRequestSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type PasswordResetInput = z.infer<typeof passwordResetSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type FileUploadInput = z.infer<typeof fileUploadSchema>
export type SearchInput = z.infer<typeof searchSchema>
export type IdParamInput = z.infer<typeof idParamSchema>
export type PracticeIdParamInput = z.infer<typeof practiceIdParamSchema>
export type BatchDeleteInput = z.infer<typeof batchDeleteSchema>
export type BatchUpdateInput = z.infer<typeof batchUpdateSchema>
export type CreateSurveyInput = z.infer<typeof createSurveySchema>
export type SurveyResponseInput = z.infer<typeof surveyResponseSchema>
export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>
export type InventoryConsumptionInput = z.infer<typeof inventoryConsumptionSchema>
export type CreateMessageInput = z.infer<typeof createMessageSchema>
export type CreateCalendarEventExtendedInput = z.infer<typeof createCalendarEventExtendedSchema>
export type CreateTeamMemberExtendedInput = z.infer<typeof createTeamMemberExtendedSchema>
export type CreateKnowledgeArticleInput = z.infer<typeof createKnowledgeArticleSchema>
export type CreateTrainingEventInput = z.infer<typeof createTrainingEventSchema>
export type CreateRoomInput = z.infer<typeof createRoomSchema>
export type CreateContactInput = z.infer<typeof createContactSchema>
export type CreateProtocolInput = z.infer<typeof createProtocolSchema>
