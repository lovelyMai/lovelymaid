import { computed, onUnmounted, reactive, ref, type Ref } from 'vue'
import Menu from '@/components/common/Menu.vue'

export const createMenuManager = (MenuRef: Ref<InstanceType<typeof Menu> | null>) => {
  const visible = ref<boolean>(false)
  const X = ref<number>(0)
  const Y = ref<number>(0)
  const position = computed<[number, number]>(() => [X.value, Y.value])
  const close = (e2: MouseEvent) => {
    if (!MenuRef.value || !MenuRef.value.MenuRef) return
    visible.value = false
    document.removeEventListener('click', close, true)
    if (MenuRef.value.MenuRef.contains(e2.target as HTMLElement)) return
    e2.stopPropagation()
  }
  onUnmounted(() => {
    document.removeEventListener('click', close, true)
  })
  const open = (e1: MouseEvent) => {
    if (visible.value) return
    visible.value = true
    const icon = e1.target as HTMLElement
    const rect = icon.getBoundingClientRect()
    X.value = rect.left + e1.offsetX + 5
    Y.value = rect.top + e1.offsetY + 5
    document.addEventListener('click', close, true)
  }

  return reactive({
    visible, position, open
  })
}