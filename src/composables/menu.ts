import { reactive, ref } from 'vue'

import { type Menu } from '@/components/common/Menu.vue'

export type MenuManager = {
  readonly visible: boolean
  readonly position: [number, number]
  open: () => void
  close: () => void
  cleanup: () => void
}

export const createMenuManager = (TriggerEl: HTMLElement, MenuInstance: Menu): MenuManager => {
  const visible = ref<boolean>(false)
  const position = ref<[number, number]>([0, 0])
  const calcPos = () => {
    const rect = TriggerEl.getBoundingClientRect()
    const X = rect.left + Math.min(rect.width, rect.height) / 2
    const Y = rect.top + rect.height + 2
    position.value = [X, Y]
  }
  const open = () => {
    if (visible.value) return
    calcPos()
    document.documentElement.style.overflow = 'hidden'
    visible.value = true
    document.addEventListener('click', onDocClick, true)
  }
  const onTriggerClick = (e: MouseEvent) => {
    e.stopPropagation()
    open()
  }
  TriggerEl.addEventListener('click', onTriggerClick)
  const close = () => {
    document.documentElement.style.overflow = ''
    visible.value = false
    document.removeEventListener('click', onDocClick, true)
  }
  const onDocClick = (e: MouseEvent) => {
    if (!MenuInstance?.root) return
    if (!MenuInstance.root.contains(e.target as HTMLElement)) {
      e.stopPropagation()
    }
    // 点击的是有子菜单的项，不关闭
    const targetEl = (e.target as HTMLElement).closest('[data-has-children]') as HTMLElement | null
    if (targetEl && targetEl.dataset.hasChildren === 'true') return
    close()
  }
  const cleanup = () => {
    TriggerEl.removeEventListener('click', onTriggerClick)
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
    const X = rect.right
    const Y = rect.top - 5
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
    visible.value = false
    parentEl?.removeEventListener('mouseover', onParentOverToChange)
    parentEl?.removeEventListener('mouseover', onParentOverToClose)
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