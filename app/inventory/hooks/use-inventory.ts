"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { usePractice } from "@/contexts/practice-context"
import { upload } from "@vercel/blob/client"
import type { InventoryItem, Supplier, InventoryBill, InventorySettings } from "../types"

// Helper to calculate file hash
async function calculateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

export function useInventory() {
  const { toast } = useToast()
  const { currentPractice } = usePractice()
  const practiceId = currentPractice?.id

  const [items, setItems] = useState<InventoryItem[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [bills, setBills] = useState<InventoryBill[]>([])
  const [archivedBills, setArchivedBills] = useState<InventoryBill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isBillsLoading, setIsBillsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [extractingBillId, setExtractingBillId] = useState<string | null>(null)
  const [settings, setSettings] = useState<InventorySettings>({
    lowStockThreshold: 10,
    criticalStockThreshold: 5,
    emailNotifications: true,
    pushNotifications: false,
    autoReorder: false,
  })

  const fetchInventory = useCallback(async () => {
    if (!practiceId) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/practices/${practiceId}/inventory`)
      if (response.ok) {
        const data = await response.json()
        setItems(data.items || [])
      }
    } catch (error) {
      console.error("Error fetching inventory:", error)
      toast({
        title: "Fehler",
        description: "Inventar konnte nicht geladen werden",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [practiceId, toast])

  const fetchSuppliers = useCallback(async () => {
    if (!practiceId) return

    try {
      const response = await fetch(`/api/practices/${practiceId}/suppliers`)
      if (response.ok) {
        const data = await response.json()
        setSuppliers(data.suppliers || [])
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error)
    }
  }, [practiceId])

  const fetchBills = useCallback(async () => {
    if (!practiceId) return

    setIsBillsLoading(true)
    try {
      // Fetch active bills
      const response = await fetch(`/api/practices/${practiceId}/inventory/bills`)
      if (response.ok) {
        const data = await response.json()
        setBills(data || [])
      }

      // Fetch archived bills
      const archivedResponse = await fetch(`/api/practices/${practiceId}/inventory/bills?archived=true`)
      if (archivedResponse.ok) {
        const archivedData = await archivedResponse.json()
        setArchivedBills(archivedData || [])
      }
    } catch (error) {
      console.error("Error fetching bills:", error)
    } finally {
      setIsBillsLoading(false)
    }
  }, [practiceId])

  useEffect(() => {
    if (practiceId) {
      fetchInventory()
      fetchSuppliers()
      fetchBills()
    }
  }, [practiceId, fetchInventory, fetchSuppliers, fetchBills])

  const addItem = async (item: Partial<InventoryItem>) => {
    if (!practiceId) return

    try {
      const response = await fetch(`/api/practices/${practiceId}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      })

      if (response.ok) {
        toast({
          title: "Erfolg",
          description: "Artikel wurde hinzugefügt",
        })
        fetchInventory()
        return true
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Artikel konnte nicht hinzugefügt werden",
        variant: "destructive",
      })
    }
    return false
  }

  const updateItem = async (id: string, updates: Partial<InventoryItem>) => {
    if (!practiceId) return

    try {
      const response = await fetch(`/api/practices/${practiceId}/inventory/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        toast({
          title: "Erfolg",
          description: "Artikel wurde aktualisiert",
        })
        fetchInventory()
        return true
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Artikel konnte nicht aktualisiert werden",
        variant: "destructive",
      })
    }
    return false
  }

  const deleteItem = async (id: string) => {
    if (!practiceId) return

    try {
      const response = await fetch(`/api/practices/${practiceId}/inventory/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Erfolg",
          description: "Artikel wurde gelöscht",
        })
        fetchInventory()
        return true
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Artikel konnte nicht gelöscht werden",
        variant: "destructive",
      })
    }
    return false
  }

  const archiveItem = async (id: string) => {
    return updateItem(id, { status: "archived" })
  }

  const restoreItem = async (id: string) => {
    return updateItem(id, { status: "active" })
  }

  // Bill management functions
  const uploadBill = async (file: File) => {
    if (!practiceId) return null

    setIsUploading(true)
    try {
      // Calculate file hash for duplicate detection
      const fileHash = await calculateFileHash(file)

      // Upload to Vercel Blob
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      })

      // Create bill record
      const response = await fetch(`/api/practices/${practiceId}/inventory/bills`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_name: file.name,
          file_url: blob.url,
          file_type: file.type,
          file_size: file.size,
          file_hash: fileHash,
        }),
      })

      if (response.status === 409) {
        const data = await response.json()
        toast({
          title: "Duplikat erkannt",
          description: data.message,
          variant: "destructive",
        })
        return null
      }

      if (!response.ok) {
        throw new Error("Upload fehlgeschlagen")
      }

      const bill = await response.json()
      toast({
        title: "Rechnung hochgeladen",
        description: "Klicken Sie auf 'Analysieren' um die Artikel zu extrahieren",
      })

      fetchBills()
      return bill
    } catch (error) {
      console.error("Error uploading bill:", error)
      toast({
        title: "Fehler",
        description: "Rechnung konnte nicht hochgeladen werden",
        variant: "destructive",
      })
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const extractBill = async (billId: string) => {
    if (!practiceId) return false

    setExtractingBillId(billId)
    try {
      const response = await fetch(`/api/practices/${practiceId}/inventory/bills/${billId}/extract`, {
        method: "POST",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Extraktion fehlgeschlagen")
      }

      toast({
        title: "Analyse abgeschlossen",
        description: "Die Artikel wurden erfolgreich extrahiert",
      })

      fetchBills()
      return true
    } catch (error: any) {
      console.error("Error extracting bill:", error)
      toast({
        title: "Analysefehler",
        description: error.message || "KI-Analyse fehlgeschlagen",
        variant: "destructive",
      })
      return false
    } finally {
      setExtractingBillId(null)
    }
  }

  const applyBillItems = async (billId: string, itemIndices?: number[]) => {
    if (!practiceId) return false

    try {
      const response = await fetch(`/api/practices/${practiceId}/inventory/bills/${billId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items_to_apply: itemIndices }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Übernahme fehlgeschlagen")
      }

      const result = await response.json()
      toast({
        title: "Artikel übernommen",
        description: result.message,
      })

      fetchBills()
      fetchInventory()
      return true
    } catch (error: any) {
      console.error("Error applying bill items:", error)
      toast({
        title: "Fehler",
        description: error.message || "Artikel konnten nicht übernommen werden",
        variant: "destructive",
      })
      return false
    }
  }

  // Statistics calculations
  const stats = {
    totalItems: items.filter((i) => i.status !== "archived").length,
    lowStockItems: items.filter(
      (i) => i.status !== "archived" && i.quantity <= settings.lowStockThreshold && i.quantity > settings.criticalStockThreshold
    ).length,
    criticalStockItems: items.filter(
      (i) => i.status !== "archived" && i.quantity <= settings.criticalStockThreshold
    ).length,
    totalValue: items
      .filter((i) => i.status !== "archived")
      .reduce((sum, i) => sum + (i.quantity * (i.price || 0)), 0),
  }

  return {
    items,
    suppliers,
    bills,
    archivedBills,
    isLoading,
    isBillsLoading,
    isUploading,
    extractingBillId,
    settings,
    setSettings,
    stats,
    fetchInventory,
    fetchSuppliers,
    fetchBills,
    addItem,
    updateItem,
    deleteItem,
    archiveItem,
    restoreItem,
    uploadBill,
    extractBill,
    applyBillItems,
  }
}
