"use client"

import type React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Folder, FolderOpen, FileText, MoreVertical, ChevronRight, Upload, Pencil, Trash2 } from "lucide-react"
import { useTranslation } from "@/contexts/translation-context"
import type { DocumentFolder } from "./types"

interface FolderCardProps {
  folder: DocumentFolder
  viewMode: "grid" | "list"
  isEditMode: boolean
  isDragOver: boolean
  subfolderCount: number
  fileCount: number
  onNavigate: (folder: DocumentFolder) => void
  onEdit: (folder: DocumentFolder) => void
  onDelete: (folderId: string) => void
  onUploadToFolder: (folderId: string) => void
  onDragStart: (e: React.DragEvent, folderId: string) => void
  onDragOver: (e: React.DragEvent, folderId: string) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent, folderId: string) => void
}

export function FolderCard({
  folder,
  viewMode,
  isEditMode,
  isDragOver,
  subfolderCount,
  fileCount,
  onNavigate,
  onEdit,
  onDelete,
  onUploadToFolder,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
}: FolderCardProps) {
  const { t } = useTranslation()

  const folderColor = folder.color || "#3b82f6"

  const FolderDropdownMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-background/80"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            onNavigate(folder)
          }}
        >
          <FolderOpen className="h-4 w-4 mr-2" />
          {t("documents.open", "Öffnen")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            onEdit(folder)
          }}
        >
          <Pencil className="h-4 w-4 mr-2" />
          {t("documents.edit", "Bearbeiten")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            onUploadToFolder(folder.id)
          }}
        >
          <Upload className="h-4 w-4 mr-2" />
          {t("documents.uploadToFolder", "Hochladen")}
        </DropdownMenuItem>
        {!folder.is_system_folder && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onDelete(folder.id)
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t("documents.delete", "Löschen")}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  if (viewMode === "list") {
    return (
      <Card
        className={`group relative overflow-hidden border bg-card hover:shadow-md transition-all duration-200 ${
          isDragOver ? "ring-2 ring-primary border-primary" : "hover:border-border/80"
        } ${isEditMode ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}`}
        draggable={isEditMode}
        onDragStart={(e) => isEditMode && onDragStart(e, folder.id)}
        onDragOver={(e) => isEditMode && onDragOver(e, folder.id)}
        onDragLeave={onDragLeave}
        onDrop={(e) => isEditMode && onDrop(e, folder.id)}
        onClick={() => !isEditMode && onNavigate(folder)}
      >
        <div className="flex items-center gap-4 p-4">
          <div
            className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0"
            style={{ backgroundColor: `${folderColor}15` }}
          >
            <Folder className="h-6 w-6" style={{ color: folderColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{folder.name}</h3>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Folder className="h-3.5 w-3.5" />
                {subfolderCount}
              </span>
              <span className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                {fileCount}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FolderDropdownMenu />
            <ChevronRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card
      className={`group relative overflow-hidden border bg-card hover:shadow-lg transition-all duration-200 ${
        isDragOver ? "ring-2 ring-primary border-primary" : "hover:border-border/80"
      } ${isEditMode ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}`}
      onClick={() => !isEditMode && onNavigate(folder)}
      draggable={isEditMode}
      onDragStart={(e) => {
        if (isEditMode) {
          e.stopPropagation()
          onDragStart(e, folder.id)
        }
      }}
      onDragOver={(e) => {
        if (isEditMode) {
          e.stopPropagation()
          onDragOver(e, folder.id)
        }
      }}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        if (isEditMode) {
          e.stopPropagation()
          onDrop(e, folder.id)
        }
      }}
    >
      {/* Top accent bar */}
      <div className="h-1 w-full" style={{ backgroundColor: folderColor }} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="flex items-center justify-center w-14 h-14 rounded-xl"
            style={{ backgroundColor: `${folderColor}12` }}
          >
            <Folder className="h-7 w-7" style={{ color: folderColor }} />
          </div>
          <FolderDropdownMenu />
        </div>

        {/* Title */}
        <h3 className="font-semibold text-foreground text-lg mb-4 truncate group-hover:text-primary transition-colors">
          {folder.name}
        </h3>

        {/* Stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 text-sm">
            <Folder className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">{subfolderCount}</span>
            <span className="text-muted-foreground text-xs">{t("documents.subfolders", "Unterordner")}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 text-sm">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">{fileCount}</span>
            <span className="text-muted-foreground text-xs">{t("documents.files", "Dateien")}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
