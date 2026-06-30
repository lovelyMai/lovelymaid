<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Menu, { type MenuItem } from './common/Menu.vue';
import { createMenuManager, type MenuManager } from '@/composables/menu.js';

interface Props {
  /** 列表 */
  options: MenuItem[]
  /** 列表项点击事件 */
  onItemClick?: (item: MenuItem, index: number) => void
}
const props = defineProps<Props>()

// 菜单
const MenuRef = ref<InstanceType<typeof Menu> | null>(null)
const SelectRef = ref<HTMLElement | null>(null)
let MenuManager: MenuManager | undefined
onMounted(() => {
  if (!SelectRef.value || !MenuRef.value) return
  MenuManager = createMenuManager(SelectRef.value, MenuRef.value)
})
</script>

<template>
  <span :class="['lovelymai', 'lovely-ellipsis', $style.Select]" ref="SelectRef">
    <Menu ref="MenuRef" :visible="MenuManager?.visible ?? false" :position="MenuManager?.position ?? [0, 0]"
      :config="props.options" :onItemClick="props.onItemClick" v-slot="{ item, index }">
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