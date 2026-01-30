<script setup lang="ts">
import { ref } from 'vue';

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
  popX.value = e.offsetX + e.target.offsetWidth / 2
  popY.value = e.offsetY + e.target.offsetHeight / 2
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
  <span class="ActionButton">
    <span class="iconfont icon-info" @click.stop="clickIcon" style="user-select: none;">
      <ul v-if="isPop" :style="{ left: `${popX}px`, top: `${popY}px` }">
        <li v-for="(item, index) in props.list" :key="index">
          <div class="inner" @click="props.onItemClick?.(index)">
            <slot :item="item" :index="index">{{ item }}</slot>
          </div>
        </li>
      </ul>
    </span>
  </span>
</template>

<style scoped>
.icon-info {
  display: inline-block;
  position: relative;
  font-size: 20px;
  color: #3b86f7;
  cursor: pointer;
  --list-z-index: 20;
}

ul {
  position: absolute;
  z-index: var(--list-z-index);
  width: 60px;
  background-color: #f3f6f6;
  border-radius: 10px;
  box-shadow: 0 0 5px 2px rgba(0, 0, 0, .1);
}

li {
  height: 30px;
  padding: 2px;
  cursor: pointer;
}

.inner {
  display: flex;
  justify-content: center;
  border-radius: 9px;
  font-size: 14px;
  color: #000;
  line-height: 26px;
}

.inner:hover {
  background-color: #3b86f7;
  color: #fff;
}
</style>