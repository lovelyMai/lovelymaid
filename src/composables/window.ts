import { nextTick, reactive, ref, type Ref } from 'vue'

import { getLayoutLeft, getLayoutTop } from '@/utils/get-layout-offset'

export type WindowManager = {
  readonly visible: boolean
  readonly position: [number, number]
  open: () => void
  close: () => void
  cleanup: () => void
}

export const createWindowManager = (TriggerEl: HTMLElement, WindowRef: Ref<HTMLElement | null>, type: 'fixed' | 'flex' = 'fixed', method: 'down' | 'contextmenu' = 'down'): WindowManager => {
  const visible = ref<boolean>(false)
  const position = ref<[number, number]>([0, 0])
  const calcPos = (e?: MouseEvent) => {
    if (!WindowRef.value) return
    let X: number = 0
    let Y: number = 0
    if (type === 'fixed') {
      X = getLayoutLeft(TriggerEl) + Math.min(TriggerEl.offsetWidth, TriggerEl.offsetHeight) / 2
      Y = getLayoutTop(TriggerEl) + TriggerEl.offsetHeight + 3
      const offsetBottom = document.documentElement.scrollTop + document.documentElement.clientHeight - (Y + WindowRef.value.offsetHeight)
      const centerIsBottom = getLayoutTop(TriggerEl) + TriggerEl.offsetHeight / 2 > document.documentElement.scrollTop + document.documentElement.clientHeight / 2
      if (offsetBottom < 3 && centerIsBottom) {
        Y = getLayoutTop(TriggerEl) - WindowRef.value.offsetHeight - 3
      }
    } else {
      if (e) {
        X = e.pageX
        Y = e.pageY
        const offsetBottom = document.documentElement.scrollTop + document.documentElement.clientHeight - (Y + WindowRef.value.offsetHeight)
        if (offsetBottom < 3) {
          Y = Y + offsetBottom - 3
        }
      } else {
        console.error('flex 类型下 open 必须传入 event 事件对象')
      }
    }
    const offsetRight = document.documentElement.scrollLeft + document.documentElement.clientWidth - (X + WindowRef.value.offsetWidth)
    if (offsetRight < 3) {
      X = X + offsetRight - 3
    }
    position.value = [X, Y]
  }
  let lastEvent: MouseEvent | undefined
  let ticking = false
  const onScroll = () => {
    if (ticking) return
    requestAnimationFrame(() => {
      calcPos(lastEvent)
      ticking = false
    })
    ticking = true
  }
  const open = async (e?: MouseEvent) => {
    lastEvent = e
    visible.value = true
    await nextTick()
    if (!WindowRef.value) return
    calcPos(e)
    document.addEventListener('scroll', onScroll)
    document.removeEventListener('click', onDocClick, true)
    setTimeout(() => {
      document.addEventListener('click', onDocClick, true)
    }, 200)
  }
  const onTrigger = (e: MouseEvent) => {
    e.stopPropagation()
    if (method === 'contextmenu') {
      e.preventDefault()
    }
    if (visible.value) return
    open(e)
  }
  if (method === 'down') {
    TriggerEl.addEventListener('mousedown', onTrigger)
  } else {
    TriggerEl.addEventListener('contextmenu', onTrigger)
  }
  const close = () => {
    if (!visible.value) return
    visible.value = false
    document.removeEventListener('scroll', onScroll)
    document.removeEventListener('click', onDocClick, true)
  }
  const onDocClick = (e: MouseEvent) => {
    if (!WindowRef.value) return
    if (WindowRef.value.contains(e.target as HTMLElement)) return
    e.stopPropagation()
    e.preventDefault()
    close()
  }
  const cleanup = () => {
    TriggerEl.removeEventListener('mousedown', onTrigger)
    TriggerEl.removeEventListener('contextmenu', onTrigger)
    document.removeEventListener('scroll', onScroll)
    document.removeEventListener('click', onDocClick, true)
  }

  return reactive({ visible, position, open, close, cleanup })
}