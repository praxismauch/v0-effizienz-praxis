import { NextResponse } from "next/server"
import { getNavigationGroups } from "@/lib/sidebar-navigation"

// Translation function (simple fallback)
const t = (key: string, fallback: string) => fallback

// Super Admin menu items structure
const getSuperAdminMenuItems = () => {
  return [
    { name: "Dashboard", href: "/super-admin", groupLabel: "Super Admin" },
    { name: "Warteliste", href: "/super-admin/waitlist", groupLabel: "Super Admin" },
    { name: "Tickets", href: "/super-admin/tickets", groupLabel: "Super Admin" },
    { name: "Verwaltung", href: "/super-admin/verwaltung", groupLabel: "Super Admin" },
    { name: "Zahlungen", href: "/super-admin/zahlungen", groupLabel: "Super Admin" },
    { name: "Testing", href: "/super-admin/testing", groupLabel: "Super Admin" },
    { name: "System", href: "/super-admin/system", groupLabel: "Super Admin" },
    { name: "Marketing", href: "/super-admin/marketing", groupLabel: "Super Admin" },
    { name: "Social Media", href: "/super-admin/social-media", groupLabel: "Super Admin" },
    { name: "Landingpages", href: "/super-admin/landingpages", groupLabel: "Super Admin" },
    { name: "Content", href: "/super-admin/content", groupLabel: "Super Admin" },
    { name: "Academy", href: "/super-admin/academy", groupLabel: "Super Admin" },
  ]
}

export async function GET() {
  try {
    // Get app navigation items
    const appNavigationGroups = getNavigationGroups(t)
    const appMenuItems = appNavigationGroups.flatMap((group) =>
      group.items.map((item) => ({
        name: item.name,
        href: item.href,
        groupLabel: group.label,
      }))
    )

    // Get super admin menu items
    const superAdminMenuItems = getSuperAdminMenuItems()

    // Combine all menu items
    const allMenuItems = [...appMenuItems, ...superAdminMenuItems]

    return NextResponse.json({ items: allMenuItems })
  } catch (error) {
    console.error("Error fetching menu items:", error)
    return NextResponse.json({ items: [] }, { status: 500 })
  }
}
