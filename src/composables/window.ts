import { nextTick, reactive, ref, type Ref } from 'vue'

import { getOffsetLeft, getOffsetTop } from '@/utils/get-view-offset'

export type WindowManager = {
  readonly visible: boolean
  readonly position: [number, number]
  open: () => void
  close: () => void
  cleanup: () => void
}

const stopClickPropagation = (e: Event) => {
  e.stopPropagation()
  document.removeEventListener('click', stopClickPropagation, true)
}

/** 获取元素的所有可滚动祖先（含 document） */
const getScrollableParents = (el: HTMLElement): (HTMLElement | Document)[] => {
  const parents: (HTMLElement | Document)[] = []
  let current: HTMLElement | null = el.parentElement
  while (current) {
    const style = getComputedStyle(current)
    if (/(auto|scroll)/.test(style.overflow + style.overflowX + style.overflowY)) {
      parents.push(current)
    }
    current = current.parentElement
  }
  parents.push(document)
  return parents
}

export const createWindowManager = (TriggerEl: HTMLElement, WindowRef: Ref<HTMLElement | null>, type: 'fixed' | 'flex' = 'fixed', method: 'down' | 'contextmenu' = 'down'): WindowManager => {
  const visible = ref<boolean>(false)
  const position = ref<[number, number]>([0, 0])
  const calcPos = (e?: MouseEvent) => {
    if (!WindowRef.value) return
    let X: number = 0
    let Y: number = 0
    if (type === 'fixed') {
      X = getOffsetLeft(TriggerEl) + Math.min(TriggerEl.offsetWidth, TriggerEl.offsetHeight) / 2
      Y = getOffsetTop(TriggerEl) + TriggerEl.offsetHeight + 3
      const offsetBottom = document.documentElement.scrollTop + document.documentElement.clientHeight - (Y + WindowRef.value.offsetHeight)
      const centerIsBottom = getOffsetTop(TriggerEl) + TriggerEl.offsetHeight / 2 > document.documentElement.scrollTop + document.documentElement.clientHeight / 2
      if (offsetBottom < 3 && centerIsBottom) {
        Y = getOffsetTop(TriggerEl) - WindowRef.value.offsetHeight - 3
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
  let scrollParents: (HTMLElement | Document)[] = []
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
    scrollParents = getScrollableParents(TriggerEl)
    scrollParents.forEach(p => p.addEventListener('scroll', onScroll))
    document.removeEventListener('click', onDocClick, true)
    setTimeout(() => {
      document.removeEventListener('click', stopClickPropagation, true)
      document.addEventListener('click', onDocClick, true)
    }, 200)
  }
  const onTrigger = (e: MouseEvent) => {
    e.stopPropagation()
    document.addEventListener('click', stopClickPropagation, true)
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
    scrollParents.forEach(p => p.removeEventListener('scroll', onScroll))
    scrollParents = []
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
    document.removeEventListener('click', stopClickPropagation, true)
    scrollParents.forEach(p => p.removeEventListener('scroll', onScroll))
    scrollParents = []
    document.removeEventListener('click', onDocClick, true)
  }

  return reactive({ visible, position, open, close, cleanup })
}