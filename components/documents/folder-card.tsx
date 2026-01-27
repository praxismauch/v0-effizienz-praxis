"use client"

import type React from "react"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Folder, FileText, MoreVertical } from "lucide-react"
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

  const FolderDropdownMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="sm" className={viewMode === "grid" ? "" : "h-7 w-7 p-0"}>
          <MoreVertical className={viewMode === "grid" ? "h-4 w-4" : "h-3.5 w-3.5"} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-[999999]">
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            onNavigate(folder)
          }}
        >
          {t("documents.open", "Öffnen")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            onEdit(folder)
          }}
        >
          {t("documents.edit", "Bearbeiten")}
        </DropdownMenuItem>
        {!folder.is_system_folder && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              onDelete(folder.id)
            }}
          >
            {t("documents.delete", "Löschen")}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            onUploadToFolder(folder.id)
          }}
        >
          {t("documents.uploadToFolder", "In diesen Ordner hochladen")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  if (viewMode === "list") {
    return (
      <Card
        className={`w-full bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors ${isDragOver ? "border-primary bg-primary/10 ring-2 ring-primary/20" : ""} ${isEditMode ? "cursor-grab active:cursor-grabbing" : ""}`}
        draggable={isEditMode}
        onDragStart={(e) => isEditMode && onDragStart(e, folder.id)}
        onDragOver={(e) => isEditMode && onDragOver(e, folder.id)}
        onDragLeave={onDragLeave}
        onDrop={(e) => isEditMode && onDrop(e, folder.id)}
      >
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-lg"
              style={{ backgroundColor: `${folder.color || "#3b82f6"}20` }}
            >
              <Folder className="h-6 w-6" style={{ color: folder.color || "#3b82f6" }} />
            </div>
            <div className="truncate font-semibold text-base">{folder.name}</div>
            <div className="flex items-center gap-2 ml-auto flex-shrink-0">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                <Folder className="h-3 w-3 mr-1" />
                {subfolderCount} {t("documents.subfolders", "Unterordner")}
              </Badge>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                <FileText className="h-3 w-3 mr-1" />
                {fileCount} {t("documents.files", "Dateien")}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            <FolderDropdownMenu />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={`w-full bg-primary/5 border-primary/20 hover:bg-primary/10 hover:border-primary/30 transition-all ${isDragOver ? "border-primary bg-primary/10 ring-2 ring-primary/20" : ""} ${isEditMode ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}`}
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
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="flex items-center justify-center w-12 h-12 rounded-lg"
            style={{ backgroundColor: `${folder.color || "#3b82f6"}20` }}
          >
            <Folder className="h-7 w-7" style={{ color: folder.color || "#3b82f6" }} />
          </div>
          <div className="truncate font-semibold text-base">{folder.name}</div>
        </div>
        <FolderDropdownMenu />
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs">
            <Folder className="h-3 w-3 mr-1" />
            {subfolderCount} {t("documents.subfolders", "Unterordner")}
          </Badge>
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs">
            <FileText className="h-3 w-3 mr-1" />
            {fileCount} {t("documents.files", "Dateien")}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
