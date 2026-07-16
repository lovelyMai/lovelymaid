import { reactive, ref } from 'vue'

import { type Menu } from '@/components/common/Menu.vue'

export type MenuManager = {
  readonly visible: boolean
  readonly position: [number, number]
  open: () => void
  close: () => void
  cleanup: () => void
}

export const createMenuManager = (TriggerEl: HTMLElement, MenuInstance: Menu, type: 'fixed' | 'flex' = 'fixed', method: 'click' | 'contextmenu' = 'click'): MenuManager => {
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
    if (visible.value) return
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
    if (!MenuInstance.root) return
    if (!MenuInstance.root.contains(e.target as HTMLElement)) {
      e.stopPropagation()
    }
    // 点击的是有子菜单的项，不关闭
    const targetEl = (e.target as HTMLElement).closest('[data-has-children]') as HTMLElement | null
    if (targetEl && targetEl.dataset.hasChildren === 'true') return
    close()
  }
  const cleanup = () => {
    TriggerEl.removeEventListener('click', onTrigger)
    TriggerEl.removeEventListener('contextmenu', onTrigger)
    document.removeEventListener('click', onDocClick, true)
  }

  return reactive({ visible, position, open, close, cleanup })
}

export const createSubMenuManager = (TriggerEl: HTMLElement, MenuInstance: Menu): MenuManager => {
  const visible = ref<boolean>(false)
  const parentEl = TriggerEl.parentElement
  const position = ref<[number, number]>([0, 0])
  const calcPos = () => {
    const rect = TriggerEl.getBoundingClientRect()
    const offsetX = window.visualViewport?.offsetLeft ?? 0
    const offsetY = window.visualViewport?.offsetTop ?? 0
    const X = rect.right + offsetX
    const Y = rect.top - 5 + offsetY
    position.value = [X, Y]
  }
  const open = () => {
    if (visible.value || !parentEl) return
    calcPos()
    visible.value = true
    parentEl.addEventListener('mouseover', onParentOverToChange)
    parentEl.addEventListener('mouseover', onParentOverToClose)
  }
  TriggerEl.addEventListener('mouseenter', open)
  const onParentOverToChange = (e: MouseEvent) => {
    if (!MenuInstance?.root) return
    const target = e.target as HTMLElement
    if (MenuInstance.root.contains(target)) {
      TriggerEl.style.backgroundColor = '#dadada'
      TriggerEl.style.color = '#000'
    } else {
      TriggerEl.style.backgroundColor = ''
      TriggerEl.style.color = ''
    }
  }
  const close = () => {
    if (!visible.value || !parentEl) return
    visible.value = false
    parentEl.removeEventListener('mouseover', onParentOverToChange)
    parentEl.removeEventListener('mouseover', onParentOverToClose)
  }
  const onParentOverToClose = (e: MouseEvent) => {
    if (!parentEl) return
    const target = e.target as HTMLElement
    // 离开 TriggerEl 但还在它的父元素内时关闭
    if (parentEl.contains(target) && !TriggerEl.contains(target) && visible.value) {
      close()
    }
  }
  const cleanup = () => {
    TriggerEl.removeEventListener('mouseenter', open)
    parentEl?.removeEventListener('mouseover', onParentOverToChange)
    parentEl?.removeEventListener('mouseover', onParentOverToClose)
  }

  return reactive({ visible, position, open, close, cleanup })
}