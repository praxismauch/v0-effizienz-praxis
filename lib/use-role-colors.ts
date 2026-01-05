"use client"

import { useEffect, useState } from "react"

export interface RoleColor {
  role: string
  color: string
  label: string
  description?: string
  display_order: number
}

// Default fallback colors if API fails
const DEFAULT_ROLE_COLORS: Record<string, string> = {
  superadmin: "bg-purple-100 text-purple-800 hover:bg-purple-100",
  admin: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  poweruser: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  user: "bg-gray-100 text-gray-800 hover:bg-gray-100",
}

export function useRoleColors() {
  const [roleColors, setRoleColors] = useState<Record<string, string>>(DEFAULT_ROLE_COLORS)
  const [roleColorsData, setRoleColorsData] = useState<RoleColor[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRoleColors = async () => {
      try {
        const response = await fetch("/api/system/role-colors")

        if (!response.ok) {
          console.error(`[v0] Failed to fetch role colors: ${response.status} ${response.statusText}`)
          setIsLoading(false)
          return
        }

        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text()
          console.error(`[v0] Non-JSON response from role colors API:`, text)
          setIsLoading(false)
          return
        }

        const data: RoleColor[] = await response.json()
        setRoleColorsData(data)

        // Convert to Record<string, string> format for easy lookup
        const colorsMap: Record<string, string> = {}
        data.forEach((rc) => {
          colorsMap[rc.role] = rc.color
        })
        setRoleColors(colorsMap)
      } catch (error) {
        console.error("[v0] Failed to fetch role colors:", error)
        // Keep default colors on error
      } finally {
        setIsLoading(false)
      }
    }

    fetchRoleColors()
  }, [])

  return { roleColors, roleColorsData, isLoading }
}
