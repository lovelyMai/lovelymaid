import type { Item } from '@/modules/types'

export type FileItem = Item & { file: File; loading?: boolean }
