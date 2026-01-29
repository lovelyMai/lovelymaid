<script setup lang="ts">
import { ref, onMounted, onUnmounted, Transition } from 'vue'

interface Props {
  /** 是否显示 */
  visible?: boolean;
  /** 点击切换按钮事件 */
  onSwitch?: (value: boolean) => void;
}
const props = withDefaults(defineProps<Props>(), {
  visible: true,
})

// 侧边栏开关状态
const isOpen = ref(true);
const switchSidebar = () => {
  isOpen.value = !isOpen.value;
  props.onSwitch?.(isOpen.value);
}

// 计算侧边栏平移距离
const containerRef = ref<HTMLElement | null>(null)
const containerWidth = ref<number>(0)
const transformDistance = ref<number>(0)
let resizeTimer: number;
const calculateTransform = () => {
  const container = containerRef.value
  if (!container) return
  clearTimeout(resizeTimer)
  resizeTimer = window.setTimeout(() => {
    let left = 0
    let el: HTMLElement | null = container
    while (el) {
      left += el.offsetLeft
      el = el.offsetParent as HTMLElement | null
    }
    containerWidth.value = container.offsetWidth
    transformDistance.value = left + containerWidth.value + 10
  }, 100)
}
onMounted(() => {
  calculateTransform()
  window.addEventListener('resize', calculateTransform)
})
onUnmounted(() => {
  window.removeEventListener('resize', calculateTransform)
})

</script>

<template>
  <transition name="pop">
    <div v-if="visible" class="container" ref="containerRef"
      :style="{ '--translateX': `${isOpen ? 0 : -transformDistance}px`, userSelect: 'none' }">
      <div class="icon" :class="{ close: !isOpen }" @click="switchSidebar"
        :style="{ transform: isOpen ? 'translateX(0)' : `translateX(${transformDistance - containerWidth + 45}px)` }"
        :title="isOpen ? '收起侧边栏' : '展开侧边栏'">
        <span class="iconfont icon-sidebar_left"></span>
      </div>
      <slot>这是内容</slot>
    </div>
  </transition>
</template>

<style scoped>
.container {
  padding-top: 40px;
  background-color: rgba(242, 242, 242, 0.9);
  backdrop-filter: blur(10px) saturate(1.5);
  border: 1px solid rgba(255, 255, 255, 1);
  border-radius: 20px;
  box-shadow: 0 0 5px 2px rgba(0, 0, 0, .1);
  transform: translateX(var(--translateX));
  transition: transform .5s ease, opacity .5s ease;
}

.icon {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 5px;
  right: 5px;
  width: 35px;
  height: 30px;
  border-radius: 15px;
  background-color: rgba(242, 242, 242, 0);
  transition: background-color .1s ease 0s,
    transform .5s ease 0s,
    border 0s ease .5s,
    box-shadow .5s ease 0s;
  cursor: pointer;
}

.icon.close {
  background-color: rgba(242, 242, 242, 0.9);
  border: 1px solid rgba(255, 255, 255, 1);
  box-shadow: 2px 2px 5px 0 rgba(0, 0, 0, 0.1);
}

.icon:hover {
  background-color: rgba(228, 228, 228, 1);
}

.icon-sidebar_left {
  font-size: 20px;
  color: #262626;
}

.pop-enter-from,
.pop-leave-to {
  transform: translateX(var(--translateX)) scale(0);
  opacity: 0;
}
</style>