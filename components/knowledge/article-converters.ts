import type { KnowledgeArticle, MedicalDevice, InventoryItem, WorkEquipment } from "./types"

export function convertDeviceToArticle(device: MedicalDevice): KnowledgeArticle {
  const contentParts = []
  if (device.description) contentParts.push(device.description)
  if (device.manufacturer) contentParts.push(`**Hersteller:** ${device.manufacturer}`)
  if (device.model) contentParts.push(`**Modell:** ${device.model}`)
  if (device.serial_number) contentParts.push(`**Seriennummer:** ${device.serial_number}`)
  if (device.location) contentParts.push(`**Standort:** ${device.location}`)
  if (device.operating_instructions) contentParts.push(`\n**Bedienungsanleitung:**\n${device.operating_instructions}`)
  if (device.cleaning_instructions) contentParts.push(`\n**Reinigungsanleitung:**\n${device.cleaning_instructions}`)
  if (device.maintenance_instructions) contentParts.push(`\n**Wartungsanleitung:**\n${device.maintenance_instructions}`)

  return {
    id: `device-${device.id}`,
    title: device.name,
    content: contentParts.join("\n\n") || "Keine Beschreibung verfügbar.",
    category: "Medizinische Geräte",
    tags: [device.category || "Gerät", device.status || "Aktiv"].filter(Boolean),
    status: "published",
    version: 1,
    created_at: device.created_at,
    updated_at: device.updated_at || device.created_at,
    published_at: device.created_at,
    author_id: "",
    source_type: "device",
    source_link: `/devices?id=${device.id}`,
  }
}

export function convertInventoryToArticle(item: InventoryItem): KnowledgeArticle {
  const contentParts = []
  if (item.description) contentParts.push(item.description)
  if (item.category) contentParts.push(`**Kategorie:** ${item.category}`)
  if (item.unit) contentParts.push(`**Einheit:** ${item.unit}`)
  if (item.current_stock !== undefined) contentParts.push(`**Aktueller Bestand:** ${item.current_stock}`)
  if (item.min_stock !== undefined) contentParts.push(`**Mindestbestand:** ${item.min_stock}`)
  if (item.location) contentParts.push(`**Lagerort:** ${item.location}`)
  if (item.supplier) contentParts.push(`**Lieferant:** ${item.supplier}`)
  if (item.notes) contentParts.push(`\n**Hinweise:**\n${item.notes}`)

  return {
    id: `inventory-${item.id}`,
    title: item.name,
    content: contentParts.join("\n\n") || "Keine Beschreibung verfügbar.",
    category: "Material & Verbrauch",
    tags: [item.category || "Material"].filter(Boolean),
    status: "published",
    version: 1,
    created_at: item.created_at,
    updated_at: item.updated_at || item.created_at,
    published_at: item.created_at,
    author_id: "",
    source_type: "material",
    source_link: `/inventory?id=${item.id}`,
  }
}

export function convertWorkEquipmentToArticle(item: WorkEquipment): KnowledgeArticle {
  const contentParts = []
  if (item.description) contentParts.push(item.description)
  if (item.manufacturer) contentParts.push(`**Hersteller:** ${item.manufacturer}`)
  if (item.serial_number) contentParts.push(`**Seriennummer:** ${item.serial_number}`)
  if (item.category) contentParts.push(`**Kategorie:** ${item.category}`)
  if (item.location) contentParts.push(`**Standort:** ${item.location}`)
  if (item.status) contentParts.push(`**Status:** ${item.status}`)
  if (item.notes) contentParts.push(`\n**Hinweise:**\n${item.notes}`)

  return {
    id: `equipment-${item.id}`,
    title: item.name,
    content: contentParts.join("\n\n") || "Keine Beschreibung verfügbar.",
    category: "Arbeitsmittel",
    tags: [item.category || "Arbeitsmittel", item.status || "Aktiv"].filter(Boolean),
    status: "published",
    version: 1,
    created_at: item.created_at,
    updated_at: item.updated_at || item.created_at,
    published_at: item.created_at,
    author_id: "",
    source_type: "arbeitsmittel",
    source_link: `/arbeitsmittel?id=${item.id}`,
  }
}
