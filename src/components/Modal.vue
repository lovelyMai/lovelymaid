<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import Card from './Card.vue';

import { watchDOM } from '@/utils/common.js';
import { checkVerticalScroll } from '@/utils/checkScroll';

interface Props {
  /** 类型 */
  type?: 'desktop' | 'mobile'
  /** 是否展开 */
  isOpen: boolean
  /** 是否显示遮罩 */
  showMask?: boolean
  /** 滑动关闭 */
  onSlideClose?: () => void
}
const props = withDefaults(defineProps<Props>(), {
  type: 'desktop',
  showMask: false
});

// Header 高度自适应
const HeaderContainerRef = ref<HTMLElement | null>(null)
const HeaderMarginBottom = ref<string>('60px')
let cleanup: () => void
onMounted(() => {
  if (!HeaderContainerRef.value) return
  cleanup = watchDOM(HeaderContainerRef.value, ({ height }) => {
    HeaderMarginBottom.value = `${height}px`
  }, true)
})
onUnmounted(() => cleanup())

// 上下滚动
const DrawerContainerRef = ref<InstanceType<typeof Card> | null>(null)
const scroll = ref<any | null>(null)
const isTouching = ref<boolean>(false)
onMounted(() => {
  if (props.type === 'desktop') return
  scroll.value = checkVerticalScroll(DrawerContainerRef.value!.$el, 0, ref(true), 500)
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
    if (scroll.value!.speed > 0.1 || (scroll.value!.distance > DrawerContainerRef.value!.$el.offsetHeight / 3 && scroll.value!.speed > -0.1)) {
      props.onSlideClose?.()
    }
  })
})
onUnmounted(() => {
  scroll.value?.cleanup()
})
</script>

<template>
  <div :class="$style.Drawer">
    <transition name="lovelymai-fade">
      <div :class="$style.mask" v-if="props.showMask && props.isOpen"></div>
    </transition>
    <transition name="lovelymai-slide">
      <Card :class="[$style.DrawerContainer, props.type === 'desktop' ? $style.desktop : $style.mobile]" v-show="props.isOpen"
        ref="DrawerContainerRef" type="common"
        :style="isTouching ? { transform: `translateY(${scroll.distance}px)`, transition: 'none' } : undefined">
        <div :class="$style.header">
          <div ref="HeaderContainerRef">
            <slot name="header"></slot>
          </div>
        </div>
        <slot></slot>
      </Card>
    </transition>
  </div>
</template>

<style module>
.Drawer {
  position: relative;
  z-index: 10;
  --width: 50dvw;
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
  z-index: 1;
  height: var(--height);
  overflow-y: auto;
  overscroll-behavior-y: contain;
  scrollbar-width: thin;
  transition: transform .5s cubic-bezier(0.2, 0.8, 0.6, 1);
  will-change: transform;
}

.DrawerContainer.desktop {
  left: calc(50dvw - var(--width) / 2);
  bottom: calc(50dvh - var(--height) / 2);
  width: var(--width);
  border-radius: 38px;
}

.DrawerContainer.mobile {
  left: 0;
  bottom: 0;
  width: 100dvw;
  border-top-left-radius: 38px;
  border-top-right-radius: 38px;
}

.header {
  position: sticky;
  top: 0;
  z-index: 1;
  height: 0;
  margin-bottom: v-bind(HeaderMarginBottom);
  box-shadow: 0 0 calc(v-bind(HeaderMarginBottom) / 2) calc(v-bind(HeaderMarginBottom) / 2) rgba(248, 248, 248, .95);
}
</style>

<style>
.lovelymai-slide-enter-from,
.lovelymai-slide-leave-to {
  transform: translateY(100dvh);
}
</style>