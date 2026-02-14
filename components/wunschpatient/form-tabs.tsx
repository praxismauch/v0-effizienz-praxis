"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import type { WunschpatientFormData } from "./constants"
import { healthConcernOptions, lifestyleOptions, valueOptions, expectationOptions } from "./constants"

interface TabProps {
  formData: WunschpatientFormData
  onChange: (data: WunschpatientFormData) => void
}

function CheckboxGrid({
  options,
  selected,
  idPrefix,
  onToggle,
}: {
  options: string[]
  selected: string[]
  idPrefix: string
  onToggle: (value: string, checked: boolean) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((option) => (
        <div key={option} className="flex items-center space-x-2">
          <Checkbox
            id={`${idPrefix}-${option}`}
            checked={selected.includes(option)}
            onCheckedChange={(checked) => onToggle(option, checked as boolean)}
          />
          <label htmlFor={`${idPrefix}-${option}`} className="text-sm">
            {option}
          </label>
        </div>
      ))}
    </div>
  )
}

export function DemografieTab({ formData, onChange }: TabProps) {
  return (
    <div className="space-y-4 mt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Profilname *</Label>
          <Input
            id="name"
            placeholder="z.B. Gesundheitsbewusster Berufstätiger"
            value={formData.name}
            onChange={(e) => onChange({ ...formData, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="age_range">Altersspanne *</Label>
          <Select value={formData.age_range} onValueChange={(value) => onChange({ ...formData, age_range: value })}>
            <SelectTrigger><SelectValue placeholder="Alter wählen" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="18-25">18-25 Jahre</SelectItem>
              <SelectItem value="26-35">26-35 Jahre</SelectItem>
              <SelectItem value="36-45">36-45 Jahre</SelectItem>
              <SelectItem value="46-55">46-55 Jahre</SelectItem>
              <SelectItem value="56-65">56-65 Jahre</SelectItem>
              <SelectItem value="65+">65+ Jahre</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Geschlecht *</Label>
          <Select value={formData.gender} onValueChange={(value) => onChange({ ...formData, gender: value })}>
            <SelectTrigger><SelectValue placeholder="Geschlecht wählen" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Männlich</SelectItem>
              <SelectItem value="female">Weiblich</SelectItem>
              <SelectItem value="diverse">Divers</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="occupation">Beruf</Label>
          <Input
            id="occupation"
            placeholder="z.B. Manager, Lehrer, Selbstständig"
            value={formData.occupation}
            onChange={(e) => onChange({ ...formData, occupation: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="family_status">Familienstatus</Label>
          <Select value={formData.family_status} onValueChange={(value) => onChange({ ...formData, family_status: value })}>
            <SelectTrigger><SelectValue placeholder="Status wählen" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single</SelectItem>
              <SelectItem value="partnership">In Partnerschaft</SelectItem>
              <SelectItem value="married">Verheiratet</SelectItem>
              <SelectItem value="married_children">Verheiratet mit Kindern</SelectItem>
              <SelectItem value="single_parent">Alleinerziehend</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="location_area">Wohngebiet</Label>
          <Input
            id="location_area"
            placeholder="z.B. Stadtzentrum, Vorort, Ländlich"
            value={formData.location_area}
            onChange={(e) => onChange({ ...formData, location_area: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="archetype">Patienten-Archetyp *</Label>
        <Select value={formData.archetype} onValueChange={(value) => onChange({ ...formData, archetype: value })}>
          <SelectTrigger><SelectValue placeholder="Archetyp wählen" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="prevention">Der Präventionsorientierte</SelectItem>
            <SelectItem value="chronic">Der chronische Patient</SelectItem>
            <SelectItem value="performance">{"Der Leistungsorientierte (Sport, Business, Biohacker)"}</SelectItem>
            <SelectItem value="acute">{"Der Akut-Patient (schnelle Hilfe)"}</SelectItem>
            <SelectItem value="relationship">{"Der Beziehungstyp (feste Bindung)"}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export function GesundheitTab({ formData, onChange }: TabProps) {
  const toggleHealth = (value: string, checked: boolean) => {
    const updated = checked
      ? [...formData.health_concerns, value]
      : formData.health_concerns.filter((v) => v !== value)
    onChange({ ...formData, health_concerns: updated })
  }

  return (
    <div className="space-y-4 mt-4">
      <div>
        <Label className="text-base">Gesundheitsthemen / Beschwerden</Label>
        <p className="text-sm text-muted-foreground mb-3">
          Welche gesundheitlichen Themen sind für diesen Patienten relevant?
        </p>
        <CheckboxGrid options={healthConcernOptions} selected={formData.health_concerns} idPrefix="health" onToggle={toggleHealth} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Gesundheitsbewusstsein</Label>
          <Select value={formData.health_consciousness} onValueChange={(value) => onChange({ ...formData, health_consciousness: value })}>
            <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="very_high">{"Sehr hoch (aktiv, informiert)"}</SelectItem>
              <SelectItem value="high">{"Hoch (interessiert)"}</SelectItem>
              <SelectItem value="medium">{"Mittel (bei Bedarf)"}</SelectItem>
              <SelectItem value="low">{"Niedrig (passiv)"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Prävention vs. Akutmedizin</Label>
          <Select value={formData.prevention_vs_acute} onValueChange={(value) => onChange({ ...formData, prevention_vs_acute: value })}>
            <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="prevention_focused">Stark präventionsorientiert</SelectItem>
              <SelectItem value="balanced">Ausgeglichen</SelectItem>
              <SelectItem value="acute_focused">Primär bei Beschwerden</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Interessante Leistungen</Label>
        <Textarea
          placeholder="z.B. Check-ups, Vorsorge, Coaching, Naturheilkunde (kommagetrennt)"
          value={formData.services_interested}
          onChange={(e) => onChange({ ...formData, services_interested: e.target.value })}
        />
      </div>
    </div>
  )
}

export function VerhaltenTab({ formData, onChange }: TabProps) {
  const toggleLifestyle = (value: string, checked: boolean) => {
    const updated = checked
      ? [...formData.lifestyle_factors, value]
      : formData.lifestyle_factors.filter((v) => v !== value)
    onChange({ ...formData, lifestyle_factors: updated })
  }

  return (
    <div className="space-y-4 mt-4">
      <div>
        <Label className="text-base">Lebensstil-Faktoren</Label>
        <p className="text-sm text-muted-foreground mb-3">
          Welche Lebensstil-Merkmale treffen auf diesen Patienten zu?
        </p>
        <CheckboxGrid options={lifestyleOptions} selected={formData.lifestyle_factors} idPrefix="lifestyle" onToggle={toggleLifestyle} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Bevorzugte Kommunikation</Label>
          <Select value={formData.communication_preference} onValueChange={(value) => onChange({ ...formData, communication_preference: value })}>
            <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="digital">{"Digital (App, E-Mail, Chat)"}</SelectItem>
              <SelectItem value="phone">Telefon</SelectItem>
              <SelectItem value="in_person">Persönlich vor Ort</SelectItem>
              <SelectItem value="mixed">Gemischt</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Transportmittel zur Praxis</Label>
          <Input
            placeholder="z.B. Auto, ÖPNV, Fahrrad"
            value={formData.transport_method}
            onChange={(e) => onChange({ ...formData, transport_method: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Finanzielle Bereitschaft für IGeL</Label>
        <Select value={formData.financial_willingness} onValueChange={(value) => onChange({ ...formData, financial_willingness: value })}>
          <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="very_high">{"Sehr hoch (investiert gerne in Gesundheit)"}</SelectItem>
            <SelectItem value="high">{"Hoch (bei klarem Nutzen)"}</SelectItem>
            <SelectItem value="medium">{"Mittel (selektiv)"}</SelectItem>
            <SelectItem value="low">{"Niedrig (primär Kassenleistungen)"}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export function WerteTab({ formData, onChange }: TabProps) {
  const toggleValue = (value: string, checked: boolean) => {
    const updated = checked ? [...formData.values, value] : formData.values.filter((v) => v !== value)
    onChange({ ...formData, values: updated })
  }

  const toggleExpectation = (value: string, checked: boolean) => {
    const updated = checked
      ? [...formData.expectations, value]
      : formData.expectations.filter((v) => v !== value)
    onChange({ ...formData, expectations: updated })
  }

  return (
    <div className="space-y-4 mt-4">
      <div>
        <Label className="text-base">Wichtige Werte</Label>
        <p className="text-sm text-muted-foreground mb-3">Was ist diesem Patienten besonders wichtig?</p>
        <CheckboxGrid options={valueOptions} selected={formData.values} idPrefix="value" onToggle={toggleValue} />
      </div>
      <div>
        <Label className="text-base">Erwartungen an die Praxis</Label>
        <p className="text-sm text-muted-foreground mb-3">
          Welche Erwartungen hat dieser Patient an Ihre Praxis?
        </p>
        <CheckboxGrid options={expectationOptions} selected={formData.expectations} idPrefix="expectation" onToggle={toggleExpectation} />
      </div>
    </div>
  )
}
