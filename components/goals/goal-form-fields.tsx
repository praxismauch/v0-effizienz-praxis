import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useTranslation } from "@/contexts/translation-context"
import OrgaCategorySelect from "@/components/orga-category-select"

interface GoalFormFieldsProps {
  formData: {
    title: string
    description: string
    goalType: "practice" | "personal" | "team"
    currentValue: string
    targetValue: string
    unit: string
    progressPercentage: string
    priority: "low" | "medium" | "high"
    startDate: string
    endDate: string
    category: string
  }
  setFormData: (data: any) => void
  calculatedProgress: number | null
  orgaCategories: any[]
}

export function GoalFormFields({
  formData,
  setFormData,
  calculatedProgress,
  orgaCategories,
}: GoalFormFieldsProps) {
  const { t } = useTranslation()

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="title">{t("goals.form.title", "Titel")} *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t("goals.form.description", "Beschreibung")}</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="goalType">{t("goals.form.goalType", "Zieltyp")}</Label>
          <Select
            value={formData.goalType}
            onValueChange={(value: any) => setFormData({ ...formData, goalType: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="personal">{t("goals.type.personal", "Persönlich")}</SelectItem>
              <SelectItem value="team">{t("goals.type.team", "Team")}</SelectItem>
              <SelectItem value="practice">{t("goals.type.practice", "Praxis")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">{t("goals.form.priority", "Priorität")}</Label>
          <Select
            value={formData.priority}
            onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">{t("goals.priority.low", "Niedrig")}</SelectItem>
              <SelectItem value="medium">{t("goals.priority.medium", "Mittel")}</SelectItem>
              <SelectItem value="high">{t("goals.priority.high", "Hoch")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="currentValue">{t("goals.form.currentValue", "Aktueller Wert")}</Label>
          <Input
            id="currentValue"
            type="number"
            step="any"
            value={formData.currentValue}
            onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
            placeholder="z.B. 5"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetValue">{t("goals.form.targetValue", "Zielwert")} *</Label>
          <Input
            id="targetValue"
            type="number"
            step="any"
            value={formData.targetValue}
            onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
            required
            placeholder="z.B. 10"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit">{t("goals.form.unit", "Einheit")} *</Label>
          <Input
            id="unit"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            required
            placeholder="z.B. Stunden, %, kg"
          />
        </div>
      </div>

      {calculatedProgress === null && (
        <div className="space-y-2">
          <Label htmlFor="progress">{t("goals.form.progress", "Fortschritt (%)")}</Label>
          <Input
            id="progress"
            type="number"
            min="0"
            max="100"
            value={formData.progressPercentage}
            onChange={(e) => setFormData({ ...formData, progressPercentage: e.target.value })}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Startdatum</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">Enddatum</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          />
        </div>
      </div>

      <OrgaCategorySelect
        value={formData.category}
        onValueChange={(value) => setFormData({ ...formData, category: value })}
        categories={orgaCategories}
        showLabel={true}
        label="Kategorie"
      />
    </>
  )
}
