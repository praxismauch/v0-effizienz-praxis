"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Pencil, Trash2, Search, Languages } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/contexts/translation-context"

interface Translation {
  id: string
  key: string
  english: string
  german: string | null
  category: string
  description: string | null
  created_at: string
  updated_at: string
}

const categories = [
  "Dashboard",
  "Settings",
  "Analytics",
  "KPI",
  "Calendar",
  "Team",
  "Common",
  "Navigation",
  "Forms",
  "Errors",
]

export function LocalizationManager() {
  const { t } = useTranslation()
  const [translations, setTranslations] = useState<Translation[]>([])
  const [filteredTranslations, setFilteredTranslations] = useState<Translation[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTranslation, setEditingTranslation] = useState<Translation | null>(null)
  const [formData, setFormData] = useState({
    key: "",
    english: "",
    german: "",
    category: "Common",
    description: "",
  })
  const { toast } = useToast()
  const refreshTimeoutRef = useRef<NodeJS.Timeout>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTranslations()
  }, [])

  useEffect(() => {
    filterTranslations()
  }, [translations, searchQuery, selectedCategory])

  const fetchTranslations = async () => {
    try {
      const response = await fetch("/api/translations")
      const data = await response.json()
      setTranslations(data.translations || [])
    } catch (error) {
      console.error("[v0] Error fetching translations:", error)
      toast({
        title: "Error",
        description: "Failed to fetch translations",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterTranslations = () => {
    let filtered = translations

    if (selectedCategory !== "all") {
      filtered = filtered.filter((t) => t.category === selectedCategory)
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (t) =>
          t.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.english.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.german && t.german.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    setFilteredTranslations(filtered)
  }

  const handleOpenDialog = (translation?: Translation) => {
    if (translation) {
      setEditingTranslation(translation)
      setFormData({
        key: translation.key,
        english: translation.english,
        german: translation.german || "",
        category: translation.category,
        description: translation.description || "",
      })
    } else {
      setEditingTranslation(null)
      setFormData({
        key: "",
        english: "",
        german: "",
        category: "Common",
        description: "",
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingTranslation(null)
    setFormData({
      key: "",
      english: "",
      german: "",
      category: "Common",
      description: "",
    })
  }

  const handleSubmit = async () => {
    try {
      const url = editingTranslation ? `/api/translations/${editingTranslation.id}` : "/api/translations"
      const method = editingTranslation ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save translation")
      }

      toast({
        title: "Success",
        description: `Translation ${editingTranslation ? "updated" : "created"} successfully`,
      })

      handleCloseDialog()
      debouncedFetchTranslations()
    } catch (error) {
      console.error("Error saving translation:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save translation",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t("localization.confirm_delete", "Are you sure you want to delete this translation?"))) return

    try {
      const response = await fetch(`/api/translations/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete translation")

      toast({
        title: "Success",
        description: "Translation deleted successfully",
      })

      debouncedFetchTranslations()
    } catch (error) {
      console.error("Error deleting translation:", error)
      toast({
        title: "Error",
        description: "Failed to delete translation",
        variant: "destructive",
      })
    }
  }

  const debouncedFetchTranslations = () => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }
    refreshTimeoutRef.current = setTimeout(() => {
      fetchTranslations()
    }, 300)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              {t("localization.title", "Localization Management")}
            </CardTitle>
            <CardDescription>
              {t("localization.description", "Manage translations for English and German languages")}
            </CardDescription>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            {t("localization.add_translation", "Add Translation")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("localization.search_placeholder", "Search translations...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t("localization.filter_category", "Filter by category")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("localization.all_categories", "All Categories")}</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>English</TableHead>
                  <TableHead>German</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-full bg-muted animate-pulse rounded" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-full bg-muted animate-pulse rounded" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                    </TableCell>
                    <TableCell>
                      <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">{t("localization.column.english", "English")}</TableHead>
                  <TableHead className="w-[250px]">{t("localization.column.german", "German")}</TableHead>
                  <TableHead className="w-[120px]">{t("localization.column.category", "Category")}</TableHead>
                  <TableHead className="w-[100px]">{t("localization.column.actions", "Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTranslations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      {t("localization.no_translations", "No translations found")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTranslations.map((translation) => (
                    <TableRow key={translation.id}>
                      <TableCell className="max-w-[250px] truncate">{translation.english}</TableCell>
                      <TableCell className="max-w-[250px] truncate">{translation.german || "-"}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                          {translation.category}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(translation)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(translation.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTranslation
                ? t("localization.edit_translation", "Edit Translation")
                : t("localization.add_translation", "Add Translation")}
            </DialogTitle>
            <DialogDescription>
              {editingTranslation
                ? t("localization.update_values", "Update the translation values below")
                : t("localization.add_new", "Add a new translation key and values")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="key">{t("localization.translation_key", "Translation Key")}</Label>
              <Input
                id="key"
                placeholder={t("localization.key_placeholder", "e.g., cockpit.title")}
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">{t("localization.category", "Category")}</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="english">{t("localization.english", "English")}</Label>
              <Input
                id="english"
                placeholder={t("localization.english_placeholder", "English text")}
                value={formData.english}
                onChange={(e) => setFormData({ ...formData, english: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="german">{t("localization.german", "German")}</Label>
              <Input
                id="german"
                placeholder={t("localization.german_placeholder", "German text")}
                value={formData.german}
                onChange={(e) => setFormData({ ...formData, german: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">{t("localization.description", "Description (Optional)")}</Label>
              <Textarea
                id="description"
                placeholder={t("localization.description_placeholder", "Description of where this translation is used")}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button onClick={handleSubmit}>
              {editingTranslation ? t("common.update", "Update") : t("common.create", "Create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export default LocalizationManager
