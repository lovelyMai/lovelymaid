<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import Menu from './common/Menu.vue';

interface Props {
  /** 列表 */
  list: { name: string, [key: string]: any }[]
  /** 列表项点击事件 */
  onItemClick?: (item: { name: string, [key: string]: any }, index: number) => void
}
const props = defineProps<Props>()

// 弹出列表
const isPop = ref<boolean>(false)
const MenuRef = ref<InstanceType<typeof Menu> | null>(null)
const popX = ref<number>(0)
const popY = ref<number>(0)
const closePop = (e2: MouseEvent) => {
  if (!MenuRef.value || !MenuRef.value.MenuRef) return
  isPop.value = false
  document.removeEventListener('click', closePop, true)
  if (MenuRef.value.MenuRef.contains(e2.target as HTMLElement)) return
  e2.stopPropagation()
}
onUnmounted(() => {
  document.removeEventListener('click', closePop, true)
})
const clickIcon = (e1: MouseEvent) => {
  if (isPop.value) return
  isPop.value = true
  const icon = e1.target as HTMLElement
  const rect = icon.getBoundingClientRect()
  popX.value = rect.left + e1.offsetX + icon.offsetWidth / 2
  popY.value = rect.top + e1.offsetY + icon.offsetHeight / 2
  document.addEventListener('click', closePop, true)
}
</script>

<template>
  <span :class="['lovelymai', 'lovely-ellipsis', $style.Select]" @click.stop="clickIcon">
    <Menu ref="MenuRef" :visible="isPop" :position="[popX, popY]" :list="props.list" :onItemClick="props.onItemClick"
      v-slot="{ item, index }">
      <slot :item="item" :index="index"></slot>
    </Menu>
  </span>
</template>

<style module>
.Select {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 20px;
  height: 20px;
  cursor: pointer;
}
</style>