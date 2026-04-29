<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'

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
}
const debounceCalculateTransform = debounce(calculateTransform, 100)
onMounted(() => {
  calculateTransform()
  setTimeout(() => transition.value = 'transform .5s', 100)
  window.addEventListener('resize', debounceCalculateTransform)
})
onUnmounted(() => {
  window.removeEventListener('resize', debounceCalculateTransform)
})

// 计算侧边栏按钮平移距离
const buttonTransformDistance = computed<string>(() => isOpen.value ? '0' : `${TransformDistance.value - ContainerWidth.value + 55}px`)

// 切换 visilble
const display = ref<string>('block')
const scale = ref<string>('1')
watch(() => props.visible, (newVisible) => {
  transition.value = 'transform .3s'
  setTimeout(() => transition.value = 'transform .5s', 300)
  if (newVisible) {
    display.value = 'block'
    requestAnimationFrame(() => {
      scale.value = '1'
    })
  } else {
    setTimeout(() => display.value = 'none', 300)
    scale.value = '0'
  }
})
</script>

<template>
  <div ref="ContainerRef" :class="[$style.SideBar, 'lovelymaid-glass-container']">
    <div :class="$style.header">
      <div :class="[$style.SwitchButton, { [$style.close]: !isOpen }]" @click="switchSideBar"
        :title="isOpen ? '收起侧边栏' : '展开侧边栏'">
        <span class="lovelymaid lovelymaid-sidebar_left"></span>
      </div>
    </div>
    <slot>这是内容</slot>
  </div>
</template>

<style module>
.SideBar {
  display: v-bind(display);
  border-radius: 20px;
  transform: translateX(v-bind(translateX)) scale(v-bind(scale));
  transition: v-bind(transition);
}

.header {
  position: relative;
  height: 50px;
}

.SwitchButton {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 10px;
  right: 10px;
  width: 35px;
  height: 30px;
  border: none;
  border-radius: 15px;
  background-color: rgba(248, 248, 248, 0.9);
  transform: translateX(v-bind(buttonTransformDistance));
  transition:
    transform .5s,
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
.lovelymaid-sidebar_left {
  font-size: 20px;
  color: #19191a;
}
</style>