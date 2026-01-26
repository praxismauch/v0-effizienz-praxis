"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { usePractice } from "@/contexts/practice-context"
import type { InventoryItem, Supplier, Bill, InventorySettings } from "../types"

export function useInventory() {
  const { toast } = useToast()
  const { currentPractice } = usePractice()
  const practiceId = currentPractice?.id

  const [items, setItems] = useState<InventoryItem[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [bills, setBills] = useState<Bill[]>([])
  const [isLoading, setIsLoading] = useState(true)
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

    try {
      const response = await fetch(`/api/practices/${practiceId}/inventory-bills`)
      if (response.ok) {
        const data = await response.json()
        setBills(data.bills || [])
      }
    } catch (error) {
      console.error("Error fetching bills:", error)
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
    isLoading,
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
  }
}
