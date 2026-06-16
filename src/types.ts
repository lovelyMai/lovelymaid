export type FormItem = {
  id: string
  name: string
  type?: 'text' | 'password'
  value?: string
  placeholder?: string
  enterkeyhint?: "enter" | "search" | "done" | "go" | "next" | "previous" | "send"
  width?: string
  onChange?: (newValue: string) => void
  onEnter?: (inputValue: string) => void
}