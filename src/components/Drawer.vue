<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

import { watchRef } from '@/utils/common.js';
import { checkVerticalScroll } from '@/utils/checkScroll';

interface Props {
  /** 是否展开 */
  isOpen: boolean
  /** 是否显示遮罩 */
  showMask?: boolean
  /** 滑动关闭 */
  onSlideClose: () => void
}
const props = withDefaults(defineProps<Props>(), {
  showMask: false
});

// Header 高度自适应
const HeaderContainerRef = ref<HTMLElement | null>(null)
const HeaderMarginBottom = ref<string>('60px')
onMounted(() => watchRef(HeaderContainerRef, ({ height }) => {
  HeaderMarginBottom.value = `${height}px`
}, true))

// 上下滚动
const DrawerContainerRef = ref<HTMLElement | null>(null)
const scroll = ref<any | null>(null)
const isOpen = ref<boolean>(props.isOpen)
const isTouching = ref<boolean>(false)
watch(() => props.isOpen, (newOpen) => {
  isOpen.value = newOpen
})
onMounted(() => {
  scroll.value = checkVerticalScroll(DrawerContainerRef.value!, 0, ref(true), 500)
  watch(() => scroll.value!.isTouching, async (newTouching) => {
    if (newTouching) {
      isTouching.value = true
      return
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        isTouching.value = false
      })
    })
    if (scroll.value!.speed > 0.1 || (scroll.value!.distance > DrawerContainerRef.value!.offsetHeight / 3 && scroll.value!.speed > -0.1)) {
      props.onSlideClose()
    }
  })
})
onUnmounted(() => {
  scroll.value?.cleanup()
})
</script>

<template>
  <div :class="['lovelymaid', $style.Drawer]">
    <transition name="lovelymaid-fade">
      <div :class="$style.mask" v-if="props.showMask && isOpen"></div>
    </transition>
    <transition name="lovelymaid-slide">
      <div :class="[$style.DrawerContainer, 'lovelymaid-common-container']" ref="DrawerContainerRef" v-show="isOpen"
        :style="isTouching ? { transform: `translateY(${scroll.distance}px)`, transition: 'none' } : undefined">
        <div :class="$style.header">
          <div ref="HeaderContainerRef">
            <slot name="header"></slot>
          </div>
        </div>
        <div :class="$style.content">
          <slot></slot>
        </div>
      </div>
    </transition>
  </div>
</template>

<style module>
.Drawer {
  position: relative;
  z-index: 10;
  --height: 90dvh;
}

.mask {
  position: fixed;
  left: 0;
  top: 0;
  width: 100dvw;
  height: 100dvh;
  background-color: rgba(0, 0, 0, 0.1);
}

.DrawerContainer {
  position: fixed;
  left: 0;
  bottom: 0;
  z-index: 1;
  width: 100dvw;
  height: var(--height);
  border-top-left-radius: 38px;
  border-top-right-radius: 38px;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  scrollbar-width: thin;
  transition: transform .5s cubic-bezier(0.2, 0.8, 0.6, 1);
}

.header {
  position: sticky;
  top: 0;
  z-index: 1;
  height: 0;
  margin-bottom: v-bind(HeaderMarginBottom);
  box-shadow: 0 0 calc(v-bind(HeaderMarginBottom) / 2) calc(v-bind(HeaderMarginBottom) / 2) rgba(248, 248, 248, .95);
}

.content {
  position: relative;
  z-index: 0;
}
</style>

<style>
.lovelymaid-fade-enter-from,
.lovelymaid-fade-leave-to {
  opacity: 0;
}

.lovelymaid-fade-enter-active,
.lovelymaid-fade-leave-active {
  transition: opacity .3s;
}

.lovelymaid-slide-enter-from,
.lovelymaid-slide-leave-to {
  transform: translateY(100%);
}
</style>