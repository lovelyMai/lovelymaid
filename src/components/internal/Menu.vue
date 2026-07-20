<script setup lang="ts">
import { inject, onUnmounted, provide, ref, watch, nextTick } from 'vue'

import { createSubMenuManager, type MenuManager } from '@/composables/menu'
import type { OptionItem } from '../type'

interface Props {
  /** 是否显示 */
  visible: boolean
  /** 选项 */
  options: OptionItem[]
  /** 位置 */
  position: [number, number]
  /** 选项点击事件 */
  onOptionClick?: (option: OptionItem, index: number) => void
}
const props = defineProps<Props>()
const isSubMenu = inject('menu-is-sub', false)
provide('menu-is-sub', true)

// 子菜单
const MenuRef = ref<HTMLElement | null>(null)
const SubMenuInstances = ref<Record<string, MenuInstance | null>>({})
const SubMenuManagers = ref<Record<string, MenuManager>>({})
const initSubManagers = async () => {
  await nextTick()
  if (!MenuRef.value) return
  MenuRef.value.querySelectorAll('[data-has-children="true"]').forEach(el => {
    const index = Number((el as HTMLElement).dataset.index)
    if (SubMenuManagers.value[index] || !SubMenuInstances.value[index]) return
    SubMenuManagers.value[index] = createSubMenuManager(el as HTMLElement, SubMenuInstances.value[index])
  })
}
const clearSubManagers = () => {
  Object.values(SubMenuManagers.value).forEach(manager => manager.cleanup())
  SubMenuManagers.value = {}
}
watch(() => props.visible, (visible) => {
  if (visible) {
    initSubManagers()
  } else {
    clearSubManagers()
  }
}, { immediate: true })
watch(() => props.options, () => {
  if (props.visible) {
    clearSubManagers()
    initSubManagers()
  }
}, { deep: true })
onUnmounted(() => {
  clearSubManagers()
})

// 暴露菜单
export type MenuInstance = {
  root: HTMLElement | null
  props: Props
}
defineExpose<MenuInstance>({
  get root() {
    return MenuRef.value
  },
  props
})
</script>

<template>
  <teleport to="body" :disabled="isSubMenu">
    <transition name="lovelymai-fade-leave">
      <ul :class="$style.Menu" ref="MenuRef" v-if="props.visible && props.options.length > 0"
        :style="{ left: `${props.position[0]}px`, top: `${props.position[1]}px` }">
        <li :class="$style.item" v-for="(item, index) in props.options" :key="item.id" :data-index="index"
          :data-has-children="item.options ? 'true' : 'false'" @click.stop="() => props.onOptionClick?.(item, index)">
          <slot :item="item" :index="index"></slot>
          <span :class="$style.text">{{ item.name }}</span>
          <span class="lovelymai lovely-right-arrow" v-if="item.options"></span>
          <Menu v-if="item.options" :ref="(ins) => SubMenuInstances[index] = (ins as MenuInstance | null)"
            :visible="SubMenuManagers[index]?.visible ?? false" :position="SubMenuManagers[index]?.position ?? [0, 0]"
            :options="item.options" :on-option-click="props.onOptionClick" />
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

@media (hover: hover) {
  .Menu .item:hover {
    background-color: #3b86f7;
    color: #fff;
  }
}

.Menu .item .text {
  font-size: 12px;
  font-weight: 450;
}
</style>
<style scoped>
.lovely-right-arrow {
  font-weight: 600;
  transform: translateY(1px);
}
</style>