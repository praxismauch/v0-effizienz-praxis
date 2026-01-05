"use client"

import type React from "react"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DeleteIconButtonProps {
  onDelete: () => void | Promise<void>
  tooltip?: string
  confirmTitle?: string
  confirmDescription?: string
  confirmButtonText?: string
  showConfirmDialog?: boolean
  disabled?: boolean
  size?: "sm" | "default" | "lg" | "icon"
  className?: string
}

export function DeleteIconButton({
  onDelete,
  tooltip = "Löschen",
  confirmTitle = "Löschen bestätigen",
  confirmDescription = "Sind Sie sicher, dass Sie dieses Element löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.",
  confirmButtonText = "Löschen",
  showConfirmDialog = true,
  disabled = false,
  size = "icon",
  className = "",
}: DeleteIconButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDialog, setShowDialog] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (showConfirmDialog) {
      setShowDialog(true)
    } else {
      executeDelete()
    }
  }

  const executeDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete()
    } finally {
      setIsDeleting(false)
      setShowDialog(false)
    }
  }

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size={size}
              className={`h-8 w-8 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors ${className}`}
              onClick={handleClick}
              disabled={disabled || isDeleting}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">{tooltip}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {showConfirmDialog && (
        <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
              <AlertDialogDescription>{confirmDescription}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
              <AlertDialogAction
                onClick={executeDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "Wird gelöscht..." : confirmButtonText}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}

export default DeleteIconButton
