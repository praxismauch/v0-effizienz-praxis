import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useTranslation } from "@/contexts/translation-context"
import { Link, ChevronDown, Settings, Upload, X, Loader2 } from "lucide-react"
import type React from "react"

interface Goal {
  id: string
  title: string
}

interface Parameter {
  id: string
  name: string
}

interface UploadedImage {
  url: string
  fileName: string
  fileSize: number
}

interface GoalExtendedSettingsProps {
  showExtended: boolean
  setShowExtended: (show: boolean) => void
  formData: {
    unit: string
    parentGoalId: string
    linkedParameterId: string
    isPrivate: boolean
  }
  setFormData: (data: any) => void
  createAsSubgoal: boolean
  setCreateAsSubgoal: (value: boolean) => void
  parentGoalId?: string
  availableGoals: Goal[]
  availableParameters: Parameter[]
  fetchLatestParameterValue: (parameterId: string) => void
  uploadedImages: UploadedImage[]
  isUploading: boolean
  handleDrop: (e: React.DragEvent) => void
  handleDragOver: (e: React.DragEvent) => void
  removeImage: (index: number) => void
}

export function GoalExtendedSettings({
  showExtended,
  setShowExtended,
  formData,
  setFormData,
  createAsSubgoal,
  setCreateAsSubgoal,
  parentGoalId,
  availableGoals,
  availableParameters,
  fetchLatestParameterValue,
  uploadedImages,
  isUploading,
  handleDrop,
  handleDragOver,
  removeImage,
}: GoalExtendedSettingsProps) {
  const { t } = useTranslation()

  return (
    <div className="border-t pt-4">
      <button
        type="button"
        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all duration-200 ${
          showExtended
            ? "bg-primary/5 border-primary/20 shadow-sm"
            : "bg-muted/30 border-border hover:bg-muted/50 hover:border-muted-foreground/20"
        }`}
        onClick={() => setShowExtended(!showExtended)}
      >
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md transition-colors ${showExtended ? "bg-primary/10" : "bg-muted"}`}>
            <Settings className={`h-4 w-4 transition-colors ${showExtended ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <span className={`font-medium transition-colors ${showExtended ? "text-primary" : "text-foreground"}`}>
            {t("goals.form.extendedSettings", "Erweiterte Einstellungen")}
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${showExtended ? "rotate-180 text-primary" : "text-muted-foreground"}`}
        />
      </button>

      {showExtended && (
        <div className="space-y-4 mt-4 pl-2 border-l-2 border-primary/20">
          <div className="space-y-2">
            <Label htmlFor="unit">{t("goals.form.unit", "Einheit")}</Label>
            <Input
              id="unit"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              placeholder={t("goals.form.unitPlaceholder", "z.B. Patienten, €")}
            />
          </div>

          {/* Parent Goal Selection */}
          {!parentGoalId && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="createAsSubgoal"
                  checked={createAsSubgoal}
                  onCheckedChange={(checked) => setCreateAsSubgoal(!!checked)}
                />
                <Label htmlFor="createAsSubgoal">Als Unterziel erstellen</Label>
              </div>

              {createAsSubgoal && (
                <Select
                  value={formData.parentGoalId}
                  onValueChange={(value) => setFormData({ ...formData, parentGoalId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Übergeordnetes Ziel wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableGoals.map((goal: any) => (
                      <SelectItem key={goal.id} value={goal.id}>
                        {goal.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Parameter Link */}
          <div className="space-y-2">
            <Label htmlFor="linkedParameter">
              <Link className="h-4 w-4 inline mr-2" />
              Mit Kennzahl verknüpfen
            </Label>
            <Select
              value={formData.linkedParameterId}
              onValueChange={(value) => {
                setFormData({ ...formData, linkedParameterId: value })
                if (value && value !== "none") {
                  fetchLatestParameterValue(value)
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kennzahl wählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Keine Verknüpfung</SelectItem>
                {availableParameters.map((param: any) => (
                  <SelectItem key={param.id} value={param.id}>
                    {param.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="isPrivate" className="flex-1">
              {t("goals.form.private", "Privates Ziel")}
              <p className="text-sm text-muted-foreground font-normal">
                {t("goals.form.privateDescription", "Nur Sie und Praxisadministratoren können dieses Ziel sehen")}
              </p>
            </Label>
            <Switch
              id="isPrivate"
              checked={formData.isPrivate}
              onCheckedChange={(checked) => setFormData({ ...formData, isPrivate: checked })}
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Bilder anhängen</Label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
            >
              {isUploading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Wird hochgeladen...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Bilder hier ablegen oder Strg+V zum Einfügen</p>
                </div>
              )}
            </div>

            {uploadedImages.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {uploadedImages.map((img, index) => (
                  <div key={index} className="relative group">
                    <img src={img.url || "/placeholder.svg"} alt={img.fileName} className="w-16 h-16 object-cover rounded border" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
