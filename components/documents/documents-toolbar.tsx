"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, List, Grid3x3, Home, ChevronRight, Edit, FolderPlus, Upload, Sparkles } from "lucide-react"
import { useTranslation } from "@/contexts/translation-context"
import type { DocumentFolder } from "./types"

interface DocumentsToolbarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  fileTypeFilter: string
  onFileTypeFilterChange: (filter: string) => void
  sortBy: string
  onSortByChange: (sort: string) => void
  viewMode: "grid" | "list"
  onViewModeChange: (mode: "grid" | "list") => void
  folderPath: DocumentFolder[]
  onNavigateToRoot: () => void
  onNavigateToPathFolder: (index: number) => void
  isEditMode: boolean
  onToggleEditMode: () => void
  onNewFolder: () => void
  onUpload: () => void
  onAnalyzeFolder: () => void
}

export function DocumentsToolbar({
  searchQuery,
  onSearchChange,
  fileTypeFilter,
  onFileTypeFilterChange,
  sortBy,
  onSortByChange,
  viewMode,
  onViewModeChange,
  folderPath,
  onNavigateToRoot,
  onNavigateToPathFolder,
  isEditMode,
  onToggleEditMode,
  onNewFolder,
  onUpload,
  onAnalyzeFolder,
}: DocumentsToolbarProps) {
  const { t } = useTranslation()

  return (
    <>
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("documents.search", "Dokumente durchsuchen...")}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={fileTypeFilter} onValueChange={onFileTypeFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("documents.filter", "Filtern")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("documents.allTypes", "Alle Typen")}</SelectItem>
            <SelectItem value="pdf">{t("documents.pdf", "PDF")}</SelectItem>
            <SelectItem value="doc">{t("documents.doc", "Word Dokumente")}</SelectItem>
            <SelectItem value="xls">{t("documents.xls", "Excel Dateien")}</SelectItem>
            <SelectItem value="image">{t("documents.images", "Bilder")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={onSortByChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("documents.sort", "Sortieren")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">{t("documents.nameAsc", "Name (A-Z)")}</SelectItem>
            <SelectItem value="name-desc">{t("documents.nameDesc", "Name (Z-A)")}</SelectItem>
            <SelectItem value="date-asc">{t("documents.dateAsc", "Datum (Älteste)")}</SelectItem>
            <SelectItem value="date-desc">{t("documents.dateDesc", "Datum (Neueste)")}</SelectItem>
            <SelectItem value="size-asc">{t("documents.sizeAsc", "Größe (Kleinste)")}</SelectItem>
            <SelectItem value="size-desc">{t("documents.sizeDesc", "Größe (Größte)")}</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 border rounded-md">
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("list")}
            className="h-9 px-3"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("grid")}
            className="h-9 px-3"
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button variant="ghost" size="sm" onClick={onNavigateToRoot} className="h-8 px-2">
            <Home className="h-4 w-4" />
          </Button>
          {folderPath.map((folder, index) => (
            <div key={folder.id} className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigateToPathFolder(index)}
                className="h-8 px-2 hover:bg-muted"
              >
                {folder.name}
              </Button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button onClick={onToggleEditMode} variant={isEditMode ? "default" : "outline"}>
            <Edit className="mr-2 h-4 w-4" />
            {isEditMode ? "Fertig" : "Ansicht bearbeiten"}
          </Button>
          <Button onClick={onNewFolder} variant="outline">
            <FolderPlus className="mr-2 h-4 w-4" />
            {t("documents.newFolder", "Neuer Ordner")}
          </Button>
          <Button onClick={onUpload}>
            <Upload className="mr-2 h-4 w-4" />
            {t("documents.upload", "Hochladen")}
          </Button>
          <Button
            onClick={onAnalyzeFolder}
            className="gap-2 bg-gradient-to-r from-purple-500/90 to-indigo-500/90 hover:from-purple-600 hover:to-indigo-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300"
          >
            <Sparkles className="h-4 w-4" />
            <span className="font-semibold">{t("documents.aiAnalyzeCurrentFolder", "KI-Analyse aktueller Ordner")}</span>
          </Button>
        </div>
      </div>
    </>
  )
}
