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
      X = e.pageX
      Y = e.pageY
    }
    position.value = [X, Y]
  }
  const open = async (e?: MouseEvent) => {
    calcPos(e)
    visible.value = true
    await nextTick()
    if (!WindowRef.value) return
    document.addEventListener('pointerdown', onDocDown, true)
    // 等本次 click 合成后再监听
    setTimeout(() => document.addEventListener('click', onDocClick, true), 100)
  }
  const onTrigger = (e: MouseEvent) => {
    e.stopPropagation()
    if (method === 'contextmenu') {
      e?.preventDefault()
    }
    open(e)
  }
  if (method === 'click') {
    TriggerEl.addEventListener('pointerdown', onTrigger)
  } else {
    TriggerEl.addEventListener('contextmenu', onTrigger)
  }
  const close = () => {
    if (!visible.value) return
    visible.value = false
    document.removeEventListener('pointerdown', onDocDown, true)
  }
  const onDocDown = (e: MouseEvent) => {
    if (!WindowRef.value) return
    if (WindowRef.value.contains(e.target as HTMLElement)) return
    e.stopPropagation()
    e.preventDefault()
    close()
  }
  const onDocClick = (e: MouseEvent) => {
    if (WindowRef.value && WindowRef.value.contains(e.target as HTMLElement)) return
    e.stopPropagation()
    e.preventDefault()
    document.removeEventListener('click', onDocClick, true)
  }
  const cleanup = () => {
    TriggerEl.removeEventListener('pointerdown', onTrigger)
    TriggerEl.removeEventListener('contextmenu', onTrigger)
    document.removeEventListener('pointerdown', onDocDown, true)
    document.removeEventListener('click', onDocClick, true)
  }

  return reactive({ visible, position, open, close, cleanup })
}