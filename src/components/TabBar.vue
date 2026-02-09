<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

import Button from './Button.vue'
import Search from './Search.vue'

interface Props {
  /** 列表 */
  list: string[]
  /** 列表项点击事件 */
  onItemClick?: (item: string, index: number) => void
  /** 是否启用搜索按钮 */
  showSearch?: boolean
}
const props = defineProps<Props>()
const listLength = computed(() => props.list.length)

// 初始化
const barRef = ref<HTMLElement | null>(null)
const barWidth = ref<number>(0)
const barHeight = ref<number>(0)
const searchWidth = ref<number>(0)
const borderRadius = ref<number>(0)
const slideRef = ref<HTMLElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)
const slideWidth = ref<number>(0)
const maxDistance = ref<number>(0)
const virtualLeft = ref<number>(0)
const virtualRight = ref<number>(0)
const barTransition = ref<string>('none')
onMounted(() => {
  setTimeout(() => {
    barHeight.value = barRef.value!.offsetHeight
    barWidth.value = props.showSearch ? barRef.value!.offsetWidth - barHeight.value - 5 : barRef.value!.offsetWidth - 5
    searchWidth.value = barRef.value!.offsetWidth - barHeight.value * 0.8 - 5
    borderRadius.value = barHeight.value / 2
    slideWidth.value = (barWidth.value - 6) / listLength.value
    virtualRight.value = slideWidth.value
    maxDistance.value = (barWidth.value - 6) * (listLength.value - 1) / listLength.value
  }, 0)
  setTimeout(() => barTransition.value = 'width .3s, height .3s', 500)
})

// 定时器
let virtualTimer1: number | undefined
let virtualTimer2: number | undefined
let moveSlideTimer: number | undefined
let calculatePosTimer1: number | undefined
let calculatePosTimer2: number | undefined
let backgroundTimer: number | undefined
let clipTimer: number | undefined
const clearTimer = (...args: (number | undefined)[]) => {
  args.forEach(timer => {
    if (timer) {
      clearInterval(timer)
      clearTimeout(timer)
    }
  })
}
onUnmounted(() => clearTimer(virtualTimer1, virtualTimer2, moveSlideTimer, calculatePosTimer1, calculatePosTimer2, backgroundTimer, clipTimer))

// 滑块动画
const backgroundColor = ref<string>('#eee')
const border = ref<string>('none')
const scale = ref<number>(1)
const transition = ref<string>('transform .5s, background .2s')
const clip = ref<string>('0')
const activeIndex = ref<number>(0)
const realPos = ref<number>(0)

const calculateTargetPos = (e: PointerEvent, type: 'start' | 'move') => {
  if (!slideRef.value || !containerRef.value) return
  const clickX = e.clientX - containerRef.value.getBoundingClientRect().left
  const clickLeft = clickX - slideWidth.value / 2
  const realLeft = new DOMMatrix(window.getComputedStyle(slideRef.value).transform).m41
  const targetLeft = clickLeft < 0 ? 0 : clickLeft > (listLength.value - 1) * slideRef.value.offsetWidth ? (listLength.value - 1) * slideRef.value.offsetWidth : clickLeft
  if (type === 'start') {
    transition.value = `transform .5s, background .2s`
    realPos.value = targetLeft
  } else if (Math.abs(targetLeft - realLeft) < (maxDistance.value / 5)) {
    transition.value = `background .2s`
    realPos.value = targetLeft
  } else {
    transition.value = `background .2s`
    realPos.value = realLeft
    calculatePosTimer1 = setInterval(() => {
      const realLeft = new DOMMatrix(window.getComputedStyle(slideRef.value!).transform).m41
      if (Math.abs(targetLeft - realLeft) < (maxDistance.value / 15)) {
        transition.value = `background .2s`
        realPos.value = targetLeft
        clearTimer(calculatePosTimer1, calculatePosTimer2)
      } else {
        realPos.value += (targetLeft - realLeft) > 0 ? maxDistance.value / 15 : -maxDistance.value / 15
      }
    }, 16)
    calculatePosTimer2 = setTimeout(() => clearTimer(calculatePosTimer1), 500)
  }
}
const updateVirtualPos = (duration: number | undefined) => {
  virtualTimer1 = setInterval(() => {
    virtualLeft.value = (slideRef.value?.getBoundingClientRect().left || 0) - (containerRef.value?.getBoundingClientRect().left || 0)
    virtualRight.value = (slideRef.value?.getBoundingClientRect().right || 0) - (containerRef.value?.getBoundingClientRect().left || 0)
  }, 16)
  if (duration) virtualTimer2 = setTimeout(() => clearInterval(virtualTimer1), duration)
}

let startTime: number
const startSlide = (e: PointerEvent) => {
  startTime = Date.now()
  backgroundTimer = setTimeout(() => backgroundColor.value = `linear-gradient(
    to bottom,
    transparent 10%,
    rgba(248, 248, 248, 0.9) 10% calc(100% - 10%),
    transparent calc(100% - 10%)
  )`, 100)
  border.value = '1px solid #fff'
  scale.value = 1.4
  clip.value = '-50%'
  clearTimer(clipTimer)
  calculateTargetPos(e, 'start')
  clearTimer(virtualTimer1, virtualTimer2)
  updateVirtualPos(500)
  document.addEventListener('pointermove', moveSlide)
  document.addEventListener('pointerup', stopSlide)
}
const moveSlide = (e: PointerEvent) => {
  if (moveSlideTimer) return
  if (searchIsActive.value) return searchIsActive.value = false
  clearTimer(calculatePosTimer1, calculatePosTimer2)
  calculateTargetPos(e, 'move')
  clearTimer(virtualTimer1, virtualTimer2)
  updateVirtualPos(undefined)
  moveSlideTimer = setTimeout(() => moveSlideTimer = undefined, 16)
}
const stopSlide = (e: PointerEvent) => {
  if ((Date.now() - startTime) < 100) clearTimer(backgroundTimer)
  backgroundColor.value = '#eee'
  border.value = 'none'
  transition.value = `transform .5s, background .2s`
  scale.value = 1
  clearTimer(clipTimer)
  clipTimer = setTimeout(() => clip.value = '0', Math.min(Date.now() - startTime, 500))
  if (searchIsActive.value) {
    searchIsActive.value = false
  } else {
    const x = e.clientX - containerRef.value!.getBoundingClientRect().left
    const index = Math.floor(x / slideWidth.value)
    activeIndex.value = index > listLength.value - 1 ? listLength.value - 1 : index < 0 ? 0 : index
  }
  clearTimer(calculatePosTimer1, calculatePosTimer2)
  realPos.value = activeIndex.value * slideWidth.value
  clearTimer(virtualTimer1, virtualTimer2)
  updateVirtualPos(500)
  props.onItemClick?.(props.list[activeIndex.value], activeIndex.value)
  document.removeEventListener('pointermove', moveSlide)
  document.removeEventListener('pointerup', stopSlide)
}

// list改变归位
watch(() => props.list.length, () => realPos.value = 0)

// 模式切换
const searchIsActive = ref<boolean>(false)
const searchIsShow = ref<boolean>(false)
const clickSearch = () => {
  searchIsActive.value = true
  realPos.value = 0
}
watch(searchIsActive, (newValue) => {
  if (newValue) setTimeout(() => searchIsShow.value = true, 100)
  else setTimeout(() => searchIsShow.value = false, 200)
})
</script>

<template>
  <div class="TabBar" style="user-select: none;" ref="barRef">
    <div class="bar" :class="{ active: !searchIsActive }" ref="leftRef">
      <ul class="container" ref="containerRef" @pointerdown="startSlide">
        <li class="tab button" v-show="searchIsActive">
          <slot name="bottom" :index="activeIndex"></slot>
        </li>
        <li class="tab" v-for="(item, index) in props.list">
          <slot name="bottom" :item="item" :index="index"></slot>
          <span>{{ item }}</span>
        </li>
        <ul class="container top" v-show="!searchIsActive">
          <div class="slide" ref="slideRef"></div>
          <li class="tab top" v-for="(item, index) in props.list">
            <slot name="top" :item="item" :index="index"></slot>
            <span>{{ item }}</span>
          </li>
        </ul>
      </ul>
    </div>
    <div class="search" :class="{ active: searchIsActive }" v-if="props.showSearch">
      <Button type="search" v-show="!searchIsShow" :onClick="clickSearch" />
      <Search v-if="searchIsShow" />
    </div>
  </div>

</template>

<style scoped>
.TabBar {
  display: flex;
  gap: 5px;
  height: 50px;
  font-size: 8px;
  isolation: isolate;
  --top-color: #0067EC;
}

.bar {
  width: calc(v-bind(barHeight) * 0.8px);
  height: 80%;
  padding: 2px;
  background-color: rgba(248, 248, 248, 0.9);
  backdrop-filter: blur(10px) saturate(1.5);
  border: 1px solid rgba(255, 255, 255, 1);
  border-radius: calc(v-bind(borderRadius) * 1px);
  box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.1);
  cursor: pointer;
  overflow-x: hidden;
  transition: v-bind(barTransition);
}

.bar:not(.active):hover {
  background-color: #eee;
}

.bar.active {
  width: calc(v-bind(barWidth) * 1px);
  height: 100%;
  overflow-x: visible;
}

.search {
  width: calc(v-bind(barHeight) * 1px);
  height: 100%;
  transition: v-bind(barTransition);
}

.search.active {
  width: calc(v-bind(searchWidth) * 1px);
  height: 80%;
}

.container {
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
}

.container.top {
  position: absolute;
  left: 0;
  top: 0;
  clip-path: inset(v-bind(clip) calc(100% - calc(v-bind(virtualRight) * 1px)) v-bind(clip) calc(v-bind(virtualLeft) * 1px) round 22px);
  transform: translateZ(0);
  backface-visibility: hidden;
}

.tab {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: calc(v-bind(slideWidth) * 1px);
  height: 100%;
}

.tab.button {
  flex-shrink: 1;
  height: 100%;
  aspect-ratio: 1 /1;
}

.tab.top {
  position: relative;
  z-index: 1;
  color: var(--top-color);
}

.search .Button {
  width: 100%;
  height: 100%;
  --font-size: calc(v-bind(barHeight) * 1px / 3);
  --transform: translateY(-2px);
}

.search .Search {
  height: 100%;
  background-color: rgba(248, 248, 248, 0.9);
  border: 1px solid #fff;
  box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.1);
  --search-color: #19191a;
  --placeholder-color: #544957;
}

.slide {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 0;
  width: calc(v-bind(slideWidth) * 1px);
  height: 100%;
  background: v-bind(backgroundColor);
  border: v-bind(border);
  border-radius: calc((v-bind(borderRadius) - 3) * 1px);
  transform: translateX(calc(v-bind(realPos) * 1px)) scale(v-bind(scale));
  transition: v-bind(transition);
}
</style>