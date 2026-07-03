<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Menu from './common/Menu.vue';

import { createMenuManager, type MenuManager } from '@/composables/menu.js';
import type { Option } from './type'

interface Props {
  /** 选项配置 */
  options: Option[]
  /** 选项点击事件 */
  onOptionClick?: (item: Option, index: number) => void
}
const props = defineProps<Props>()

// 菜单
const MenuRef = ref<InstanceType<typeof Menu> | null>(null)
const SelectRef = ref<HTMLElement | null>(null)
const MenuManagerInstance = ref<MenuManager | null>(null)
onMounted(() => {
  if (!SelectRef.value || !MenuRef.value) return
  MenuManagerInstance.value = createMenuManager(SelectRef.value, MenuRef.value)
})
</script>

<template>
  <span :class="['lovelymai', 'lovely-ellipsis', $style.Select]" ref="SelectRef">
    <Menu ref="MenuRef" :visible="MenuManagerInstance?.visible ?? false"
      :position="MenuManagerInstance?.position ?? [0, 0]" :options="props.options" :onOptionClick="props.onOptionClick"
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