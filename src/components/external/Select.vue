<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import Menu, { type MenuInstance } from '../internal/Menu.vue';

import type { OptionItem } from '@/types'
import { createWindowManager, type WindowManager } from '@/utils/window.js';

interface Props {
  /** 选项配置 */
  options: OptionItem[]
  /** 弹窗 z-index */
  zIndex?: number
  /** 选项点击事件 */
  onOptionClick?: (option: OptionItem, index: number) => void
}
const props = defineProps<Props>()

// 菜单
const SelectRef = ref<HTMLElement | null>(null)
const MenuRef = ref<HTMLElement | null>(null)
const MenuManager = ref<WindowManager | null>(null)
onMounted(() => {
  if (!SelectRef.value) return
  MenuManager.value = createWindowManager(SelectRef.value, MenuRef)
})
onUnmounted(() => {
  MenuManager.value?.cleanup()
})
</script>

<template>
  <span :class="['lovelymai', 'lovely-ellipsis', $style.Select]" ref="SelectRef">
    <Menu :ref="(ins) => MenuRef = (ins as MenuInstance | null)?.root ?? null" :visible="MenuManager?.visible ?? false"
      :position="MenuManager?.position ?? [0, 0]" :z-index="props.zIndex" :options="props.options" :on-option-click="(option, index) => {
        props.onOptionClick?.(option, index)
        MenuManager?.close()
      }" v-slot="{ item, index }">
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