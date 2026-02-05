"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface SuperAdminSidebarContextType {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  sidebarWidth: number
}

const SuperAdminSidebarContext = createContext<SuperAdminSidebarContextType | undefined>(undefined)

export function SuperAdminSidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const sidebarWidth = collapsed ? 64 : 256 // 16rem = 256px, 4rem = 64px

  return (
    <SuperAdminSidebarContext.Provider value={{ collapsed, setCollapsed, sidebarWidth }}>
      {children}
    </SuperAdminSidebarContext.Provider>
  )
}

export function useSuperAdminSidebar() {
  const context = useContext(SuperAdminSidebarContext)
  if (context === undefined) {
    throw new Error("useSuperAdminSidebar must be used within a SuperAdminSidebarProvider")
  }
  return context
}
