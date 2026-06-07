import fs from "fs/promises"
import path from "path"
import crypto from "crypto"

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

const DATA_DIR = path.resolve(process.cwd(), "data")
const DATA_FILE = path.join(DATA_DIR, "links.json")
const TMP_FILE = DATA_FILE + ".tmp"

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true })
}

export async function readData(): Promise<NavData> {
  await ensureDataDir()
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8")
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.categories)) {
      return parsed as NavData
    }
    return emptyData()
  } catch {
    return emptyData()
  }
}

export async function writeData(data: NavData): Promise<void> {
  await ensureDataDir()
  const content = JSON.stringify(data, null, 2)
  await fs.writeFile(TMP_FILE, content, "utf-8")
  try {
    await fs.rename(TMP_FILE, DATA_FILE)
  } catch {
    await fs.rm(TMP_FILE, { force: true })
    throw new Error("Failed to write data file")
  }
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function emptyData(): NavData {
  return { categories: [] }
}
