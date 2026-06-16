<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  /** 列表 */
  list: { name: string, [key: string]: any }[]
  /** 列表项点击事件 */
  onItemClick?: (item: { name: string, [key: string]: any }, index: number) => void
}
const props = defineProps<Props>()

// 弹出列表
const isPop = ref<boolean>(false)
const popX = ref<number>(0)
const popY = ref<number>(0)
const clickIcon = (e1: any) => {
  if (isPop.value) return
  isPop.value = true
  const rect = e1.target.getBoundingClientRect()
  popX.value = rect.left + e1.offsetX + e1.target.offsetWidth / 2
  popY.value = rect.top + e1.offsetY + e1.target.offsetHeight / 2
  const closePop = (e2: any) => {
    e2.stopPropagation()
    isPop.value = false
    document.removeEventListener('click', closePop, true)
  }
  document.addEventListener('click', closePop, true)
}
</script>

<template>
  <span class="lovelymaid lovelymai lovely-ellipsis ActionButton" @click.stop="clickIcon">
    <teleport to="body">
      <ul class="list" v-if="isPop" :style="{ left: `${popX}px`, top: `${popY}px` }">
        <li class="item" v-for="(item, index) in props.list" :key="index" @click="props.onItemClick?.(item, index)">
          <slot :item="item" :index="index">{{ item.name }}</slot>
        </li>
      </ul>
    </teleport>
  </span>
</template>

<style scoped>
.ActionButton {
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

.list {
  position: fixed;
  z-index: 999;
  padding: 4px;
  background-color: #f3f6f6;
  border-radius: 10px;
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, .1);
  transform: translateZ(0);
  backface-visibility: hidden;
}

.list .item {
  border-radius: 8px;
}

.list .item:hover {
  background-color: #3b86f7;
  color: #fff;
}
</style>