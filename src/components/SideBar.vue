<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

import { debounce } from '@/utils/common';
import { getLayoutLeftInViewport } from '@/utils/getOffsetInViewport';

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
const isOpen = ref<boolean>(true);
const switchSideBar = () => {
  isOpen.value = !isOpen.value;
  props.onSwitch?.(isOpen.value);
}

// 计算侧边栏平移距离
const ContainerRef = ref<HTMLElement | null>(null)
const ContainerWidth = ref<number>(0)
const transition = ref<string>('none')
const TransformDistance = ref<number>(0)
const translateX = computed<string>(() => isOpen.value ? '0' : `${-TransformDistance.value}px`)
const calculateTransform = () => {
  if (!ContainerRef.value) return
  ContainerWidth.value = ContainerRef.value.offsetWidth
  TransformDistance.value = getLayoutLeftInViewport(ContainerRef.value) + ContainerWidth.value + 10
  console.log(getLayoutLeftInViewport(ContainerRef.value), ContainerWidth.value);
}
const delayCalculateTransform = debounce(calculateTransform, 100)
onMounted(() => {
  calculateTransform()
  setTimeout(() => transition.value = 'transform .5s', 100)
  window.addEventListener('resize', delayCalculateTransform)
})
onUnmounted(() => {
  window.removeEventListener('resize', delayCalculateTransform)
})

// 添加动画钩子
const beforeEnter = () => {
  transition.value = isOpen.value ? 'transform .3s' : 'transform .5s'
}
const afterEnter = () => {
  transition.value = 'transform .5s'
}
const beforeLeave = () => {
  transition.value = isOpen.value ? 'transform .3s' : 'transform .5s'
}
const afterLeave = () => {
  transition.value = 'transform .5s'
}
</script>

<template>
  <transition name="lovelymaid-pop" @before-enter="beforeEnter" @after-enter="afterEnter" @before-leave="beforeLeave"
    @after-leave="afterLeave">
    <div v-show="props.visible" :class="[$style.SideBar, 'lovelymaid-glass-container']" ref="ContainerRef">
      <div :class="$style.header">
        <div :class="[$style.SwitchButton, { [$style.close]: !isOpen }]" @click="switchSideBar"
          :style="{ transform: isOpen ? 'translateX(0)' : `translateX(${TransformDistance - ContainerWidth + 45}px)` }"
          :title="isOpen ? '收起侧边栏' : '展开侧边栏'">
          <span class="iconfont icon-sidebar_left"></span>
        </div>
      </div>
      <slot>这是内容</slot>
    </div>
  </transition>
</template>

<style module>
.SideBar {
  border-radius: 20px;
  transform: translateX(v-bind(translateX));
  transition: v-bind(transition);
}

.header {
  position: relative;
  height: 40px;
}

.SwitchButton {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 5px;
  right: 5px;
  width: 35px;
  height: 30px;
  border-radius: 15px;
  background-color: rgba(248, 248, 248, 0.9);
  transition:
    transform .5s,
    border 0s .5s,
    box-shadow .5s;
  cursor: pointer;
  will-change: transform;
}

.SwitchButton.close {
  border: 1px solid #fff;
  box-shadow: 0 0 10px 2px rgba(0, 0, 0, 0.1);
}

.SwitchButton:hover {
  background-color: #eee;
}
</style>
<style scoped>
.icon-sidebar_left {
  font-size: 20px;
  color: #19191a;
}
</style>
<style>
.lovelymaid-pop-enter-from,
.lovelymaid-pop-leave-to {
  transform: translateX(v-bind(translateX)) scale(0);
}
</style>