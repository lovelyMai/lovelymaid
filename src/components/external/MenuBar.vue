<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from 'vue';
import Card from './Card.vue';

import type { Item } from '../type.js';
import { watchDOM } from '@/utils/common';
import useCssVar from '@/utils/use-css-var';

type MenuItem = Item & {
  /** 是否禁用 */
  disabled?: boolean
}
interface Props {
  /** 菜单 */
  menus: MenuItem[]
  /** 菜单点击事件 */
  onMenuClick?: (menu: MenuItem, index: number) => void
}
const props = defineProps<Props>()

// 初始化
const MenuBarRef = ref<HTMLElement | null>(null)
const style = reactive({
  MenuBar: {
    'border-radius': '0'
  }
})
let cleanup: (() => void) | undefined
onMounted(() => {
  if (!MenuBarRef.value) return
  cleanup = watchDOM(MenuBarRef.value, ({ width, height }) => {
    const shorter = Math.min(width, height)
    style.MenuBar['border-radius'] = `${shorter / 2}px`
  })
  useCssVar(MenuBarRef.value, style)
})
onUnmounted(() => {
  cleanup?.()
})
</script>

<template>
  <Card :class="$style.MenuBar" :ref="(el) => MenuBarRef = (el as InstanceType<typeof Card> | null)?.$el ?? null">
    <ul :class="$style.menus">
      <li :class="[$style.menu, { [$style.disabled]: menu.disabled }]" v-for="(menu, index) in props.menus"
        @click.stop="() => props.onMenuClick?.(menu, index)">
        <slot :menu="menu" :index="index"></slot>
      </li>
    </ul>
  </Card>
</template>

<style module>
.MenuBar {
  padding: 3px;
  border-radius: var(--MenuBar-border-radius);
  user-select: none;
  -webkit-user-select: none;
}

.menus {
  display: flex;
  justify-content: space-between;
  width: 100%;
  height: 100%;
}

.menus .menu {
  display: flex;
  justify-content: center;
  align-items: center;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  cursor: pointer;
}

.menus .menu.disabled {
  opacity: .4;
  cursor: not-allowed;
}

@media (hover: hover) {
  .menu:not(.disabled):hover {
    background-color: var(--lovelymai-color-gray-150);
  }
}
</style>