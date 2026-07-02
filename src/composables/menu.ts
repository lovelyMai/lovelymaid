import { reactive, ref, watch } from 'vue'
import { type Menu } from '@/components/common/Menu.vue'

export type MenuManager = {
  visible: boolean
  position: [number, number]
  close: (e: MouseEvent) => void
  cleanup: () => void
}

export const createMenuManager = (TriggerEl: HTMLElement, MenuInstance: Menu): MenuManager => {
  const visible = ref<boolean>(false)
  const X = ref<number>(0)
  const Y = ref<number>(0)
  const position = ref<[number, number]>([X.value, Y.value])
  watch([X, Y], ([newX, newY]) => {
    position.value = [newX, newY]
  })
  const close = (e: MouseEvent) => {
    if (!MenuInstance?.root) return
    if (!MenuInstance.root.contains(e.target as HTMLElement)) {
      e.stopPropagation()
    }
    // 点击的是有子菜单的项，不关闭
    const li = (e.target as HTMLElement).closest('[data-has-children]') as HTMLElement
    if (li && li.dataset.hasChildren === 'true') return
    visible.value = false
    document.removeEventListener('click', close, true)
  }
  const open = (e: MouseEvent) => {
    e.stopPropagation()
    if (visible.value) return
    visible.value = true
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    X.value = rect.left + e.offsetX + 5
    Y.value = rect.top + e.offsetY + 5
    document.addEventListener('click', close, true)
  }
  TriggerEl.addEventListener('click', open)
  const cleanup = () => {
    document.removeEventListener('click', close, true)
  }

  return reactive({ visible, position, close, cleanup })
}

export const createSubMenuManager = (TriggerEl: HTMLElement, MenuInstance: Menu): MenuManager => {
  const visible = ref<boolean>(false)
  const parentEl = TriggerEl.parentElement
  const X = ref<number>(0)
  const Y = ref<number>(0)
  const position = ref<[number, number]>([X.value, Y.value])
  watch([X, Y], ([newX, newY]) => {
    position.value = [newX, newY]
  })
  const change = (e: MouseEvent) => {
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
  const close = (e: MouseEvent) => {
    if (!parentEl) return
    const target = e.target as HTMLElement
    // 离开 TriggerEl 但还在它的父元素内时关闭
    if (parentEl.contains(target) && !TriggerEl.contains(target) && visible.value) {
      visible.value = false
      parentEl.removeEventListener('mouseover', change)
      parentEl.removeEventListener('mouseover', close)
    }
  }
  const open = (e: MouseEvent) => {
    if (visible.value || !parentEl) return
    visible.value = true
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    X.value = rect.right
    Y.value = rect.top - 5
    parentEl.addEventListener('mouseover', change)
    parentEl.addEventListener('mouseover', close)
  }
  TriggerEl.addEventListener('mouseenter', open)
  const cleanup = () => {
    parentEl?.removeEventListener('mouseover', change)
    parentEl?.removeEventListener('mouseover', close)
  }

  return reactive({ visible, position, close, cleanup })
}