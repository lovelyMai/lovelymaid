<script setup lang="ts">
import { inject, onUnmounted, provide, ref, watch, nextTick, computed } from 'vue'

import { createSubMenuManager } from '@/services/menu'
import type { OptionItem } from '../type'
import { type WindowManager } from '@/services/window'

interface Props {
  /** 是否显示 */
  visible: boolean
  /** 位置 */
  position: [number, number]
  /** 最小宽度 */
  minWidth?: string
  /** z-index */
  zIndex?: number
  /** 选项 */
  options: OptionItem[]
  /** 选项点击事件 */
  onOptionClick?: (option: OptionItem, index: number) => void
}
const props = withDefaults(defineProps<Props>(), {
  zIndex: 0
})
const isSubMenu = inject('menu-is-sub', false)
provide('menu-is-sub', true)

// 子菜单
const MenuRef = ref<HTMLElement | null>(null)
const SubMenuInstances = ref<Record<string, MenuInstance | null>>({})
const SubMenuManagers = ref<Record<string, WindowManager>>({})
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

// 是否存在子菜单
const hasSubMenu = computed<boolean>(() => props.options.filter(option => option.options).length > 0)

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

defineSlots<{
  default: (props: { item: OptionItem; index: number }) => void
}>()
</script>

<template>
  <teleport to="body" :disabled="isSubMenu">
    <transition name="lovelymai-fade-leave">
      <ul :class="[$style.Menu, hasSubMenu ? $style.sub : '']" ref="MenuRef"
        v-if="props.visible && props.options.length > 0"
        :style="{ left: `${props.position[0]}px`, top: `${props.position[1]}px`, zIndex: props.zIndex, minWidth: props.minWidth ?? '' }"
        @click.stop>
        <li :class="$style.item" v-for="(item, index) in props.options" :key="item.id" :data-index="index"
          :data-has-children="item.options ? 'true' : 'false'" @click.stop="() => props.onOptionClick?.(item, index)">
          <div :class="$style.left">
            <slot :item="item" :index="index"></slot>
            <span :class="$style.text">{{ item.name }}</span>
          </div>
          <span class="lovelymai lovely-right-arrow" v-if="item.options"></span>
          <Menu v-if="item.options" :ref="(ins) => SubMenuInstances[index] = (ins as MenuInstance | null)"
            :visible="SubMenuManagers[index]?.visible ?? false" :position="SubMenuManagers[index]?.position ?? [0, 0]"
            :options="item.options" :on-option-click="props.onOptionClick" v-slot="{ item, index }">
            <slot :item="item" :index="index"></slot>
          </Menu>
        </li>
      </ul>
    </transition>
  </teleport>
</template>

<style module>
.Menu {
  position: absolute;
  padding: 4px;
  background-color: var(--lovelymai-color-gray-150);
  border: 1px solid #fff;
  border-radius: 10px;
  outline: 0.5px solid var(--lovelymai-color-gray-250);
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, .3);
  user-select: none;
  -webkit-user-select: none;
}

.Menu .item {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
  position: relative;
  z-index: 0;
  padding: 5px;
  height: 28px;
  border-radius: 8px;
  color: #000;
  cursor: pointer;
}

.Menu.sub .item {
  justify-content: space-between;
}

@media (hover: hover) {
  .Menu .item:hover {
    background-color: var(--lovelymai-color-blue-200);
    color: #fff;
  }
}

.Menu .item .left {
  display: flex;
  gap: 5px;
}

.Menu .item .left .text {
  font-size: 12px;
  font-weight: 450;
  line-height: 18px;
  white-space: nowrap;
}
</style>
<style scoped>
.lovely-right-arrow {
  font-weight: 600;
  transform: translateY(1px);
}
</style>