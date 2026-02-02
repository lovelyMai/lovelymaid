<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

interface Props {
  /** 是否显示 */
  visible?: boolean;
  /** 切换按钮点击事件 */
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
const calculateTransform = () => {
  const container = containerRef.value
  if (!container) return
  let left = 0
  let el: HTMLElement | null = container
  while (el) {
    left += el.offsetLeft
    el = el.offsetParent as HTMLElement | null
  }
  containerWidth.value = container.offsetWidth
  transformDistance.value = left + containerWidth.value + 10
}
let timer: number
const delayCalculateTransform = () => {
  clearTimeout(timer)
  timer = setTimeout(() => calculateTransform(), 100)
}
onMounted(() => {
  calculateTransform()
  window.addEventListener('resize', delayCalculateTransform)
})
onUnmounted(() => {
  window.removeEventListener('resize', delayCalculateTransform)
})

</script>

<template>
  <transition name="pop">
    <div v-if="visible" class="SideBar" ref="containerRef"
      :style="{ '--translateX': `${isOpen ? 0 : -transformDistance}px`, userSelect: 'none' }">
      <div class="icon" :class="{ close: !isOpen }" @click="switchSidebar"
        :style="{ transform: isOpen ? 'translateX(0) translateZ(0)' : `translateX(${transformDistance - containerWidth + 45}px) translateZ(0)` }"
        :title="isOpen ? '收起侧边栏' : '展开侧边栏'">
        <span class="iconfont icon-sidebar_left"></span>
      </div>
      <slot>这是内容</slot>
    </div>
  </transition>
</template>

<style scoped>
.SideBar {
  padding-top: 40px;
  background-color: rgba(248, 248, 248, 0.9);
  backdrop-filter: blur(10px) saturate(1.5);
  border: 1px solid #fff;
  border-radius: 20px;
  box-shadow: 0 0 20px 0 rgba(0, 0, 0, .1);
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
  transition:
    transform .5s ease,
    border 0s ease .5s,
    box-shadow .5s ease;
  cursor: pointer;
}

.icon.close {
  border: 1px solid #fff;
  box-shadow: 0 0 10px 2px rgba(0, 0, 0, 0.1);
}

.icon:hover {
  background-color: #eee;
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