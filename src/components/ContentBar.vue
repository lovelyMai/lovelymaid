<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Props {
  /** 是否显示 */
  visible?: boolean;
  /** 是否展开 */
  isOpen?: boolean;
  /** 标题 */
  title?: string;
  /** 关闭按钮点击事件 */
  onCloseClick?: () => void;
}
const props = withDefaults(defineProps<Props>(), {
  visible: true,
  isOpen: true,
  title: '标题'
});

// 计算侧边栏平移距离
const containerRef = ref<HTMLElement | null>(null)
const transformDistance = ref<number>(0)
const transition = ref<boolean>(false)
const calculateTransform = () => {
  const container = containerRef.value
  if (!container) return
  let left = 0
  let el: HTMLElement | null = container
  while (el) {
    left += el.offsetLeft
    el = el.offsetParent as HTMLElement | null
  }
  const width = container.offsetWidth
  transformDistance.value = left + width + 10
  setTimeout(() => transition.value = true, 100)
}
let timer: number;
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
    <div class="ContentBar" v-if="props.visible" ref="containerRef"
      :style="{ transition: transition ? 'transform .5s ease, opacity .5s ease' : 'none', '--translateX': `${props.isOpen ? 0 : -transformDistance}px`, userSelect: 'none' }">
      <div class="header">
        <div class="title">{{ props.title }}</div>
        <div class="closeButton" :class="{ close: !isOpen }" @click="onCloseClick" :title="'收起内容栏'">
          <span class="iconfont icon-iconguanbi"></span>
        </div>
      </div>
      <slot>这是内容</slot>
    </div>
  </transition>
</template>

<style scoped>
.ContentBar {
  background-color: rgba(248, 248, 248, 0.9);
  backdrop-filter: blur(10px) saturate(1.5);
  border: 1px solid #fff;
  border-radius: 20px;
  box-shadow: 0 0 20px 0 rgba(0, 0, 0, .1);
  transform: translateX(var(--translateX));
  overflow: auto;
  --header-z-index: 3;
}

.header {
  display: flex;
  justify-content: space-between;
  position: sticky;
  z-index: var(--header-z-index);
  top: 0;
  height: 0;
  margin-bottom: 35px;
  padding: 0 5px;
  box-shadow: 0 0px 20px 35px rgba(248, 248, 248, .95);
}

.title {
  flex: 1;
  height: 30px;
  margin-top: 5px;
  line-height: 30px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.closeButton {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 30px;
  height: 30px;
  margin-top: 5px;
  border: 1px solid #fff;
  border-radius: 15px;
  background-color: rgba(248, 248, 248, 1);
  box-shadow: 0 0 20px 0 rgba(0, 0, 0, .1);
  cursor: pointer;
}

.closeButton:hover {
  background-color: #eee;
}

.icon-iconguanbi {
  font-size: 20px;
  color: #262626;
}

.pop-enter-from,
.pop-leave-to {
  transform: translateX(var(--translateX)) scale(0);
  opacity: 0;
}
</style>