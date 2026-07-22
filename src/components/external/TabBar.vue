<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import Card from './Card.vue';
import Button from './Button.vue'
import Input from './Input.vue'

import { clearTimer, watchDOM } from '@/utils/common';
import { getLayoutLeft } from '@/utils/getLayoutOffset.js';
import useCssVar from '@/utils/useCssVar';

export type TabItem = { id: string, name?: string, [key: string]: any }
interface Props {
  /** 标签 */
  tabs: TabItem[]
  /** 是否启用搜索按钮 */
  showSearch?: boolean
  /** 输入框提示词 */
  placeholder?: string
  /** 列表项按压事件 */
  onActiveTabPress?: (newIndex: number) => void
  /** 搜索事件 */
  onSearch?: () => void
}
const props = defineProps<Props>()
const activeIndex = defineModel<number>('active-index', { required: true })
const inputValue = defineModel<string>('value', { default: '' })

// 初始化
const TabBarRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)
const SlideRef = ref<HTMLElement | null>(null)
const style = reactive({
  Bar: {
    width: 0,
    height: 0,
    'border-radius': 0,
    'background-color': 'var(--color-gray-100)',
    scale: 1,
    transition: 'none'
  },
  slide: {
    width: 0,
    background: 'var(--color-gray-200)',
    border: 'none',
    'box-shadow': 'none',
    translateX: 0,
    scale: 1,
    transition: 'background .1s',
    center: 0,
  },
  search: {
    width: 0,
  },
  'content-top': {
    clipLeft: 0,
    clipRight: 0,
    get scale() {
      return style.slide.scale === 1.2 ? 1.1 : 1
    }
  }
})
const maxDistance = ref<number>(0)
let cleanup: () => void
let virtualTimer1: number | undefined
let virtualTimer2: number | undefined
let moveSlideTimer: number | undefined
let calculatePosTimer: number | undefined
let backgroundTimer: number | undefined
onMounted(() => {
  if (!TabBarRef.value) return
  cleanup = watchDOM(TabBarRef.value, () => {
    style.Bar.width = props.showSearch ? TabBarRef.value!.offsetWidth - style.Bar.height - 5 : TabBarRef.value!.offsetWidth
    style.Bar.height = TabBarRef.value!.offsetHeight
    style.search.width = TabBarRef.value!.offsetWidth - style.Bar.height * 0.8 - 5
    style.Bar['border-radius'] = style.Bar.height / 2
    style.slide.width = (style.Bar.width - 6) / props.tabs.length
    style['content-top'].clipLeft = activeIndex.value * style.slide.width
    style['content-top'].clipRight = style['content-top'].clipLeft + style.slide.width
    maxDistance.value = (style.Bar.width - 6) * (props.tabs.length - 1) / props.tabs.length
    style.slide.translateX = activeIndex.value * style.slide.width
    style.slide.center = style.slide.translateX + style.slide.width / 2
  })
  useCssVar(TabBarRef.value, style)
  setTimeout(() => {
    style.Bar.transition = 'width .3s, height .3s, transform .2s'
  }, 500)
})
onUnmounted(() => {
  cleanup()
  clearTimer(virtualTimer1, virtualTimer2, moveSlideTimer, calculatePosTimer, backgroundTimer)
})

// 滑块动画
let followed = false
let moved = false
let startTime: number
const calculateTargetPos = (e: PointerEvent, type: 'start' | 'move') => {
  if (!SlideRef.value || !contentRef.value) return
  const clickX = e.pageX - getLayoutLeft(contentRef.value)
  const clickLeft = clickX - style.slide.width / 2
  const realLeft = new DOMMatrix(window.getComputedStyle(SlideRef.value).transform).m41
  const targetLeft = clickLeft < 0 ? 0 : clickLeft > (props.tabs.length - 1) * style.slide.width ? (props.tabs.length - 1) * style.slide.width : clickLeft
  if (type === 'start') {
    style.slide.transition = `transform .5s, background .1s`
    style.slide.translateX = targetLeft
  } else if (followed || Math.abs(targetLeft - realLeft) < (maxDistance.value / 10)) {
    style.slide.transition = `background .1s`
    style.slide.translateX = targetLeft
    followed = true
  } else {
    style.slide.transition = `background .1s`
    style.slide.translateX = realLeft
    calculatePosTimer = setInterval(() => {
      const realLeft = new DOMMatrix(window.getComputedStyle(SlideRef.value!).transform).m41
      if (Math.abs(targetLeft - realLeft) < (maxDistance.value / 10)) {
        style.slide.transition = `background .1s`
        style.slide.translateX = targetLeft
        followed = true
        clearTimer(calculatePosTimer)
      } else {
        style.slide.translateX += (targetLeft - realLeft) > 0 ? maxDistance.value / 10 : -maxDistance.value / 10
      }
    }, 8)
  }
}
const updateVirtualPos = (duration: number | undefined) => {
  const calc = () => {
    const realLeft = new DOMMatrix(window.getComputedStyle(SlideRef.value!).transform).m41
    style.slide.center = realLeft + style.slide.width / 2
    const virtualWidth = style.slide.width * 1.2 / 1.1
    style['content-top'].clipLeft = style.slide.center - virtualWidth / 2
    style['content-top'].clipRight = style.slide.center + virtualWidth / 2
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
const runStopAnimation = (stopIndex: number) => {
  style.slide.transition = `transform .5s, background .1s`
  clearTimer(calculatePosTimer)
  style.slide.translateX = stopIndex * style.slide.width
  clearTimer(virtualTimer1, virtualTimer2)
  updateVirtualPos(500)
}
const startSlide = (e: PointerEvent) => {
  startTime = Date.now()
  backgroundTimer = setTimeout(() => {
    style.slide.background = '#fff'
  }, 100)
  style.Bar['background-color'] = '#fff'
  style.slide.border = '1px solid rgba(255, 255, 255, 0.5)'
  style.slide['box-shadow'] = '0 0 10px 0 rgba(0, 0, 0, 0.1)'
  style.Bar.scale = 1.05
  style.slide.scale = 1.2
  calculateTargetPos(e, 'start')
  clearTimer(virtualTimer1, virtualTimer2)
  updateVirtualPos(500)
  document.addEventListener('pointermove', moveSlide)
  document.addEventListener('pointerup', stopSlide)
}
const moveSlide = (e: PointerEvent) => {
  if (moveSlideTimer) return
  moved = true
  if (searchIsActive.value) {
    searchIsActive.value = false
    return
  }
  clearTimer(calculatePosTimer)
  calculateTargetPos(e, 'move')
  clearTimer(virtualTimer1, virtualTimer2)
  updateVirtualPos(undefined)
  moveSlideTimer = setTimeout(() => {
    moveSlideTimer = undefined
  }, 8)
}
const stopSlide = (e: PointerEvent) => {
  if ((Date.now() - startTime) < 100) {
    clearTimer(backgroundTimer)
  }
  style.slide.background = 'var(--color-gray-200)'
  style.Bar['background-color'] = 'var(--color-gray-100)'
  style.slide.border = 'none'
  style.slide['box-shadow'] = 'none'
  style.Bar.scale = 1
  style.slide.scale = 1
  if (searchIsActive.value) {
    searchIsActive.value = false
    runStopAnimation(activeIndex.value)
  } else {
    if (!contentRef.value) return
    const clickX = e.pageX - getLayoutLeft(contentRef.value)
    const index = Math.floor(clickX / style.slide.width)
    const oldActiveIndex = activeIndex.value
    const newActiveIndex = index > props.tabs.length - 1 ? props.tabs.length - 1 : index < 0 ? 0 : index
    activeIndex.value = newActiveIndex
    if (oldActiveIndex === newActiveIndex) {
      runStopAnimation(newActiveIndex)
      if (!moved) {
        props.onActiveTabPress?.(newActiveIndex)
      }
    }
  }
  moved = false
  followed = false
  document.removeEventListener('pointermove', moveSlide)
  document.removeEventListener('pointerup', stopSlide)
}
watch(activeIndex, (newIndex) => {
  runStopAnimation(newIndex)
})
watch(() => props.tabs.length, () => {
  style.slide.translateX = 0
})

// 模式切换
const searchIsActive = ref<boolean>(false)
const searchIsShow = ref<boolean>(false)
const clickSearch = () => {
  searchIsActive.value = true
  style.slide.translateX = 0
}
watch(searchIsActive, (newValue) => {
  if (newValue) {
    setTimeout(() => searchIsShow.value = true, 100)
  }
  else {
    setTimeout(() => searchIsShow.value = false, 200)
  }
})
</script>

<template>
  <div :class="$style.TabBar" ref="TabBarRef">
    <Card :class="[$style.Bar, { [$style.active]: !searchIsActive }]" type="glass">
      <ul :class="$style.content" ref="contentRef" @pointerdown.prevent="startSlide">
        <li :class="[$style.tab, $style.small]" v-show="searchIsActive">
          <slot :item="props.tabs[activeIndex]" :index="activeIndex"></slot>
        </li>
        <li :class="$style.tab" v-for="(item, index) in props.tabs" :key="index">
          <slot :item="item" :index="index"></slot>
          <span v-if="item.name">{{ item.name }}</span>
        </li>
        <div :class="$style.slide" ref="SlideRef" v-show="!searchIsActive"></div>
        <ul :class="[$style.content, $style.top]" v-show="!searchIsActive">
          <li :class="[$style.tab, $style.top]" v-for="(item, index) in props.tabs" :key="index">
            <slot :item="item" :index="index"></slot>
            <span v-if="item.name">{{ item.name }}</span>
          </li>
        </ul>
      </ul>
    </Card>
    <div :class="[$style.search, { [$style.active]: searchIsActive }]" v-if="props.showSearch">
      <Button type="glass" :class="$style.Button" v-show="!searchIsShow" :on-click="clickSearch">
        <span class="lovelymai lovely-search button"></span>
      </Button>
      <Input :class="$style.Input" v-show="searchIsShow" type="text" v-model:value="inputValue"
        :placeholder="props.placeholder" enterkeyhint="search" :on-enter="props.onSearch">
        <span class="lovelymai lovely-search input"></span>
      </Input>
    </div>
  </div>
</template>

<style module>
.TabBar {
  display: flex;
  gap: 5px;
  height: 50px;
  user-select: none;
  -webkit-user-select: none;
  --font-size: 10px;
  --top-color: var(--color-blue-300);
}

.Bar {
  width: calc(var(--Bar-height) * 0.8px);
  height: 80%;
  padding: 2px;
  background-color: var(--Bar-background-color) !important;
  border-radius: calc(var(--Bar-border-radius) * 1px);
  cursor: pointer;
  overflow: hidden;
  transition: var(--Bar-transition);
}

.Bar.active {
  width: calc(var(--Bar-width) * 1px);
  height: 100%;
  overflow: visible;
  transform: scale(var(--Bar-scale));
}

.Bar:not(.active):active {
  transform: scale(1.2);
}

.search {
  width: calc(var(--Bar-height) * 1px);
  height: 100%;
  transition: var(--Bar-transition);
}

.search.active {
  width: calc(var(--search-width) * 1px);
  height: 80%;
}

.content {
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  touch-action: none;
}

.content.top {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 1;
  clip-path: inset(0 calc(100% - var(--content-top-clipRight) * 1px) 0 calc(var(--content-top-clipLeft) * 1px) round calc((var(--Bar-border-radius) - 3) * 1px));
  transform: translateZ(0) scale(var(--content-top-scale));
  transform-origin: calc(var(--slide-center) * 1px) center;
  transition: transform .2s;
  backface-visibility: hidden;
}

.tab {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: calc(var(--slide-width) * 1px);
  height: 100%;
}

.tab :nth-child(2) {
  font-size: var(--font-size);
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

.search .Input {
  height: 100%;
  --font-size: 18px;
}

.slide {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 0;
  width: calc(var(--slide-width) * 1px);
  height: 100%;
  background: var(--slide-background);
  border: var(--slide-border);
  border-radius: calc((var(--Bar-border-radius) - 3) * 1px);
  box-shadow: var(--slide-box-shadow);
  transform: translateX(calc(var(--slide-translateX) * 1px)) scale(var(--slide-scale));
  transition: var(--slide-transition);
}
</style>