<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

import Button from './Button.vue'
import Input from './Input.vue'

import { watchRef } from '../utils/common';
import { getLayoutLeftInViewport } from '../utils/getOffsetInViewport';

interface Props {
  /** 列表 */
  list: string[]
  /** 列表项点击事件 */
  onItemClick?: (item: string, index: number) => void
  /** 是否启用搜索按钮 */
  showSearch?: boolean
  /** 挂载时激活索引 */
  initialIndex?: number
}
const props = withDefaults(defineProps<Props>(), {
  initialIndex: 0
})
const listLength = computed(() => props.list.length)

// 初始化
const BarRef = ref<HTMLElement | null>(null)
const barWidth = ref<number>(0)
const barHeight = ref<number>(0)
const searchWidth = ref<number>(0)
const borderRadius = ref<number>(0)
const SlideRef = ref<HTMLElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)
const slideWidth = ref<number>(0)
const maxDistance = ref<number>(0)
const virtualLeft = ref<number>(0)
const virtualRight = ref<number>(0)
const barTransition = ref<string>('none')
const activeIndex = ref<number>(props.initialIndex)
const targetPos = ref<number>(0)
let slideCenter: number
onMounted(() => {
  cleanup = watchRef(BarRef, () => {
    barHeight.value = BarRef.value!.offsetHeight
    barWidth.value = props.showSearch ? BarRef.value!.offsetWidth - barHeight.value - 5 : BarRef.value!.offsetWidth
    searchWidth.value = BarRef.value!.offsetWidth - barHeight.value * 0.8 - 5
    borderRadius.value = barHeight.value / 2
    slideWidth.value = (barWidth.value - 6) / listLength.value
    virtualLeft.value = activeIndex.value * slideWidth.value
    virtualRight.value = virtualLeft.value + slideWidth.value
    maxDistance.value = (barWidth.value - 6) * (listLength.value - 1) / listLength.value
    targetPos.value = activeIndex.value * slideWidth.value
    slideCenter = targetPos.value + slideWidth.value / 2
  }, true)
  setTimeout(() => barTransition.value = 'width .3s, height .3s, transform .2s', 500)
})

// 定时器
let virtualTimer1: number | undefined
let virtualTimer2: number | undefined
let moveSlideTimer: number | undefined
let calculatePosTimer: number | undefined
let backgroundTimer: number | undefined
let cleanup: () => void
const clearTimer = (...args: (number | undefined)[]) => {
  args.forEach(timer => {
    if (timer) {
      clearInterval(timer)
      clearTimeout(timer)
    }
  })
}
onUnmounted(() => {
  clearTimer(virtualTimer1, virtualTimer2, moveSlideTimer, calculatePosTimer, backgroundTimer)
  cleanup()
})

// 滑块动画
const background = ref<string>('#e4e4e6')
const barBackgroundColor = ref<string>('rgba(248, 248, 248, 0.9)')
const border = ref<string>('none')
const boxShadow = ref<string>('none')
const barScale = ref<number>(1)
const slideScale = ref<number>(1)
const textScale = computed<number>(() => slideScale.value === 1.2 ? 1.1 : 1)
const slideTransition = ref<string>('background .1s')

let followed = false
const calculateTargetPos = (e: PointerEvent, type: 'start' | 'move') => {
  if (!SlideRef.value || !containerRef.value) return
  const clickX = e.clientX - getLayoutLeftInViewport(containerRef.value)
  const clickLeft = clickX - slideWidth.value / 2
  const realLeft = new DOMMatrix(window.getComputedStyle(SlideRef.value).transform).m41
  const targetLeft = clickLeft < 0 ? 0 : clickLeft > (listLength.value - 1) * slideWidth.value ? (listLength.value - 1) * slideWidth.value : clickLeft
  if (type === 'start') {
    slideTransition.value = `transform .5s, background .1s`
    targetPos.value = targetLeft
  } else if (followed || Math.abs(targetLeft - realLeft) < (maxDistance.value / 5)) {
    slideTransition.value = `background .1s`
    targetPos.value = targetLeft
    followed = true
  } else {
    slideTransition.value = `background .1s`
    targetPos.value = realLeft
    calculatePosTimer = setInterval(() => {
      const realLeft = new DOMMatrix(window.getComputedStyle(SlideRef.value!).transform).m41
      if (Math.abs(targetLeft - realLeft) < (maxDistance.value / 5)) {
        slideTransition.value = `background .1s`
        targetPos.value = targetLeft
        followed = true
        clearTimer(calculatePosTimer)
      } else {
        targetPos.value += (targetLeft - realLeft) > 0 ? maxDistance.value / 5 : -maxDistance.value / 5
      }
    }, 8)
  }
}
const updateVirtualPos = (duration: number | undefined) => {
  const calc = () => {
    const realLeft = new DOMMatrix(window.getComputedStyle(SlideRef.value!).transform).m41
    slideCenter = realLeft + slideWidth.value / 2
    const virtualWidth = slideWidth.value * 1.2 / 1.1
    virtualLeft.value = slideCenter - virtualWidth / 2
    virtualRight.value = slideCenter + virtualWidth / 2
  }
  if (duration) {
    clearInterval(virtualTimer1)
    virtualTimer1 = setInterval(() => {
      calc()
    }, 8)
    virtualTimer2 = setTimeout(() => clearInterval(virtualTimer1), duration)
  } else {
    clearInterval(virtualTimer1)
    if (followed) {
      calc()
    } else {
      virtualTimer1 = setInterval(() => {
        calc()
      }, 8)
    }
  }
}

let startTime: number
const startSlide = (e: PointerEvent) => {
  startTime = Date.now()
  backgroundTimer = setTimeout(() => {
    background.value = '#fff'
  }, 100)
  barBackgroundColor.value = '#fff'
  border.value = '1px solid rgba(255, 255, 255, 0.5)'
  boxShadow.value = '0 0 10px 0 rgba(0, 0, 0, 0.1)'
  barScale.value = 1.05
  slideScale.value = 1.2
  calculateTargetPos(e, 'start')
  clearTimer(virtualTimer1, virtualTimer2)
  updateVirtualPos(500)
  document.addEventListener('pointermove', moveSlide)
  document.addEventListener('pointerup', stopSlide)
}
const moveSlide = (e: PointerEvent) => {
  if (moveSlideTimer) return
  if (searchIsActive.value) return searchIsActive.value = false
  clearTimer(calculatePosTimer)
  calculateTargetPos(e, 'move')
  clearTimer(virtualTimer1, virtualTimer2)
  updateVirtualPos(undefined)
  moveSlideTimer = setTimeout(() => moveSlideTimer = undefined, 8)
}
const stopSlide = (e: PointerEvent) => {
  if ((Date.now() - startTime) < 100) clearTimer(backgroundTimer)
  background.value = '#e4e4e6'
  barBackgroundColor.value = 'rgba(248, 248, 248, 0.9)'
  border.value = 'none'
  boxShadow.value = 'none'
  slideTransition.value = `transform .5s, background .1s`
  barScale.value = 1
  slideScale.value = 1
  if (searchIsActive.value) {
    searchIsActive.value = false
  } else {
    const clickX = e.clientX - getLayoutLeftInViewport(containerRef.value)
    const index = Math.floor(clickX / slideWidth.value)
    activeIndex.value = index > listLength.value - 1 ? listLength.value - 1 : index < 0 ? 0 : index
  }
  clearTimer(calculatePosTimer)
  targetPos.value = activeIndex.value * slideWidth.value
  followed = false
  clearTimer(virtualTimer1, virtualTimer2)
  updateVirtualPos(500)
  props.onItemClick?.(props.list[activeIndex.value], activeIndex.value)
  document.removeEventListener('pointermove', moveSlide)
  document.removeEventListener('pointerup', stopSlide)
}

// list改变归位
watch(() => props.list.length, () => targetPos.value = 0)

// 模式切换
const searchIsActive = ref<boolean>(false)
const searchIsShow = ref<boolean>(false)
const clickSearch = () => {
  searchIsActive.value = true
  targetPos.value = 0
}
watch(searchIsActive, (newValue) => {
  if (newValue) setTimeout(() => searchIsShow.value = true, 100)
  else setTimeout(() => searchIsShow.value = false, 200)
})

// 暴露内部方法
defineExpose({
  clickTab: (index: number) => {
    activeIndex.value = index
    clearTimer(calculatePosTimer)
    targetPos.value = index * slideWidth.value
    clearTimer(virtualTimer1, virtualTimer2)
    updateVirtualPos(500)
    props.onItemClick?.(props.list[index], index)
  }
})
</script>

<template>
  <div :class="$style.TabBar" ref="BarRef">
    <div :class="[$style.bar, 'lovelymaid-glass-container', { [$style.active]: !searchIsActive }]">
      <ul :class="$style.container" ref="containerRef" @pointerdown="startSlide">
        <li :class="[$style.tab, $style.small]" v-show="searchIsActive">
          <slot name="bottom" :index="activeIndex"></slot>
        </li>
        <li :class="$style.tab" v-for="(item, index) in props.list" :key="index">
          <slot name="bottom" :item="item" :index="index"></slot>
          <span>{{ item }}</span>
        </li>
        <div :class="$style.slide" ref="SlideRef" v-show="!searchIsActive"></div>
        <ul :class="[$style.container, $style.top]" v-show="!searchIsActive">
          <li :class="[$style.tab, $style.top]" v-for="(item, index) in props.list" :key="'top-' + index">
            <slot name="top" :item="item" :index="index"></slot>
            <span>{{ item }}</span>
          </li>
        </ul>
      </ul>
    </div>
    <div :class="[$style.search, { [$style.active]: searchIsActive }]" v-if="props.showSearch">
      <Button type="glass" :class="$style.Button" v-show="!searchIsShow" :onClick="clickSearch">
        <span class="lovelymaid lovelymaid-search button"></span>
      </Button>
      <Input :class="$style.Search" v-show="searchIsShow" enterkeyhint="search">
        <span class="lovelymaid lovelymaid-search input"></span>
      </Input>
    </div>
  </div>
</template>

<style module>
.TabBar {
  display: flex;
  gap: 5px;
  height: 50px;
  font-size: 8px;
  user-select: none;
  -webkit-user-select: none;
  --top-color: #0067EC;
}

.bar {
  z-index: 1;
  width: calc(v-bind(barHeight) * 0.8px);
  height: 80%;
  padding: 2px;
  background-color: v-bind(barBackgroundColor) !important;
  border-radius: calc(v-bind(borderRadius) * 1px);
  cursor: pointer;
  overflow: hidden;
  transition: v-bind(barTransition);
}

.bar.active {
  width: calc(v-bind(barWidth) * 1px);
  height: 100%;
  overflow: visible;
  transform: scale(v-bind(barScale));
}

.bar:not(.active):active {
  transform: scale(1.2);
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
  touch-action: none;
}

.container.top {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 1;
  clip-path: inset(0 calc(100% - v-bind(virtualRight) * 1px) 0 calc(v-bind(virtualLeft) * 1px) round calc((v-bind(borderRadius) - 3) * 1px));
  transform: translateZ(0) scale(v-bind(textScale));
  transform-origin: calc(v-bind(slideCenter) * 1px) center;
  transition: transform .2s;
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

.tab.small {
  flex-shrink: 1;
  height: 100%;
  aspect-ratio: 1 /1;
}

.tab.top {
  color: var(--top-color);
}

.search .Button {
  width: 100%;
  height: 100%;
}

.search .Search {
  height: 100%;
  --font-size: 18px;
}

.slide {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 0;
  width: calc(v-bind(slideWidth) * 1px);
  height: 100%;
  background: v-bind(background);
  border: v-bind(border);
  border-radius: calc((v-bind(borderRadius) - 3) * 1px);
  box-shadow: v-bind(boxShadow);
  transform: translateX(calc(v-bind(targetPos) * 1px)) scale(v-bind(slideScale));
  transition: v-bind(slideTransition);
}
</style>
<style scoped>
.button.lovelymaid-search {
  font-size: calc(v-bind(barHeight) * 0.4px);
}

.input.lovelymaid-search {
  font-size: 24px;
}
</style>