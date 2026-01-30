import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Standard API error response
 */
export function errorResponse(error: unknown, defaultMessage = "An error occurred") {
  console.error("[API Error]:", error)
  
  const message = error instanceof Error ? error.message : defaultMessage
  const status = error instanceof Error && "status" in error ? (error as any).status : 500
  
  return NextResponse.json({ error: message }, { status })
}

/**
 * Standard API success response
 */
export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

/**
 * Get Supabase client with error handling
 */
export async function getSupabaseClient(): Promise<SupabaseClient> {
  try {
    return await createClient()
  } catch (error) {
    console.error("[Supabase Client Error]:", error)
    throw new Error("Failed to initialize database connection")
  }
}

/**
 * Generic CRUD helper for list operations
 */
export async function handleList<T>(
  tableName: string,
  practiceId: string | number,
  options?: {
    select?: string
    orderBy?: { column: string; ascending?: boolean }
    filters?: Record<string, any>
  },
) {
  try {
    const supabase = await getSupabaseClient()
    
    let query = supabase
      .from(tableName)
      .select(options?.select || "*")
      .eq("practice_id", practiceId)
    
    // Apply additional filters
    if (options?.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
    }
    
    // Apply ordering
    if (options?.orderBy) {
      query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending ?? true })
    }
    
    const { data, error } = await query
    
    if (error) {
      // Handle table not found gracefully
      if (error.code === "42P01") {
        return successResponse({ [tableName]: [] })
      }
      throw error
    }
    
    return successResponse({ [tableName]: data })
  } catch (error) {
    return errorResponse(error, `Failed to fetch ${tableName}`)
  }
}

/**
 * Generic CRUD helper for get by ID
 */
export async function handleGetById<T>(
  tableName: string,
  id: string,
  practiceId?: string | number,
  select = "*",
) {
  try {
    const supabase = await getSupabaseClient()
    
    let query = supabase.from(tableName).select(select).eq("id", id)
    
    if (practiceId !== undefined) {
      query = query.eq("practice_id", practiceId)
    }
    
    const { data, error } = await query.single()
    
    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
      }
      throw error
    }
    
    return successResponse(data)
  } catch (error) {
    return errorResponse(error, `Failed to fetch ${tableName}`)
  }
}

/**
 * Generic CRUD helper for create
 */
export async function handleCreate<T>(
  tableName: string,
  data: Partial<T>,
  practiceId?: string | number,
) {
  try {
    const supabase = await getSupabaseClient()
    
    const insertData = practiceId !== undefined ? { ...data, practice_id: practiceId } : data
    
    const { data: result, error } = await supabase.from(tableName).insert(insertData).select().single()
    
    if (error) throw error
    
    return successResponse(result, 201)
  } catch (error) {
    return errorResponse(error, `Failed to create ${tableName}`)
  }
}

/**
 * Generic CRUD helper for update
 */
export async function handleUpdate<T>(
  tableName: string,
  id: string,
  data: Partial<T>,
  practiceId?: string | number,
) {
  try {
    const supabase = await getSupabaseClient()
    
    let query = supabase.from(tableName).update(data).eq("id", id)
    
    if (practiceId !== undefined) {
      query = query.eq("practice_id", practiceId)
    }
    
    const { data: result, error } = await query.select().single()
    
    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
      }
      throw error
    }
    
    return successResponse(result)
  } catch (error) {
    return errorResponse(error, `Failed to update ${tableName}`)
  }
}

/**
 * Generic CRUD helper for delete
 */
export async function handleDelete(tableName: string, id: string, practiceId?: string | number) {
  try {
    const supabase = await getSupabaseClient()
    
    let query = supabase.from(tableName).delete().eq("id", id)
    
    if (practiceId !== undefined) {
      query = query.eq("practice_id", practiceId)
    }
    
    const { error } = await query
    
    if (error) throw error
    
    return successResponse({ success: true })
  } catch (error) {
    return errorResponse(error, `Failed to delete ${tableName}`)
  }
}

/**
 * Validate required fields
 */
export function validateRequired(data: Record<string, any>, requiredFields: string[]): string | null {
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === "string" && !data[field].trim())) {
      return `Field '${field}' is required`
    }
  }
  return null
}

/**
 * Parse and validate query parameters
 */
export function parseQueryParams(searchParams: URLSearchParams, schema: Record<string, "string" | "number" | "boolean">) {
  const params: Record<string, any> = {}
  
  Object.entries(schema).forEach(([key, type]) => {
    const value = searchParams.get(key)
    if (value !== null) {
      switch (type) {
        case "number":
          params[key] = Number(value)
          break
        case "boolean":
          params[key] = value === "true"
          break
        default:
          params[key] = value
      }
    }
  })
  
  return params
}
