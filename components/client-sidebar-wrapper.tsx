"use client"

import * as React from "react"
import { SidebarProvider } from "@/components/ui/sidebar"

export function ClientSidebarWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Return a div with the same structure during SSR to prevent layout shift
    return <div suppressHydrationWarning>{children}</div>
  }

  return (
    <SidebarProvider defaultOpen={true}>
      {children}
    </SidebarProvider>
  )
}
