"use client"

import { useState, useEffect, useRef } from "react"
import { useUser } from "@/contexts/user-context"
import { useToast } from "@/hooks/use-toast"

const disclaimerCache = new Map<string, { value: boolean; timestamp: number }>()
const CACHE_TTL = 60000 // 1 minute cache

export function useAIDisclaimer() {
  const { currentUser } = useUser()
  const { toast } = useToast()
  const [isAccepted, setIsAccepted] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const fetchingRef = useRef(false)

  useEffect(() => {
    checkDisclaimerStatus()
  }, [currentUser?.id])

  const checkDisclaimerStatus = async () => {
    if (!currentUser?.id) {
      setIsLoading(false)
      return
    }

    const cached = disclaimerCache.get(currentUser.id)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setIsAccepted(cached.value)
      setIsLoading(false)
      return
    }

    if (fetchingRef.current) {
      return
    }
    fetchingRef.current = true

    try {
      const response = await fetch(`/api/user/preferences?userId=${currentUser.id}`)

      if (response.status === 429) {
        console.warn("[useAIDisclaimer] Rate limited, using cached or default value")
        setIsAccepted(cached?.value ?? false)
        setIsLoading(false)
        return
      }

      if (response.ok) {
        const text = await response.text()
        if (!text) {
          setIsAccepted(false)
          disclaimerCache.set(currentUser.id, { value: false, timestamp: Date.now() })
          return
        }

        try {
          const data = JSON.parse(text)
          const accepted = data.preferences?.ai_disclaimer_accepted || false
          setIsAccepted(accepted)
          disclaimerCache.set(currentUser.id, { value: accepted, timestamp: Date.now() })
        } catch (parseError) {
          console.error("[useAIDisclaimer] Error parsing response:", parseError)
          setIsAccepted(false)
        }
      } else {
        setIsAccepted(false)
      }
    } catch (error) {
      console.error("[useAIDisclaimer] Error checking status:", error)
      setIsAccepted(cached?.value ?? false)
    } finally {
      setIsLoading(false)
      fetchingRef.current = false
    }
  }

  const acceptDisclaimer = async () => {
    if (!currentUser?.id) return false

    try {
      const response = await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          ai_disclaimer_accepted: true,
          ai_disclaimer_accepted_at: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        setIsAccepted(true)
        disclaimerCache.set(currentUser.id, { value: true, timestamp: Date.now() })
        toast({
          title: "Einstellungen gespeichert",
          description: "Sie können jetzt die KI-Funktionen nutzen.",
        })
        return true
      }
    } catch (error) {
      console.error("[useAIDisclaimer] Error accepting disclaimer:", error)
      toast({
        title: "Fehler",
        description: "Die Einstellungen konnten nicht gespeichert werden.",
        variant: "destructive",
      })
    }
    return false
  }

  return {
    isAccepted,
    isLoading,
    acceptDisclaimer,
    checkDisclaimerStatus,
  }
}
