<script setup lang="ts">
import { ref, Teleport } from 'vue';

interface Props {
  /** 列表 */
  list: string[]
  /** 列表项点击事件 */
  onItemClick?: (index: number) => void
}
const props = defineProps<Props>()

// 弹出列表
const isPop = ref<boolean>(false)
const popX = ref<number>(0)
const popY = ref<number>(0)
const clickIcon = (e: any) => {
  if (isPop.value) return
  isPop.value = true
  const rect = e.target.getBoundingClientRect()
  popX.value = rect.left + e.offsetX + e.target.offsetWidth / 2
  popY.value = rect.top + e.offsetY + e.target.offsetHeight / 2
  const closePop = () => {
    isPop.value = false
    e.target.removeEventListener('click', closePop)
    document.removeEventListener('click', closePop)
  }
  e.target.addEventListener('click', closePop)
  document.addEventListener('click', closePop)
}
</script>

<template>
  <span class="lovelymaid lovelymaid-ellipsis ActionButton" @click.stop="clickIcon">
    <teleport to="body">
      <div class="list" v-if="isPop" :style="{ left: `${popX}px`, top: `${popY}px` }">
        <div class="item" v-for="(item, index) in props.list" :key="index" @click="props.onItemClick?.(index)">
          <slot :item="item" :index="index">{{ item }}</slot>
        </div>
      </div>
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

.item {
  border-radius: 8px;
}

.item:hover {
  background-color: #3b86f7;
  color: #fff;
}
</style>