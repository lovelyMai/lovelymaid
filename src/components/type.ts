export type Item = {
  id: string,
  [key: string]: any
}

export type Option = {
  id: string,
  name: string,
  options?: Option[],
  [key: string]: any
}