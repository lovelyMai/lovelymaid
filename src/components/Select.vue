<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import Menu, { type MenuInstance } from './shared/Menu.vue'

import type { OptionItem } from '@/types'
import { createWindowManager, type WindowManager } from '@/utils/window.js'

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
const selectRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const menuManager = ref<WindowManager | null>(null)
onMounted(() => {
  if (!selectRef.value) return
  menuManager.value = createWindowManager(selectRef.value, menuRef)
})
onUnmounted(() => {
  menuManager.value?.cleanup()
})
</script>

<template>
  <span :class="['lovelymai', 'lovely-ellipsis', $style.select]" ref="selectRef">
    <Menu
      :ref="(ins) => (menuRef = (ins as MenuInstance | null)?.root ?? null)"
      :visible="menuManager?.visible ?? false"
      :position="menuManager?.position ?? [0, 0]"
      :z-index="props.zIndex"
      :options="props.options"
      :on-option-click="
        (option, index) => {
          props.onOptionClick?.(option, index)
          menuManager?.close()
        }
      "
      v-slot="{ item, index }"
    >
      <slot :item="item" :index="index"></slot>
    </Menu>
  </span>
</template>

<style module>
.select {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 20px;
  height: 20px;
  cursor: pointer;
}
</style>
