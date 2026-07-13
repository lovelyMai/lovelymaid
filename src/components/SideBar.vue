<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, reactive, nextTick } from 'vue'
import Card from './Card.vue';

import { debounce, watchDOM } from '@/utils/common';
import { getLayoutLeftInViewport } from '@/utils/getOffsetInViewport';
import useCssVar from '@/utils/useCssVar';

interface Props {
  /** 是否显示 */
  visible?: boolean;
  /** 点击事件 */
  onClick?: () => void
}
const props = withDefaults(defineProps<Props>(), {
  visible: true
})
const isOpen = defineModel<boolean>('open', { required: true })

// 初始化
const style = reactive({
  SideBar: {
    get translateX() {
      return isOpen.value ? '0' : `${-TransformDistance.value}px`
    },
    scale: props.visible ? '1' : '0',
    transition: 'none'
  },
  button: {
    get translateX() {
      return isOpen.value ? '0' : `${TransformDistance.value - SideBarWidth.value + 55}px`
    }
  }
})
onMounted(() => {
  if (!SideBarRef.value?.$el) return
  useCssVar(SideBarRef.value?.$el, style)
})

// 计算平移距离
const SideBarRef = ref<InstanceType<typeof Card> | null>(null)
const SideBarWidth = ref<number>(0)
const TransformDistance = ref<number>(0)
let cleanup: () => void
const calculateTransform = () => {
  if (!SideBarRef.value?.$el) return
  SideBarWidth.value = SideBarRef.value.$el.offsetWidth
  TransformDistance.value = getLayoutLeftInViewport(SideBarRef.value.$el) + SideBarWidth.value + 10
}
const debounceCalculateTransform = debounce(calculateTransform, 100)
onMounted(() => {
  if (!SideBarRef.value?.$el) return
  calculateTransform()
  cleanup = watchDOM(SideBarRef.value.$el, () => {
    debounceCalculateTransform()
  })
  setTimeout(() => style.SideBar.transition = 'transform .5s', 100)
  window.addEventListener('resize', debounceCalculateTransform)
})
onUnmounted(() => {
  cleanup()
  window.removeEventListener('resize', debounceCalculateTransform)
})

// 切换 visilble
let timer: number | undefined
watch(() => props.visible, async (newVisible) => {
  clearTimeout(timer)
  style.SideBar.transition = 'transform .3s'
  timer = setTimeout(() => style.SideBar.transition = 'transform .5s', 300)
  if (newVisible) {
    await nextTick()
    style.SideBar.scale = '1'
  } else {
    style.SideBar.scale = '0'
  }
})
</script>

<template>
  <Card :class="$style.SideBar" ref="SideBarRef" type="glass">
    <div :class="$style.header">
      <div :class="[$style.button, { [$style.close]: !isOpen }]" :title="isOpen ? '收起侧边栏' : '展开侧边栏'" @click.stop="() => {
        isOpen = !isOpen
        props.onClick?.()
      }">
        <span class="lovelymai lovely-left-sidebar"></span>
      </div>
    </div>
    <slot></slot>
  </Card>
</template>

<style module>
.SideBar {
  border-radius: 20px;
  transform: translateX(var(--SideBar-translateX)) scale(var(--SideBar-scale));
  transition: var(--SideBar-transition);
}

.header {
  position: relative;
  height: 50px;
}

.button {
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
  transform: translateX(var(--button-translateX));
  transition: transform .5s, box-shadow .5s;
  cursor: pointer;
}

.button.close {
  border: 1px solid #fff;
  background-color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 10px 2px rgba(0, 0, 0, 0.1);
}

.button:hover {
  background-color: #eee;
}
</style>
<style scoped>
.lovely-left-sidebar {
  font-size: 20px;
  color: #19191a;
}
</style>