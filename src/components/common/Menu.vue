<script setup lang="ts">
import { createSubMenuManager, type MenuManager } from '@/composables/menu.js'
import { inject, onUnmounted, provide, ref, watch, nextTick } from 'vue'

export type MenuItem = { id: string, name: string, config?: MenuItem[], [key: string]: any }
interface Props {
  /** 是否显示 */
  visible: boolean
  /** 位置 */
  position: [number, number]
  /** 列表 */
  config: MenuItem[]
  /** 列表项点击事件 */
  onItemClick?: (item: MenuItem, index: number) => void
}
const props = defineProps<Props>()
const isSubMenu = inject('menu-is-sub', false)
provide('menu-is-sub', true)

// 子菜单
const MenuRef = ref<HTMLElement | null>(null)
const SubMenuRefs = ref<Record<string, Menu | null>>({})
const MenuManagers = ref<Record<string, MenuManager>>({})
watch(() => props.visible, async (visible) => {
  await nextTick()
  if (visible) {
    if (!MenuRef.value) return
    const items = MenuRef.value.querySelectorAll('[data-has-children="true"]')
    items.forEach((el) => {
      const index = Number((el as HTMLElement).dataset.index)
      if (MenuManagers.value[index] || !SubMenuRefs.value[index]) return
      MenuManagers.value[index] = createSubMenuManager(el as HTMLElement, SubMenuRefs.value[index])
    })
  } else {
    for (const manager of Object.values(MenuManagers.value)) {
      manager.cleanup()
    }
    MenuManagers.value = {}
  }
}, { immediate: true })
onUnmounted(() => {
  for (const manager of Object.values(MenuManagers.value)) {
    manager.cleanup()
  }
})

// 暴露菜单
defineExpose({ root: MenuRef, props })
export type Menu = {
  root: HTMLElement | null
  props: Props
}
</script>

<template>
  <teleport to="body" :disabled="isSubMenu">
    <transition name="lovelymaid-fade-leave">
      <ul :class="$style.Menu" ref="MenuRef" v-if="props.visible"
        :style="{ left: `${props.position[0]}px`, top: `${props.position[1]}px` }" @click.stop>
        <li :class="$style.item" v-for="(item, index) in props.config" :key="item.id" :data-index="index"
          :data-has-children="item.config ? 'true' : 'false'" @click="() => props.onItemClick?.(item, index)">
          <slot :item="item" :index="index"></slot>
          <span :class="$style.text">{{ item.name }}</span>
          <span class="lovelymai lovely-right-arrow" v-if="item.config"></span>
          <Menu v-if="item.config" :ref="(el) => SubMenuRefs[index] = (el as Menu | null)"
            :visible="MenuManagers[index]?.visible ?? false" :position="MenuManagers[index]?.position ?? [0, 0]"
            :config="item.config" :onItemClick="props.onItemClick" />
        </li>
      </ul>
    </transition>
  </teleport>
</template>

<style module>
.Menu {
  position: fixed;
  z-index: 999;
  padding: 4px;
  background-color: #f3f6f6;
  border: 1px solid #fff;
  border-radius: 10px;
  outline: 0.5px solid #b3b3b3;
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, .3);
  user-select: none;
  -webkit-user-select: none;
}

.Menu .item {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px;
  border-radius: 8px;
  color: #000;
  cursor: pointer;
}

.Menu .item:hover {
  background-color: #3b86f7;
  color: #fff;
}

.Menu .item .text {
  font-size: 12px;
  font-weight: 500;
}

.Menu .item :global(.lovely-right-arrow) {
  transform: translateY(1px);
}
</style>