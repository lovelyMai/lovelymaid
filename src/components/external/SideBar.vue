<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, reactive, nextTick } from 'vue'
import Card from './Card.vue';

import { debounce, watchDOM } from '@/utils/common';
import { getLayoutLeft } from '@/utils/get-layout-offset.js';
import useCssVar from '@/utils/use-css-var.js';

interface Props {
  /** 是否显示 */
  visible?: boolean;
  /** 按钮点击事件 */
  onButtonClick?: () => void
}
const props = withDefaults(defineProps<Props>(), {
  visible: true
})
const isOpen = defineModel<boolean>('open', { required: true })

// 初始化
const style = reactive({
  SideBar: {
    get translateX() {
      return isOpen.value ? '0' : `${-transformDistance.value}px`
    },
    scale: props.visible ? '1' : '0',
    transition: 'none'
  },
  button: {
    get translateX() {
      return isOpen.value ? '0' : `${transformDistance.value - (SideBarRef.value?.$el.offsetWidth ?? 0) + 55}px`
    }
  }
})
onMounted(() => {
  if (!SideBarRef.value?.$el) return
  useCssVar(SideBarRef.value?.$el, style)
})

// 计算平移距离
const SideBarRef = ref<InstanceType<typeof Card> | null>(null)
const transformDistance = ref<number>(0)
let cleanup: () => void
const calculateTransform = () => {
  if (!SideBarRef.value?.$el) return
  transformDistance.value = getLayoutLeft(SideBarRef.value.$el) + SideBarRef.value.$el.offsetWidth + 10
}
const debounceCalculateTransform = debounce(calculateTransform, 100)
onMounted(() => {
  if (!SideBarRef.value?.$el) return
  calculateTransform()
  cleanup = watchDOM(SideBarRef.value.$el, () => {
    debounceCalculateTransform()
  })
  setTimeout(() => {
    style.SideBar.transition = 'transform .5s'
  }, 100)
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
  timer = setTimeout(() => {
    style.SideBar.transition = 'transform .5s'
  }, 300)
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
      <div :class="[$style.button, { [$style.close]: !isOpen }]" :title="isOpen ? '收起侧边栏' : '打开侧边栏'" @click.stop="() => {
        isOpen = !isOpen
        props.onButtonClick?.()
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
  box-shadow: var(--box-shadow-200);
}

@media (hover: hover) {
  .button:hover {
    background-color: var(--color-gray-150);
  }
}
</style>
<style scoped>
.lovely-left-sidebar {
  font-size: 20px;
  color: var(--color-gray-500);
}
</style>