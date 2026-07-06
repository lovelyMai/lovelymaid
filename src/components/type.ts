export type Item = {
  id: string,
  [key: string]: any
}

export type ListItem = Item & { name: string }

export type OptionItem = ListItem & { options?: OptionItem[] }