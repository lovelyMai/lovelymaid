import type { Item } from '@/modules/types/item'

export type FileItem = Item & { file: File; loading?: boolean }
