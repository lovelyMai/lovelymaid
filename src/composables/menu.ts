import { computed, reactive, ref } from 'vue'
import Menu from '@/components/common/Menu.vue'

export type MenuManager = {
  visible: boolean
  position: [number, number]
  cleanup: () => void
}

export const createMenuManager = (TriggerEl: HTMLElement, MenuInstance: InstanceType<typeof Menu> | null): MenuManager => {
  const visible = ref<boolean>(false)
  const X = ref<number>(0)
  const Y = ref<number>(0)
  const position = computed<[number, number]>(() => [X.value, Y.value])
  const close = (e: MouseEvent) => {
    if (!MenuInstance || !MenuInstance.root) return
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

  return reactive({ visible, position, cleanup })
}

export const createSubMenuManager = (TriggerEl: HTMLElement): MenuManager => {
  const visible = ref<boolean>(false)
  const X = ref<number>(0)
  const Y = ref<number>(0)
  const position = computed<[number, number]>(() => [X.value, Y.value])
  const parentEl = TriggerEl.parentElement
  const close = (e: MouseEvent) => {
    if (!parentEl) return
    const target = e.target as HTMLElement
    // 离开 TriggerEl 但还在它的父元素内时关闭
    if (parentEl.contains(target) && !TriggerEl.contains(target)) {
      visible.value = false
      parentEl.removeEventListener('mouseover', close, true)
    }
  }
  const open = (e: MouseEvent) => {
    e.stopPropagation()
    if (visible.value || !parentEl) return
    visible.value = true
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    X.value = rect.right
    Y.value = rect.top - 5
    parentEl.addEventListener('mouseover', close, true)
  }
  TriggerEl.addEventListener('mouseenter', open)
  const cleanup = () => {
    if (!parentEl) return
    parentEl.removeEventListener('mouseover', close)
  }

  return reactive({ visible, position, cleanup })
}