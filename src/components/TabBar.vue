<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';

interface Props {
  /** 列表 */
  list: string[]
  /** 列表项点击事件 */
  onItemClick?: (item: string, index: number) => void
}
const props = defineProps<Props>()

// tab点击动画
const activeIndex = ref<number>(0)
const slideRef = ref<HTMLElement | null>(null)
const translateX = ref<number>(0)
const liveTranslateX = ref<number>(0)
const updateTranslateX = (): number => translateX.value = slideRef.value ? activeIndex.value * slideRef.value.offsetWidth : 0
const updateLiveTranslateX = (): number => liveTranslateX.value = slideRef.value ? new DOMMatrix(window.getComputedStyle(slideRef.value).transform).m41 : 0
let intervalTimer: number | undefined
let outTimer: number | undefined
const clearTimer = () => {
  if (!intervalTimer && !outTimer) return
  clearInterval(intervalTimer)
  clearTimeout(outTimer)
  intervalTimer = undefined
  outTimer = undefined
}
const startSlide = (index: number) => {
  clearTimer()
  activeIndex.value = index
  updateTranslateX()
  intervalTimer = setInterval(updateLiveTranslateX, 8)
  outTimer = setTimeout(() => clearInterval(intervalTimer), 500)
}
const clickTab = (index: number) => {
  startSlide(index)
}
onMounted(() => updateLiveTranslateX())
onUnmounted(() => clearTimer())

// list改变归位
watch(() => props.list.length, () => {
  startSlide(0)
})
</script>

<template>
  <div class="TabBar" :style="{ '--list-length': props.list.length, '--live-translateX': `${liveTranslateX}px` }">
    <ul class="container">
      <li class="tab" v-for="(item, index) in props.list" @click.stop="() => clickTab(index)">
        <slot name="bottom" :item="item" :index="index"></slot>
        <span>{{ item }}</span>
      </li>
    </ul>
    <ul class="container top">
      <li class="tab" v-for="(item, index) in props.list">
        <slot name="top" :item="item" :index="index"></slot>
        <span>{{ item }}</span>
      </li>
    </ul>
    <div class="slide" ref="slideRef" :style="{ '--translateX': `${translateX}px` }" >
    </div>
  </div>
</template>

<style scoped>
.TabBar {
  position: relative;
  z-index: 10;
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
  display: flex;
  position: absolute;
  left: 2px;
  top: 2px;
  z-index: 0;
  width: calc(100% - 4px);
  height: 44px;
  transform: translateZ(0);
  backface-visibility: hidden;
}

.container.top {
  z-index: 2;
  color: var(--top-color);
  will-change: clip-path;
  clip-path: inset(0 calc(calc((100% - 4px) * calc(var(--list-length) - 1) / var(--list-length)) - var(--live-translateX)) 0 var(--live-translateX) round 22px);
}

.tab {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  flex: 1;
}

.slide {
  position: absolute;
  left: 2px;
  top: 2px;
  z-index: 1;
  width: calc((100% - 4px) / var(--list-length));
  height: 44px;
  background-color: #eee;
  border-radius: 22px;
  transform: translateX(var(--translateX));
  transition: transform .5s;
}

</style>