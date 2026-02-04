import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { requireSuperAdmin } from "@/lib/auth-utils"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getSupabaseAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin()
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const level = searchParams.get("level")
    const category = searchParams.get("category")
    const status = searchParams.get("status")
    const source = searchParams.get("source")
    const search = searchParams.get("search")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const practiceId = searchParams.get("practiceId")
    const fingerprint = searchParams.get("fingerprint")
    
    const supabase = getSupabaseAdmin()
    const offset = (page - 1) * limit
    
    let query = supabase
      .from("error_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (level && level !== "all") {
      query = query.eq("level", level)
    }
    if (category && category !== "all") {
      query = query.eq("category", category)
    }
    if (status && status !== "all") {
      query = query.eq("status", status)
    }
    if (source && source !== "all") {
      query = query.eq("source", source)
    }
    if (search) {
      query = query.or(`message.ilike.%${search}%,error_message.ilike.%${search}%,url.ilike.%${search}%`)
    }
    if (startDate) {
      query = query.gte("created_at", startDate)
    }
    if (endDate) {
      query = query.lte("created_at", endDate)
    }
    if (practiceId) {
      query = query.eq("practice_id", parseInt(practiceId))
    }
    if (fingerprint) {
      query = query.eq("fingerprint", fingerprint)
    }
    
    const { data: logs, error, count } = await query
    
    if (error) {
      console.error("[v0] Error fetching error logs:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Get aggregated stats
    const { data: statsData } = await supabase
      .from("error_logs")
      .select("level, status, category, source")
    
    const stats = {
      total: count || 0,
      byLevel: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      bySource: {} as Record<string, number>,
      last24h: 0,
      lastWeek: 0
    }
    
    if (statsData) {
      statsData.forEach((log) => {
        stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1
        stats.byStatus[log.status] = (stats.byStatus[log.status] || 0) + 1
        stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1
        if (log.source) {
          stats.bySource[log.source] = (stats.bySource[log.source] || 0) + 1
        }
      })
    }
    
    // Get time-based counts
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const { count: last24hCount } = await supabase
      .from("error_logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", yesterday.toISOString())
    
    const { count: lastWeekCount } = await supabase
      .from("error_logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", lastWeek.toISOString())
    
    stats.last24h = last24hCount || 0
    stats.lastWeek = lastWeekCount || 0
    
    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      stats
    })
  } catch (error: any) {
    console.error("[v0] Error in error-logs API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireSuperAdmin()
    const body = await request.json()
    const { id, ids, status, resolution_notes } = body
    
    const supabase = getSupabaseAdmin()
    
    const updateData: any = {
      status,
      resolution_notes
    }
    
    if (status === "resolved") {
      updateData.resolved_at = new Date().toISOString()
      updateData.resolved_by = user.id
    }
    
    if (ids && Array.isArray(ids)) {
      // Bulk update
      const { error } = await supabase
        .from("error_logs")
        .update(updateData)
        .in("id", ids)
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      return NextResponse.json({ success: true, updated: ids.length })
    } else if (id) {
      // Single update
      const { error } = await supabase
        .from("error_logs")
        .update(updateData)
        .eq("id", id)
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      return NextResponse.json({ success: true })
    }
    
    return NextResponse.json({ error: "ID or IDs required" }, { status: 400 })
  } catch (error: any) {
    console.error("[v0] Error updating error log:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireSuperAdmin()
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const olderThan = searchParams.get("olderThan") // days
    const status = searchParams.get("status")
    
    const supabase = getSupabaseAdmin()
    
    if (id) {
      const { error } = await supabase
        .from("error_logs")
        .delete()
        .eq("id", id)
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      return NextResponse.json({ success: true })
    }
    
    if (olderThan) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(olderThan))
      
      let query = supabase
        .from("error_logs")
        .delete()
        .lt("created_at", cutoffDate.toISOString())
      
      if (status) {
        query = query.eq("status", status)
      }
      
      const { error, count } = await query.select("*", { count: "exact", head: true })
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      return NextResponse.json({ success: true, deleted: count })
    }
    
    return NextResponse.json({ error: "ID or olderThan parameter required" }, { status: 400 })
  } catch (error: any) {
    console.error("[v0] Error deleting error logs:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
