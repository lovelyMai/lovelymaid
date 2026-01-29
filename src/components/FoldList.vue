<script setup lang="ts">
import { ref, nextTick, onMounted, watch } from 'vue'
import { getSlideCount } from '../utils/getSlideCount'

interface Props {
  /** 要渲染的列表 */
  list: { id: number, name: string }[]
  /** 激活项索引 */
  activeIndex: number
  /** 头部点击事件 */
  onHeaderClick?: () => void
  /** 列表项点击事件 */
  onItemClick?: (item: { id: number, name: string }, index: number) => void
}
const props = defineProps<Props>()

// 标准流高度动画
const isOpen = ref<boolean>(true)
const bodyHeight = ref<number>(0)
const bodyRef = ref<HTMLElement | null>(null)
const enableTransition = ref(false)
const calculateHeight = async () => {
  await nextTick()
  if (bodyRef.value) {
    bodyHeight.value = bodyRef.value.offsetHeight
  }
}
const initialize = async () => {
  enableTransition.value = false
  await calculateHeight()
  setTimeout(() => enableTransition.value = true, 100)
}
onMounted(() => {
  initialize()
})
watch(() => props.list.length, calculateHeight)

// 列表项动画
const slideCount = ref<number[]>([])
const slideAnimating = ref<boolean>(false)
const oldList = ref<{ id: number, name: string }[]>([...props.list])
watch(() => props.list, (newList) => {
  slideCount.value = getSlideCount(newList, oldList.value)
  slideAnimating.value = true
  oldList.value = [...newList]
}, { deep: true })
</script>

<template>
  <div style="user-select: none;">
    <div class="header" @click.stop="onHeaderClick">
      <div class="title">
        <slot name="title">标题</slot>
      </div>
      <span class="iconfont icon-right-arrow" :style="{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }"
        :title="isOpen ? '收起列表' : '展开列表'" @click.stop="isOpen = !isOpen"></span>
    </div>
    <div class="body-container" :class="{ 'enable-transition': enableTransition }"
      :style="{ height: isOpen ? `calc(0px + ${bodyHeight}px)` : '0px' }">
      <ul ref="bodyRef" class="body" :class="{ close: !isOpen }">
        <li v-for="(item, index) in props.list" :key="index" @click.stop="() => onItemClick?.(item, index)"
          :style="{ '--z-index': props.list.length - index, '--translateY': `${slideCount[index] * 100}%` }"
          @animationend="() => slideAnimating = false"
          :class="{ active: index === props.activeIndex, slide: slideAnimating }">
          {{ item.name }}
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 30px;
}

.header .title {
  font-size: 12px;
  color: #767676;
  font-weight: 500;
}

.header .iconfont {
  font-size: 16px;
  color: #767676;
  font-weight: 700;
  transition: transform .3s;
  cursor: pointer;
}

.body-container {
  overflow: hidden;
}

.body-container.enable-transition {
  transition: height .5s ease;
}

.body {
  transform: translateY(0);
  transition: transform .5s ease;
  transition-delay: 0.032s;
}

.body.close {
  transform: translateY(-100%);
}

.body li {
  position: relative;
  z-index: var(--z-index);
  height: 30px;
  padding: 0 10px;
  border-radius: 6px;
  font-size: 14px;
  line-height: 30px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all .2s;
}

.body li.active {
  background-color: rgba(228, 228, 228, 1);
  color: #3b86f7;
}

@keyframes slide {
  from {
    transform: translateY(var(--translateY));
  }

  to {
    transform: translateY(0);
  }
}

.slide {
  animation: slide .5s ease;
}
</style>