import { DateItem } from "@/components/type"

// 通用防抖函数
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: number | undefined
  return function (this: any, ...args: Parameters<T>) {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      fn.apply(this, args)
      timer = undefined
    }, delay)
  }
}

// 通用节流函数
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  interval: number
): (...args: Parameters<T>) => void {
  let timer: number | undefined
  return function (this: any, ...args: Parameters<T>) {
    if (timer) return
    timer = setTimeout(() => timer = undefined, interval)
    fn.apply(this, args)
  }
}

// 观察 DOM
export function watchDOM(
  element: HTMLElement,
  callback: (size: { width: number; height: number }) => void
): () => void {
  callback({
    width: element.offsetWidth,
    height: element.offsetHeight
  })
  const observer = new ResizeObserver(() => {
    callback({
      width: element.offsetWidth,
      height: element.offsetHeight
    })
  })
  observer.observe(element)

  return () => observer.disconnect()
}

// 清理定时器
export const clearTimer = (...args: (number | undefined)[]) => {
  args.forEach(timer => {
    if (timer) {
      clearInterval(timer)
      clearTimeout(timer)
    }
  })
}

// 格式化时间
export function formatDate(date: number | Date): DateItem {
  const d = typeof date === 'number' ? new Date(date) : date
  return [d.getFullYear(), d.getMonth() + 1, d.getDate()]
}

// 验证 DateItem 是否合法
export function verifyDate(date: DateItem): boolean {
  // 闰年判断
  function isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  }
  const [year, month, day] = date
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false
  if (month < 1 || month > 12) return false
  const daysInMonth = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  return day >= 1 && day <= daysInMonth[month - 1]
}