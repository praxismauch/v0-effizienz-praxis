"use client"

import { SuperAdminSidebar } from "@/components/super-admin-sidebar"
import { SocialMediaPostCreator } from "@/components/social-media-post-creator"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

export function SocialMediaPageClient() {
  return (
    <SidebarProvider>
      <SuperAdminSidebar />
      <SidebarInset>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Social Media Post Creator</h1>
              <p className="text-muted-foreground">
                Erstellen Sie optimierte Posts für verschiedene Social Media Plattformen
              </p>
            </div>
          </div>
          <SocialMediaPostCreator />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
