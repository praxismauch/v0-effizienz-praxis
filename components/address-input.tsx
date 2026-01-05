"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AddressData {
  street: string
  city: string
  zipCode: string
}

interface AddressInputProps {
  value: AddressData | undefined
  onChange: (address: AddressData) => void
  required?: boolean
  disabled?: boolean
}

export function AddressInput({ value, onChange, required = false, disabled = false }: AddressInputProps) {
  const addressValue: AddressData = {
    street: value?.street || "",
    city: value?.city || "",
    zipCode: value?.zipCode || "",
  }

  const handleFieldChange = (field: keyof AddressData, fieldValue: string) => {
    const newAddress = { ...addressValue, [field]: fieldValue }
    onChange(newAddress)
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        <div>
          <Label htmlFor="street">Straße {required && <span className="text-destructive">*</span>}</Label>
          <Input
            id="street"
            value={addressValue.street}
            onChange={(e) => handleFieldChange("street", e.target.value)}
            placeholder="Musterstraße 123"
            disabled={disabled}
            required={required}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="zipCode">Postleitzahl {required && <span className="text-destructive">*</span>}</Label>
            <Input
              id="zipCode"
              value={addressValue.zipCode}
              onChange={(e) => {
                // Only allow digits and limit to 5 characters
                const numericValue = e.target.value.replace(/\D/g, "").slice(0, 5)
                handleFieldChange("zipCode", numericValue)
              }}
              placeholder="12345"
              disabled={disabled}
              required={required}
              maxLength={5}
              pattern="\d{5}"
            />
          </div>
          <div>
            <Label htmlFor="city">Stadt {required && <span className="text-destructive">*</span>}</Label>
            <Input
              id="city"
              value={addressValue.city}
              onChange={(e) => handleFieldChange("city", e.target.value)}
              placeholder="Musterstadt"
              disabled={disabled}
              required={required}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddressInput
