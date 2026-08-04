import { reactive, ref } from 'vue'

import { type WindowManager } from './window'
import { type MenuInstance } from '@/components/internal/Menu.vue'

export const createSubMenuManager = (TriggerEl: HTMLElement, MenuInstance: MenuInstance): WindowManager => {
  const visible = ref<boolean>(false)
  const parentEl = TriggerEl.parentElement
  const position = ref<[number, number]>([0, 0])
  const calcPos = () => {
    position.value = [TriggerEl.offsetWidth, -5]
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
    if (!MenuInstance.root) return
    const target = e.target as HTMLElement
    if (MenuInstance.root.contains(target)) {
      TriggerEl.style.backgroundColor = 'var(--lovelymai-color-gray-225)'
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