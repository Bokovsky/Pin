export interface Link {
  id: string
  title: string
  url: string
  description: string
  backup_url: string
  sort_order: number
  status: "" | "ok" | "fail" | "pending"
}

export interface Category {
  id: string
  name: string
  description: string
  sort_order: number
  links: Link[]
  children: Category[]
}

export interface NavData {
  categories: Category[]
}

export interface ReorderItem {
  id: string
  sort_order: number
}

export interface CheckResult {
  id: string
  status: string
}
