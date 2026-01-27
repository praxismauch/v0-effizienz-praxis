"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import type { CompetitorAnalysis } from "../types"

export function useCompetitorAnalysis(analysisId: string) {
  const router = useRouter()
  const [analysis, setAnalysis] = useState<CompetitorAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  const fetchAnalysis = useCallback(async () => {
    try {
      const supabase = createClient()
      if (!supabase) throw new Error("No Supabase client")

      const { data, error } = await supabase
        .from("competitor_analyses")
        .select("*")
        .eq("id", analysisId)
        .single()

      if (error) throw error
      setAnalysis(data)
    } catch (error) {
      console.error("Error fetching analysis:", error)
      toast.error("Fehler beim Laden der Analyse")
    } finally {
      setIsLoading(false)
    }
  }, [analysisId])

  useEffect(() => {
    fetchAnalysis()
  }, [fetchAnalysis])

  const refreshAnalysis = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch(`/api/competitor-analysis/${analysisId}/refresh`, {
        method: "POST",
      })
      if (!response.ok) throw new Error("Refresh failed")
      
      await fetchAnalysis()
      toast.success("Analyse aktualisiert")
    } catch (error) {
      console.error("Error refreshing:", error)
      toast.error("Fehler beim Aktualisieren")
    } finally {
      setIsRefreshing(false)
    }
  }, [analysisId, fetchAnalysis])

  const deleteAnalysis = useCallback(async () => {
    try {
      const supabase = createClient()
      if (!supabase) throw new Error("No Supabase client")

      const { error } = await supabase
        .from("competitor_analyses")
        .delete()
        .eq("id", analysisId)

      if (error) throw error
      
      toast.success("Analyse gelöscht")
      router.push("/competitor-analysis")
    } catch (error) {
      console.error("Error deleting:", error)
      toast.error("Fehler beim Löschen")
    }
  }, [analysisId, router])

  return {
    analysis,
    isLoading,
    isRefreshing,
    activeTab,
    setActiveTab,
    refreshAnalysis,
    deleteAnalysis,
    refetch: fetchAnalysis,
  }
}
