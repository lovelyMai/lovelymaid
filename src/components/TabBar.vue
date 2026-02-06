<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

interface Props {
  /** 列表 */
  list: string[]
  /** 列表项点击事件 */
  onItemClick?: (item: string, index: number) => void
}
const props = defineProps<Props>()
const listLength = computed(() => props.list.length)

// 定时器
let virtualTimer1: number | undefined
let virtualTimer2: number | undefined
let moveSlideTimer: number | undefined
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
onUnmounted(() => clearTimer(virtualTimer1, virtualTimer2, moveSlideTimer, backgroundTimer, clipTimer))

// 滑块动画
const slideRef = ref<HTMLElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)

const backgroundColor = ref<string>('#eee')
const border = ref<string>('none')
const scale = ref<number>(1)
const transition = ref<string>('transform .5s, background .2s')
const clip = ref<string>('0px')

const realPos = ref<number>(0)
const virtualLeft = ref<number>(0)
const virtualRight = ref<number>(0)
const slideCenter = computed(() => (virtualLeft.value + virtualRight.value) / 2)
onMounted(() => virtualRight.value = slideRef.value!.offsetWidth)
const maxDistance = computed(() => containerRef.value!.offsetWidth * (listLength.value - 1) / listLength.value)

const calculateTargetPos = (e: PointerEvent) => {
  if (!slideRef.value || !containerRef.value) return
  const x = e.clientX - containerRef.value.getBoundingClientRect().left
  const realLeft = x - slideRef.value!.offsetWidth / 2
  const realRight = realLeft + slideRef.value!.offsetWidth
  realPos.value = realLeft < 0 ? 0 : realRight > listLength.value * slideRef.value.offsetWidth ? (listLength.value - 1) * slideRef.value.offsetWidth : realLeft
}
const updateVirtualPos = (duration: number | undefined) => {
  virtualTimer1 = setInterval(() => {
    virtualLeft.value = (slideRef.value?.getBoundingClientRect().left || 0) - (containerRef.value?.getBoundingClientRect().left || 0)
    virtualRight.value = (slideRef.value?.getBoundingClientRect().right || 0) - (containerRef.value?.getBoundingClientRect().left || 0)
  }, 16)
  if (duration) virtualTimer2 = setTimeout(() => clearInterval(virtualTimer1), duration)
}
const calculateDuration = (e: PointerEvent, maxDuration: number) => {
  const distance = Math.abs(e.clientX - containerRef.value!.getBoundingClientRect().left - slideCenter.value)
  const duration = Math.min(distance / maxDistance.value * maxDuration, maxDuration)
  return duration
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
  transition.value = `transform .5s, background .2s`
  scale.value = 1.4
  clip.value = '-10px'
  clearTimer(clipTimer)
  calculateTargetPos(e)
  clearTimer(virtualTimer1, virtualTimer2)
  updateVirtualPos(500)
  document.addEventListener('pointermove', moveSlide)
  document.addEventListener('pointerup', stopSlide)
}
const followed = ref<boolean>(false)
const moveSlide = (e: PointerEvent) => {
  if (moveSlideTimer) return
  const duration = calculateDuration(e, 500)
  if (duration > 50 && !followed.value) {
  transition.value = `transform ${duration / 1000}s, background .2s`
  console.log(duration);
  } else {
    transition.value = `none`
    followed.value = true
  }
  calculateTargetPos(e)
  clearTimer(virtualTimer1, virtualTimer2)
  updateVirtualPos(undefined)
  moveSlideTimer = setTimeout(() => moveSlideTimer = undefined, 16)
}
const stopSlide = (e: PointerEvent) => {
  if ((Date.now() - startTime) < 100) clearTimer(backgroundTimer)
  backgroundColor.value = '#eee'
  border.value = 'none'
  transition.value = `transform .5s, background .2s`
  followed.value = false
  scale.value = 1
  clearTimer(clipTimer)
  clipTimer = setTimeout(() => clip.value = '0px', Math.min(Date.now() - startTime, 800))
  const x = e.clientX - containerRef.value!.getBoundingClientRect().left
  const index = Math.floor(x / slideRef.value!.offsetWidth)
  const activeIndex = index > listLength.value - 1 ? listLength.value - 1 : index < 0 ? 0 : index
  realPos.value = activeIndex * slideRef.value!.offsetWidth
  clearTimer(virtualTimer1, virtualTimer2)
  updateVirtualPos(500)
  document.removeEventListener('pointermove', moveSlide)
  document.removeEventListener('pointerup', stopSlide)
}

// list改变归位
watch(() => props.list.length, () => realPos.value = 0)
</script>

<template>
  <div class="TabBar">
    <ul class="container" ref="containerRef" @pointerdown="startSlide">
      <li class="tab" v-for="(item, index) in props.list">
        <slot name="bottom" :item="item" :index="index"></slot>
        <span>{{ item }}</span>
      </li>
      <ul class="container top">
        <div class="slide" ref="slideRef">
        </div>
        <li class="tab top" v-for="(item, index) in props.list">
          <slot name="top" :item="item" :index="index"></slot>
          <span>{{ item }}</span>
        </li>
      </ul>
    </ul>
  </div>
</template>

<style scoped>
.TabBar {
  position: relative;
  z-index: 1;
  height: 50px;
  padding: 2px;
  background-color: rgba(248, 248, 248, 0.9);
  backdrop-filter: blur(10px) saturate(1.5);
  border: 1px solid rgba(255, 255, 255, 1);
  border-radius: 25px;
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
  font-size: 8px;

  --top-color: #0067EC;
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
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex: 1;
}

.tab.top {
  position: relative;
  z-index: 1;
  color: var(--top-color);
}

.slide {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 0;
  width: calc(100% / v-bind(listLength));
  height: 100%;
  background: v-bind(backgroundColor);
  border: v-bind(border);
  border-radius: 22px;
  transform: translateX(calc(v-bind(realPos) * 1px)) scale(v-bind(scale));
  transition: v-bind(transition);
}
</style>