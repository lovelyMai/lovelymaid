export type Item = {
  id: string | number
  [key: string]: any
}

export type ListItem = Item & { name: string }

export type OptionItem = ListItem & { options?: OptionItem[] }

export type DateItem = [number, number, number]

export type EnterKeyHint = 'enter' | 'search' | 'done' | 'go' | 'next' | 'previous' | 'send'
