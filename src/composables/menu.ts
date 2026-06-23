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
    const icon = e.target as HTMLElement
    const rect = icon.getBoundingClientRect()
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

  const close = () => {
    visible.value = false
  }

  const open = (e: MouseEvent) => {
    if (visible.value) return
    visible.value = true
    const icon = e.currentTarget as HTMLElement
    const rect = icon.getBoundingClientRect()
    X.value = rect.right
    Y.value = rect.top - 5
  }

  // 悬浮在 TriggerEl 上时打开
  TriggerEl.addEventListener('mouseenter', open)

  // 进入同级元素时关闭
  const parent = TriggerEl.parentElement
  if (parent) {
    parent.addEventListener('mouseover', (e) => {
      const target = e.target as HTMLElement
      if (target !== TriggerEl && target.parentElement === parent && visible.value) {
        close()
      }
    })
  }
  const cleanup = () => {
    TriggerEl.removeEventListener('mouseenter', open)
  }

  return reactive({ visible, position, cleanup })
}