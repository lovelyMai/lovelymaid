<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import Card from './Card.vue';

import { debounce } from '@/utils/common';
import { getLayoutLeftInViewport } from '@/utils/getOffsetInViewport';

interface Props {
  /** 是否显示 */
  visible?: boolean;
  /** 是否展开 */
  isOpen?: boolean
  /** 切换按钮点击事件 */
  onSwitch?: () => void;
}
const props = withDefaults(defineProps<Props>(), {
  visible: true,
  isOpen: true
})

// 侧边栏开关状态
const switchSideBar = () => {
  props.onSwitch?.();
}

// 计算侧边栏平移距离
const SideBarRef = ref<InstanceType<typeof Card> | null>(null)
const ContainerWidth = ref<number>(0)
const transition = ref<string>('none')
const TransformDistance = ref<number>(0)
const translateX = computed<string>(() => props.isOpen ? '0' : `${-TransformDistance.value}px`)
const calculateTransform = () => {
  if (!SideBarRef.value) return
  ContainerWidth.value = SideBarRef.value.$el.offsetWidth
  TransformDistance.value = getLayoutLeftInViewport(SideBarRef.value.$el) + ContainerWidth.value + 10
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
const buttonTransformDistance = computed<string>(() => props.isOpen ? '0' : `${TransformDistance.value - ContainerWidth.value + 55}px`)

// 切换 visilble
const scale = ref<string>(props.visible ? '1' : '0')
let timer: number | undefined
watch(() => props.visible, (newVisible) => {
  clearTimeout(timer)
  transition.value = 'transform .3s'
  timer = setTimeout(() => transition.value = 'transform .5s', 300)
  if (newVisible) {
    requestAnimationFrame(() => {
      scale.value = '1'
    })
  } else {
    scale.value = '0'
  }
})
</script>

<template>
  <Card :class="$style.SideBar" ref="SideBarRef" type="glass">
    <div :class="$style.header">
      <div :class="[$style.SwitchButton, { [$style.close]: !props.isOpen }]" @click="switchSideBar"
        :title="isOpen ? '收起侧边栏' : '展开侧边栏'">
        <span class="lovelymai lovely-left-sidebar"></span>
      </div>
    </div>
    <slot>这是内容</slot>
  </Card>
</template>

<style module>
.SideBar {
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
.lovely-left-sidebar {
  font-size: 20px;
  color: #19191a;
}
</style>