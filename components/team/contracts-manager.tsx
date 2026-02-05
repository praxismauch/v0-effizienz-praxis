"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar, Edit, Trash2, Infinity, TrendingUp, FileText, Download, Eye, Palmtree, Sun, Coins, Copy } from "lucide-react"
import { usePractice } from "@/contexts/practice-context"
import { CreateContractDialog } from "@/components/team/create-contract-dialog"
import { EditContractDialog } from "@/components/team/edit-contract-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"

interface AdditionalPayment {
  id: string
  name: string
  amount: number
  frequency: "monthly" | "yearly" | "one-time"
}

interface Contract {
  id: string
  team_member_id: string
  contract_type: string
  start_date: string
  end_date: string | null
  hours_per_week: number | null
  salary: number | null
  salary_currency: string
  bonus_personal_goal: number | null
  bonus_practice_goal: number | null
  bonus_employee_discussion: number | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  has_13th_salary?: boolean
  vacation_bonus?: number | null
  additional_payments?: AdditionalPayment[]
  holiday_days_fulltime?: number
  working_days_fulltime?: number
}

interface ContractsManagerProps {
  memberId: string
  memberName: string
  practiceId: string
}

function calculateHolidayDays(contract: Contract): number {
  const hoursPerWeek = contract.hours_per_week || 0
  const workingDaysFulltime = contract.working_days_fulltime || 5
  const holidayDaysFulltime = contract.holiday_days_fulltime || 30

  if (hoursPerWeek <= 0 || workingDaysFulltime <= 0) return 0

  const fullTimeHoursPerWeek = workingDaysFulltime * 8
  const workingDaysPartTime = (hoursPerWeek / fullTimeHoursPerWeek) * workingDaysFulltime

  return Math.ceil((workingDaysPartTime / workingDaysFulltime) * holidayDaysFulltime)
}

export function ContractsManager({ memberId, memberName, practiceId }: ContractsManagerProps) {
  const { currentPractice } = usePractice()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingContract, setEditingContract] = useState<Contract | null>(null)
  const [contractFiles, setContractFiles] = useState<Record<string, any[]>>({})
  const [previewFile, setPreviewFile] = useState<any | null>(null)
  const [contractToDelete, setContractToDelete] = useState<{ id: string; type: string } | null>(null)

  // Use prop practiceId or fall back to context
  const effectivePracticeId = practiceId || currentPractice?.id

  useEffect(() => {
    if (effectivePracticeId) {
      loadContracts()
    }
  }, [effectivePracticeId, memberId])

  useEffect(() => {
    if (contracts.length === 0 || !effectivePracticeId) return
    
    let isCancelled = false
    const controller = new AbortController()
    
    const loadAllFiles = async () => {
      // Fetch all contract files in parallel (limited by browser connection pool)
      const results = await Promise.allSettled(
        contracts.map(async (contract) => {
          try {
            const res = await fetch(
              `/api/practices/${effectivePracticeId}/contracts/${contract.id}/files`,
              { signal: controller.signal }
            )
            if (res.ok) {
              return { contractId: contract.id, files: await res.json() }
            }
            return { contractId: contract.id, files: [] }
          } catch {
            return { contractId: contract.id, files: [] }
          }
        })
      )
      
      if (!isCancelled) {
        const filesMap: Record<string, any[]> = {}
        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            filesMap[result.value.contractId] = result.value.files
          }
        })
        setContractFiles(filesMap)
      }
    }
    
    loadAllFiles()
    
    return () => {
      isCancelled = true
      controller.abort()
    }
  }, [contracts, effectivePracticeId])

  const loadContracts = async () => {
    if (!effectivePracticeId) return

    try {
      setLoading(true)
      const res = await fetch(`/api/practices/${effectivePracticeId}/contracts?teamMemberId=${memberId}`)
      if (res.ok) {
        const data = await res.json()
        setContracts(data)
      }
    } catch (error) {
      console.error("Error loading contracts:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteContract = async (contractId: string) => {
    if (!effectivePracticeId) return

    try {
      const res = await fetch(`/api/practices/${effectivePracticeId}/contracts/${contractId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setContracts((prev) => prev.filter((c) => c.id !== contractId))
      }
    } catch (error) {
      console.error("Error deleting contract:", error)
    }
    setContractToDelete(null)
  }

  const handleContractCreated = (newContract: Contract) => {
    // If new contract is active, deactivate others
    if (newContract.is_active) {
      setContracts((prev) => [newContract, ...prev.map(c => ({ ...c, is_active: false }))])
    } else {
      setContracts((prev) => [newContract, ...prev])
    }
    setShowCreateDialog(false)
  }

  const handleDuplicateContract = async (contract: Contract) => {
    if (!effectivePracticeId) return

    try {
      // Create a copy of the contract without id, timestamps, and set as inactive
      const duplicateData = {
        team_member_id: contract.team_member_id,
        contract_type: contract.contract_type,
        start_date: new Date().toISOString().split('T')[0], // Today's date
        end_date: contract.end_date,
        hours_per_week: contract.hours_per_week,
        salary: contract.salary,
        salary_currency: contract.salary_currency,
        bonus_personal_goal: contract.bonus_personal_goal,
        bonus_practice_goal: contract.bonus_practice_goal,
        bonus_employee_discussion: contract.bonus_employee_discussion,
        notes: contract.notes,
        is_active: false, // Duplicate is inactive by default
        has_13th_salary: contract.has_13th_salary,
        vacation_bonus: contract.vacation_bonus,
        additional_payments: contract.additional_payments,
        holiday_days_fulltime: contract.holiday_days_fulltime,
        working_days_fulltime: contract.working_days_fulltime,
      }

      const res = await fetch(`/api/practices/${effectivePracticeId}/contracts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(duplicateData),
      })

      if (res.ok) {
        const newContract = await res.json()
        setContracts((prev) => [newContract, ...prev])
        toast({
          title: "Vertrag dupliziert",
          description: "Der Vertrag wurde erfolgreich kopiert. Der neue Vertrag ist inaktiv.",
        })
      } else {
        throw new Error("Failed to duplicate contract")
      }
    } catch (error) {
      console.error("Error duplicating contract:", error)
      toast({
        title: "Fehler",
        description: "Der Vertrag konnte nicht dupliziert werden",
        variant: "destructive",
      })
    }
  }

  const handleStatusChange = async (contractId: string, newStatus: "active" | "inactive") => {
    if (!effectivePracticeId) return

    try {
      const isActive = newStatus === "active"
      
      // Update the contract status
      const res = await fetch(`/api/practices/${effectivePracticeId}/contracts/${contractId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: isActive }),
      })

      if (!res.ok) {
        toast({
          title: "Fehler",
          description: "Status konnte nicht geändert werden",
          variant: "destructive",
        })
        return
      }

      // If activating this contract, deactivate all others
      if (isActive) {
        // Deactivate all other contracts
        const otherContracts = contracts.filter(c => c.id !== contractId && c.is_active)
        await Promise.all(
          otherContracts.map(c =>
            fetch(`/api/practices/${effectivePracticeId}/contracts/${c.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ is_active: false }),
            })
          )
        )
        
        // Update local state - activate this one, deactivate others
        setContracts((prev) =>
          prev.map((c) => ({
            ...c,
            is_active: c.id === contractId,
          }))
        )
      } else {
        // Just deactivate this contract
        setContracts((prev) =>
          prev.map((c) =>
            c.id === contractId ? { ...c, is_active: false } : c
          )
        )
      }

      toast({
        title: "Status geändert",
        description: isActive ? "Vertrag ist jetzt aktiv" : "Vertrag ist jetzt inaktiv",
      })
    } catch (error) {
      console.error("Error changing contract status:", error)
      toast({
        title: "Fehler",
        description: "Status konnte nicht geändert werden",
        variant: "destructive",
      })
    }
  }

  const calculateHourlyRate = (contract: Contract): number | null => {
    if (!contract.salary || !contract.hours_per_week) return null

    // Calculate monthly hours (assuming 4.33 weeks per month on average)
    const monthlyHours = contract.hours_per_week * 4.33

    // Calculate hourly rate
    const hourlyRate = contract.salary / monthlyHours

    return Math.round(hourlyRate * 100) / 100 // Round to 2 decimal places
  }

  const calculateHourlyRateWith100Bonus = (contract: Contract): number | null => {
    if (!contract.salary || !contract.hours_per_week) return null

    const totalBonusPercentage =
      (contract.bonus_personal_goal || 0) +
      (contract.bonus_practice_goal || 0) +
      (contract.bonus_employee_discussion || 0)
    const salaryWith100Bonus = (contract.salary || 0) + (totalBonusPercentage / 100) * (contract.salary || 0)

    // Calculate monthly hours (assuming 4.33 weeks per month on average)
    const monthlyHours = contract.hours_per_week * 4.33

    // Calculate hourly rate with 100% bonus
    const hourlyRateWith100Bonus = salaryWith100Bonus / monthlyHours

    return Math.round(hourlyRateWith100Bonus * 100) / 100 // Round to 2 decimal places
  }

  const getContractTypeLabel = (type: string) => {
    switch (type) {
      case "full-time":
        return "Vollzeit"
      case "part-time":
        return "Teilzeit"
      case "temporary":
        return "Befristet"
      case "freelance":
        return "Freiberuflich"
      default:
        return type
    }
  }

  const isContractActive = (contract: Contract) => {
    const now = new Date()
    const start = new Date(contract.start_date)
    const end = contract.end_date ? new Date(contract.end_date) : null
    return start <= now && (!end || end >= now)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="animate-pulse">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Lade Verträge...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Verträge</h3>
        <Button onClick={() => setShowCreateDialog(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Neuer Vertrag
        </Button>
      </div>

      {contracts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">Noch keine Verträge vorhanden</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ersten Vertrag erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {contracts.map((contract) => {
            const active = isContractActive(contract)
            const files = contractFiles[contract.id] || []
            const holidayDays = calculateHolidayDays(contract)

            return (
              <Card key={contract.id} className={`group ${active ? "border-primary" : ""}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={contract.is_active ? "default" : "secondary"}>
                        {getContractTypeLabel(contract.contract_type)}
                      </Badge>
                      <Select
                        value={contract.is_active ? "active" : "inactive"}
                        onValueChange={(value: "active" | "inactive") => handleStatusChange(contract.id, value)}
                      >
                        <SelectTrigger className={`w-[100px] h-7 text-xs ${contract.is_active ? "text-green-600 border-green-600" : "text-muted-foreground"}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active" className="text-green-600">
                            Aktiv
                          </SelectItem>
                          <SelectItem value="inactive" className="text-muted-foreground">
                            Inaktiv
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {!contract.end_date && (
                        <Badge variant="outline" className="text-blue-600 border-blue-600">
                          <Infinity className="h-3 w-3 mr-1" />
                          Unbefristet
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" onClick={() => setEditingContract(contract)} title="Bearbeiten">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDuplicateContract(contract)} title="Duplizieren">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setContractToDelete({ id: contract.id, type: getContractTypeLabel(contract.contract_type) })
                        }
                        className="text-destructive hover:text-destructive"
                        title="Löschen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Zeitraum</p>
                      <p className="font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(contract.start_date)} -{" "}
                        {contract.end_date ? formatDate(contract.end_date) : "Unbefristet"}
                      </p>
                    </div>
                    {contract.hours_per_week && (
                      <div>
                        <p className="text-muted-foreground">Stunden/Woche</p>
                        <p className="font-medium">{contract.hours_per_week}h</p>
                      </div>
                    )}
                    {contract.salary && (
                      <div>
                        <p className="text-muted-foreground">Gehalt</p>
                        <p className="font-medium">
                          {contract.salary.toLocaleString("de-DE")} {contract.salary_currency}
                        </p>
                      </div>
                    )}
                    {calculateHourlyRate(contract) && (
                      <div>
                        <p className="text-muted-foreground">Stundenlohn</p>
                        <p className="font-medium">
                          {calculateHourlyRate(contract)?.toLocaleString("de-DE")} {contract.salary_currency}/Std.
                        </p>
                      </div>
                    )}
                    {calculateHourlyRateWith100Bonus(contract) && (
                      <div>
                        <p className="text-muted-foreground">Eff. Stundenlohn</p>
                        <p className="font-medium text-blue-600">
                          {calculateHourlyRateWith100Bonus(contract)?.toLocaleString("de-DE")} {contract.salary_currency}/Std.
                        </p>
                      </div>
                    )}
                    {contract.hours_per_week && (
                      <div>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Palmtree className="h-3 w-3" />
                          Urlaubsanspruch
                        </p>
                        <p className="font-medium text-green-600">{holidayDays} Tage/Jahr</p>
                      </div>
                    )}
                  </div>

                  {(contract.bonus_personal_goal ||
                    contract.bonus_practice_goal ||
                    contract.bonus_employee_discussion ||
                    contract.has_13th_salary ||
                    contract.vacation_bonus) && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                        <TrendingUp className="h-3 w-3" />
                        Bonus-Anteile
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {contract.bonus_personal_goal && (
                          <Badge variant="outline">
                            Persönlich: {contract.bonus_personal_goal}%
                            {contract.salary && (
                              <span className="ml-1 text-muted-foreground">
                                ({((contract.salary * contract.bonus_personal_goal) / 100).toLocaleString("de-DE")} {contract.salary_currency})
                              </span>
                            )}
                          </Badge>
                        )}
                        {contract.bonus_practice_goal && (
                          <Badge variant="outline">
                            Praxis: {contract.bonus_practice_goal}%
                            {contract.salary && (
                              <span className="ml-1 text-muted-foreground">
                                ({((contract.salary * contract.bonus_practice_goal) / 100).toLocaleString("de-DE")} {contract.salary_currency})
                              </span>
                            )}
                          </Badge>
                        )}
                        {contract.bonus_employee_discussion && (
                          <Badge variant="outline">
                            Gespräch: {contract.bonus_employee_discussion}%
                            {contract.salary && (
                              <span className="ml-1 text-muted-foreground">
                                ({((contract.salary * contract.bonus_employee_discussion) / 100).toLocaleString("de-DE")} {contract.salary_currency})
                              </span>
                            )}
                          </Badge>
                        )}
                        {contract.has_13th_salary && (
                          <Badge variant="outline" className="text-amber-600 border-amber-600">
                            13. Gehalt
                          </Badge>
                        )}
                        {contract.vacation_bonus && (
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            <Sun className="h-3 w-3 mr-1" />
                            Urlaubsgeld: {contract.vacation_bonus.toLocaleString("de-DE")} {contract.salary_currency}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {contract.additional_payments && contract.additional_payments.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                        <Coins className="h-3 w-3" />
                        Zusatzzahlungen
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {contract.additional_payments.map((payment) => (
                          <Badge key={payment.id} variant="outline" className="text-purple-600 border-purple-600">
                            {payment.name}: {payment.amount.toLocaleString("de-DE")} {contract.salary_currency}
                            {payment.frequency === "monthly" && "/Monat"}
                            {payment.frequency === "yearly" && "/Jahr"}
                            {payment.frequency === "one-time" && " (einmalig)"}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {files.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                        <FileText className="h-3 w-3" />
                        Dokumente ({files.length})
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {files.map((file: any) => (
                          <Button
                            key={file.id}
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs bg-transparent"
                            onClick={() => setPreviewFile(file)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            {file.file_name.length > 20 ? file.file_name.substring(0, 20) + "..." : file.file_name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {contract.notes && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-muted-foreground">Notizen</p>
                      <p className="text-sm">{contract.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <CreateContractDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        teamMemberId={memberId}
        memberName={memberName}
        onContractCreated={handleContractCreated}
        existingContracts={contracts}
      />

      {editingContract && (
        <EditContractDialog
          open={!!editingContract}
          onOpenChange={(open) => !open && setEditingContract(null)}
          contract={editingContract}
          memberName={memberName}
          onContractUpdated={(updated) => {
            setContracts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
            setEditingContract(null)
          }}
        />
      )}

      <ConfirmDeleteDialog
        open={!!contractToDelete}
        onOpenChange={() => setContractToDelete(null)}
        onConfirm={() => contractToDelete && handleDeleteContract(contractToDelete.id)}
        title="Vertrag löschen"
        description={`Möchten Sie den ${contractToDelete?.type}-Vertrag wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
      />

      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{previewFile?.file_name}</DialogTitle>
          </DialogHeader>
          {previewFile?.file_type?.includes("image") ? (
            <img
              src={previewFile?.file_url || "/placeholder.svg"}
              alt={previewFile?.file_name}
              className="max-w-full max-h-[70vh] object-contain mx-auto"
            />
          ) : previewFile?.file_type?.includes("pdf") ? (
            <iframe src={previewFile?.file_url} title={previewFile?.file_name} className="w-full h-[70vh]" />
          ) : (
            <div className="text-center py-8">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Vorschau nicht verfügbar</p>
              <Button className="mt-4" onClick={() => window.open(previewFile?.file_url, "_blank")}>
                <Download className="h-4 w-4 mr-2" />
                Herunterladen
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
