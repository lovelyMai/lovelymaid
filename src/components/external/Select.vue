<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import Menu, { type MenuInstance } from '../internal/Menu.vue';

import { createWindowManager, type WindowManager } from '@/composables/window';
import type { OptionItem } from '../type.js'

interface Props {
  /** 选项配置 */
  options: OptionItem[]
  /** 选项点击事件 */
  onOptionClick?: (item: OptionItem, index: number) => void
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
      :position="MenuManager?.position ?? [0, 0]" :options="props.options" :on-option-click="() => {
        props.onOptionClick
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