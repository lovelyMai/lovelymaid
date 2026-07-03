export type Option = {
  id: string,
  name: string,
  options?: Option[],
  [key: string]: any
}