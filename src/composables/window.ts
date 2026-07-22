import { nextTick, reactive, ref, type Ref } from 'vue'

import { getLayoutLeft, getLayoutTop } from '@/utils/getLayoutOffset'

export type WindowManager = {
  readonly visible: boolean
  readonly position: [number, number]
  open: () => void
  close: () => void
  cleanup: () => void
}

export const createWindowManager = (TriggerEl: HTMLElement, WindowRef: Ref<HTMLElement | null>, type: 'fixed' | 'flex' = 'fixed', method: 'click' | 'contextmenu' = 'click'): WindowManager => {
  const visible = ref<boolean>(false)
  const position = ref<[number, number]>([0, 0])
  const calcPos = (e?: MouseEvent) => {
    let X: number = 0
    let Y: number = 0
    if (type === 'fixed') {
      const offsetX = getLayoutLeft(TriggerEl)
      const offsetY = getLayoutTop(TriggerEl)
      X = offsetX + Math.min(TriggerEl.offsetWidth, TriggerEl.offsetHeight) / 2
      Y = offsetY + TriggerEl.offsetHeight + 2
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
  const open = async (e?: MouseEvent) => {
    calcPos(e)
    visible.value = true
    await nextTick()
    if (!WindowRef.value) return
    document.documentElement.style.overflow = 'hidden'
    document.addEventListener('mousedown', onDocDown, true)
  }
  const onTrigger = (e: MouseEvent) => {
    e.stopPropagation()
    open(e)
  }
  if (method === 'click') {
    TriggerEl.addEventListener('mousedown', onTrigger)
  } else {
    TriggerEl.addEventListener('contextmenu', onTrigger)
  }
  const close = () => {
    if (!visible.value) return
    visible.value = false
    document.documentElement.style.overflow = ''
    document.removeEventListener('mousedown', onDocDown, true)
  }
  const onDocDown = (e: MouseEvent) => {
    if (!WindowRef.value) return
    if (WindowRef.value.contains(e.target as HTMLElement)) return
    e.stopPropagation()
    e.preventDefault()
    close()
  }
  const cleanup = () => {
    TriggerEl.removeEventListener('mousedown', onTrigger)
    TriggerEl.removeEventListener('contextmenu', onTrigger)
    document.removeEventListener('mousedown', onDocDown, true)
  }

  return reactive({ visible, position, open, close, cleanup })
}