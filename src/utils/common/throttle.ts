// 通用节流函数
function throttle<T extends (...args: any[]) => any>(
  fn: T,
  interval: number
): (...args: Parameters<T>) => void {
  let timer: number | undefined 
  return function (this: any, ...args: Parameters<T>) {
    if (!timer) {
      timer = setTimeout(() => timer = undefined, interval)
      fn.apply(this, args)
    }
  }
}

export default throttle