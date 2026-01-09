"use client"

import { Badge } from "@/components/ui/badge"
import { Link2 } from "lucide-react"
import Link from "next/link"

interface TodoResponsibilityLinkProps {
  responsibilityId?: string
  responsibilityName?: string
  compact?: boolean
}

export function TodoResponsibilityLink({
  responsibilityId,
  responsibilityName,
  compact = false,
}: TodoResponsibilityLinkProps) {
  if (!responsibilityId || !responsibilityName) {
    return null
  }

  if (compact) {
    return (
      <Link href="/responsibilities" className="inline-flex items-center gap-1 hover:underline">
        <Link2 className="h-3 w-3 text-primary" />
        <span className="text-xs text-muted-foreground truncate max-w-[150px]">{responsibilityName}</span>
      </Link>
    )
  }

  return (
    <Link href="/responsibilities">
      <Badge variant="outline" className="gap-1 cursor-pointer hover:bg-muted transition-colors">
        <Link2 className="h-3 w-3 text-primary" />
        <span className="truncate max-w-[200px]">{responsibilityName}</span>
      </Badge>
    </Link>
  )
}
