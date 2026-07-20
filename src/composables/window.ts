import { reactive, ref, type Ref } from 'vue'

export type WindowManager = {
  readonly visible: boolean
  readonly position: [number, number]
  open: () => void
  close: () => void
  cleanup: () => void
}

export const createWindowManager = (TriggerEl: HTMLElement, MenuRef: Ref<HTMLElement | null>, type: 'fixed' | 'flex' = 'fixed', method: 'click' | 'contextmenu' = 'click'): WindowManager => {
  const visible = ref<boolean>(false)
  const position = ref<[number, number]>([0, 0])
  const calcPos = (e?: MouseEvent) => {
    let X: number = 0
    let Y: number = 0
    if (type === 'fixed') {
      const rect = TriggerEl.getBoundingClientRect()
      const offsetX = window.visualViewport?.offsetLeft ?? 0
      const offsetY = window.visualViewport?.offsetTop ?? 0
      X = rect.left + Math.min(rect.width, rect.height) / 2 + offsetX
      Y = rect.top + rect.height + 2 + offsetY
    } else {
      if (!e) {
        console.error('flex 模式下 open 必须传入 event 事件对象')
        return
      }
      X = e.clientX
      Y = e.clientY
    }
    position.value = [X, Y]
  }
  const open = (e?: MouseEvent) => {
    calcPos(e)
    visible.value = true
    document.documentElement.style.overflow = 'hidden'
    document.addEventListener('click', onDocClick, true)
  }
  const onTrigger = (e: MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    open(e)
  }
  if (method === 'click') {
    TriggerEl.addEventListener('click', onTrigger)
  } else {
    TriggerEl.addEventListener('contextmenu', onTrigger)
  }
  const close = () => {
    if (!visible.value) return
    visible.value = false
    document.documentElement.style.overflow = ''
    document.removeEventListener('click', onDocClick, true)
  }
  const onDocClick = (e: MouseEvent) => {
    if (!MenuRef.value) return
    if (MenuRef.value.contains(e.target as HTMLElement)) return
    e.stopPropagation()
    close()
  }
  const cleanup = () => {
    TriggerEl.removeEventListener('click', onTrigger)
    TriggerEl.removeEventListener('contextmenu', onTrigger)
    document.removeEventListener('click', onDocClick, true)
  }

  return reactive({ visible, position, open, close, cleanup })
}