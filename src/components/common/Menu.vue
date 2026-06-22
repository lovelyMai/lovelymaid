<script setup lang="ts">
import { ref } from 'vue'

export type List = { name: string, list?: List, [key: string]: any }[]
interface Props {
  /** 是否显示 */
  visible: boolean
  /** 位置 */
  position: [number, number]
  /** 列表 */
  list: List
  /** 列表项点击事件 */
  onItemClick?: (item: { name: string, [key: string]: any }, index: number) => void
}
const props = defineProps<Props>()

// 暴露菜单
const MenuRef = ref<HTMLElement | null>(null)
defineExpose({ MenuRef })
</script>

<template>
  <teleport to="body">
    <transition name="lovelymaid-fade-leave">
      <ul :class="$style.Menu" ref="MenuRef" v-if="props.visible"
        :style="{ left: `${props.position[0]}px`, top: `${props.position[1]}px` }" @click.stop>
        <li :class="$style.item" v-for="(item, index) in props.list" :key="index"
          @click="props.onItemClick?.(item, index)">
          <slot :item="item" :index="index"></slot>
          <span :class="$style.text">{{ item.name }}</span>
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
  transform: translateZ(0);
  backface-visibility: hidden;
}

.Menu .item {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px;
  border-radius: 8px;
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
</style>