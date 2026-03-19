<script setup lang="ts">
import { computed, inject, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

import checkSrcoll from '@/utils/app-router/checkScroll'
import { HistoryStack } from '@/utils/app-router/createAppRouter';
import debounce from '../common/debounce';

const router = inject('router') as HistoryStack

// 加入页面
const isPushing = ref<boolean>(false)
router.onPush(() => isPushing.value = true)

// 移除页面
const isClickLeaving = ref<boolean>(false)
const delayRecoverIsLeaving = debounce(() => isLeaving.value = false, 300)
router.onPop(() => {
  isLeaving.value = true
  isClickLeaving.value = true
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
  cleanup = checkSrcoll(10, async (distance, speed, scrolling) => {
    if (router.currentPath === router.currentStack[0].path) return
    isPushing.value = false
    slideDistance.value = distance
    slideSpeed.value = speed
    isTouching.value = scrolling
  })
})
watch(slideDistance, (newDistance, oldDistance) => {
  if (!newDistance) {
    if (slideSpeed.value > 0.1 || (oldDistance as number > 200 && slideSpeed.value > -0.1)) {
      isLeaving.value = true
      setTimeout(() => {
        router.pop()
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
const bottomPath = computed(() => router.currentStack.length - 2 >= 0 ? router.currentStack[router.currentStack.length - 2].path : undefined)
watch(() => router.currentPath, (newPath, oldPath) => {
  if (oldPath) {
    const oldPathIsInStack = router.pathIn(oldPath)
    scrollPositions.value[oldPath] = oldPathIsInStack
      ? document.documentElement.scrollTop
      : 0
  }
  const delay = isPushing.value ? 300 : 0
  setTimeout(() => document.documentElement.scrollTop = scrollPositions.value[newPath] || 0, delay)
})
watch(isTouching, async (newTouching) => {
  if (newTouching) {
    scrollPositions.value[router.currentPath] = document.documentElement.scrollTop
    document.documentElement.scrollTop = bottomPath.value ? scrollPositions.value[bottomPath.value] : 0
  } else {
    await nextTick()
    if (isLeaving.value) return
    setTimeout(() => document.documentElement.scrollTop = scrollPositions.value[router.currentPath] || 0, 300)
  }
})
watch(isClickLeaving, async (newClickLeaving) => {
  if (newClickLeaving) {
    scrollPositions.value[router.currentPath] = document.documentElement.scrollTop
    await nextTick()
    document.documentElement.scrollTop = bottomPath.value ? scrollPositions.value[bottomPath.value] : 0
    isClickLeaving.value = false
  }
})

</script>

<template>
  <component v-for="component in router.allComponents" :is="component.value" v-bind="component.props"
    :key="component.path"
    v-show="component.path === router.currentPath || ((isPushing || isPopping) && component.path === router.currentStack[router.currentStack.length - 2]?.path)"
    :style="component.path === router.currentPath && component.path !== router.currentStack[0].path ? {
      position: isPopping ? 'fixed' : undefined,
      top: isPopping ? `${-scrollPositions[router.currentPath]}px` : undefined,
      boxShadow: '0 0 20px 0 rgba(0, 0, 0, .1)',
      transition: !isTouching && (isReturning || isLeaving) ? 'transform .3s' : 'none',
      transform: isTouching ? `translateX(${slideDistance}px) translateZ(0)` : isReturning ? `translateX(0) translateZ(0)` : isLeaving ? `translateX(100dvw) translateZ(0)` : undefined
    } : undefined" :class="{ pushAnimation: isPushing && component.path === router.currentPath }"
    @animationend="() => isPushing = false" />
</template>

<style scoped>
@keyframes push {
  from {
    position: fixed;
    top: 0;
    transform: translateX(100dvw);
  }

  to {
    position: fixed;
    top: 0;
    transform: translateX(0);
  }
}

.pushAnimation {
  animation: push .3s;
}
</style>