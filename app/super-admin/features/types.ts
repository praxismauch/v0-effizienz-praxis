export interface FeatureFlag {
  id: string
  feature_key: string
  feature_name: string
  feature_type: "frontend" | "backend"
  parent_key: string | null
  icon_name: string | null
  route_path: string | null
  is_enabled: boolean
  is_beta: boolean
  is_protected: boolean
  allow_practice_override: boolean
  display_order: number
  description: string | null
  created_at: string
  updated_at: string
  updated_by: string | null
}

export interface Practice {
  id: string
  name: string
}

export interface PracticeOverride {
  is_enabled: boolean | null
  is_beta: boolean | null
}

export interface FeatureGroup {
  feature: FeatureFlag
  children: FeatureFlag[]
}
