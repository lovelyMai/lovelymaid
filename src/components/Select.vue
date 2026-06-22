<script setup lang="ts">
import { ref } from 'vue';
import Menu from './common/Menu.vue';
import { createMenuManager } from '@/composables/menu.js';

interface Props {
  /** 列表 */
  list: { name: string, [key: string]: any }[]
  /** 列表项点击事件 */
  onItemClick?: (item: { name: string, [key: string]: any }, index: number) => void
}
const props = defineProps<Props>()

// 菜单
const MenuRef = ref<InstanceType<typeof Menu> | null>(null)
const MenuMangager = createMenuManager(MenuRef)
</script>

<template>
  <span :class="['lovelymai', 'lovely-ellipsis', $style.Select]" @click.stop="MenuMangager.open">
    <Menu ref="MenuRef" :visible="MenuMangager.visible" :position="MenuMangager.position" :list="props.list"
      :onItemClick="props.onItemClick" v-slot="{ item, index }">
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