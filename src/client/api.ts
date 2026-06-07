import type { NavData, Category, Link, ReorderItem, CheckResult } from "./types"

const BASE = "/api"

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE + url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail ? `${body.error}: ${body.detail}` : (body.error || `Request failed (${res.status})`))
  }
  return res.json()
}

export async function fetchNav(): Promise<NavData> {
  return request<NavData>("/nav")
}

export async function createCategory(data: Partial<Category>): Promise<Category> {
  return request<Category>("/category", { method: "POST", body: JSON.stringify(data) })
}

export async function updateCategory(id: string, data: Partial<Category>): Promise<Category> {
  return request<Category>(`/category/${id}`, { method: "PUT", body: JSON.stringify(data) })
}

export async function deleteCategory(id: string): Promise<void> {
  await request(`/category/${id}`, { method: "DELETE" })
}

export async function createLink(categoryId: string, link: Omit<Link, "id" | "status">): Promise<Link> {
  return request<Link>("/link", { method: "POST", body: JSON.stringify({ categoryId, link }) })
}

export async function updateLink(id: string, data: Partial<Link>): Promise<Link> {
  return request<Link>(`/link/${id}`, { method: "PUT", body: JSON.stringify(data) })
}

export async function deleteLink(id: string): Promise<void> {
  await request(`/link/${id}`, { method: "DELETE" })
}

export async function checkLinks(): Promise<CheckResult[]> {
  return request<CheckResult[]>("/check", { method: "POST" })
}

export async function reorderLinks(items: ReorderItem[]): Promise<void> {
  await request("/reorder", { method: "POST", body: JSON.stringify(items) })
}

export async function importData(data: NavData): Promise<void> {
  await request("/import", { method: "POST", body: JSON.stringify(data) })
}
