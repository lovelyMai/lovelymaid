<script setup lang="ts">
import { computed, inject, nextTick, onMounted, onUnmounted, ref, toRefs, watch } from 'vue'

import checkSrcoll from '@/app-router/checkScroll'
import { popNow } from '@/app-router/createAppRouter';
import { HistoryStack } from '@/app-router/createAppRouter';
import debounce from '../utils/common/debounce';

interface Props {
  /** 动画期间的 z-index */
  animatingZIndex?: number | string
}
const props = withDefaults(defineProps<Props>(), {
  animatingZIndex: 1
})

const router = inject('router') as HistoryStack

// 加入页面
const isPushing = ref<boolean>(false)
router.onPush(() => isPushing.value = true)

// Pop 以移除页面
const delayRecoverIsLeaving = debounce(() => isLeaving.value = false, 300)
router.onPop(() => {
  isLeaving.value = true
  delayRecoverIsLeaving()
})

// 右滑返回手势
const slideDistance = ref<number | undefined>(undefined)
const slideSpeed = ref<number>(0)
const isTouching = ref<boolean>(false)
const isReturning = ref<boolean>(false)
const isLeaving = ref<boolean>(false)
const isPopping = computed<boolean>(() => (isTouching.value || isReturning.value || isLeaving.value))
let cleanup: () => void
onMounted(() => {
  cleanup = checkSrcoll(10, async (distance, speed, touching) => {
    if (router.currentPath === router.currentStack[0].path) return
    slideDistance.value = distance
    slideSpeed.value = speed
    isTouching.value = touching
  })
})
watch(slideDistance, (newDistance, oldDistance) => {
  if (!newDistance) {
    if (slideSpeed.value > 0.1 || (oldDistance as number > 200 && slideSpeed.value > -0.1)) {
      isLeaving.value = true
      setTimeout(() => {
        popNow()
        isLeaving.value = false
      }, 300)
    } else {
      isReturning.value = true
      setTimeout(() => isReturning.value = false, 300)
    }
  }
})
onUnmounted(() => {
  cleanup()
})

// 恢复页面滚动位置
const scrollPositions = ref<Record<string, number>>({})
const isAnimating = computed<boolean>(() => isPushing.value || isPopping.value)
const bottomPath = computed(() => router.currentStack.length - 2 >= 0 ? router.currentStack[router.currentStack.length - 2].path : undefined)
watch(() => router.currentPath, (newPath, oldPath) => {
  const oldPathIsInStack = router.pathIn(oldPath)
  if (oldPath) {
    scrollPositions.value[oldPath] = oldPathIsInStack
      ? document.documentElement.scrollTop
      : 0
  }
  if (oldPathIsInStack) {
    const delay = isPushing.value ? 300 : 0
    setTimeout(() => {
      if (!isTouching.value) {
        document.documentElement.scrollTop = scrollPositions.value[newPath] || 0
      }
    }, delay)
  }
})
watch(isTouching, async (newTouching) => {
  if (newTouching) {
    scrollPositions.value[router.currentPath] = isPushing.value ? 0 : document.documentElement.scrollTop
    await nextTick()
    document.documentElement.scrollTop = scrollPositions.value[bottomPath.value!]
    isPushing.value = false
  } else {
    await nextTick()
    if (isLeaving.value) return
    setTimeout(() => document.documentElement.scrollTop = scrollPositions.value[router.currentPath] || 0, 300)
  }
})
router.onPop(async () => {
  scrollPositions.value[router.currentPath] = document.documentElement.scrollTop
  await nextTick()
  document.documentElement.scrollTop = bottomPath.value ? scrollPositions.value[bottomPath.value] : 0
})
</script>

<template>
  <component v-for="component in router.allComponents" :is="component.value" v-bind="component.props"
    :key="component.path"
    v-show="component.path === router.currentPath || (isAnimating && component.path === router.currentStack[router.currentStack.length - 2]?.path)"
    :style="component.path === router.currentPath && component.path !== router.currentStack[0].path ? {
      position: isAnimating ? 'fixed' : undefined,
      top: isAnimating ? `${-scrollPositions[router.currentPath]}px` : undefined,
      zIndex: isAnimating ? props.animatingZIndex : undefined,
      boxShadow: '0 0 20px 0 rgba(0, 0, 0, .1)',
      transition: !isTouching && (isReturning || isLeaving) ? 'transform .3s' : 'none',
      transform: isTouching ? `translateX(${slideDistance}px)` : isReturning ? `translateX(0)` : isLeaving ? `translateX(100dvw)` : undefined,
    } : undefined" :class="{ pushAnimation: isPushing && component.path === router.currentPath }"
    @animationend="() => isPushing = false" />
</template>

<style scoped>
@keyframes push {
  from {
    transform: translateX(100dvw);
  }

  to {
    transform: translateX(0);
  }
}

.pushAnimation {
  animation: push .3s;
}
</style>