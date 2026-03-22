<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'

import Button from './Button.vue';

import debounce from '@/utils/common/debounce';

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
const transition = ref<string>('none')
const transformDistance = ref<number>(0)
const translateX = computed<string>(() => props.isOpen ? '0' : `${-transformDistance.value}px`)
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
}
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    setTimeout(() => transition.value = 'transform .5s', 300)
  } else {
    transition.value = 'transform .3s'
  }
})
const delayCalculateTransform = debounce(calculateTransform, 100)
onMounted(() => {
  calculateTransform()
  setTimeout(() => transition.value = 'transform .5s', 100)
  window.addEventListener('resize', delayCalculateTransform)
})
onUnmounted(() => {
  window.removeEventListener('resize', delayCalculateTransform)
})

</script>

<template>
  <transition name="pop">
    <div class="ContentBar lovelymaid-container" v-show="props.visible" ref="containerRef">
      <div class="header">
        <div class="title" :title="props.title">{{ props.title }}</div>
        <Button type="close" :onClick="props.onCloseClick" title="收起内容栏" />
      </div>
      <slot>这是内容</slot>
    </div>
  </transition>
</template>

<style scoped>
.ContentBar {
  transition: v-bind(transition);
  transform: translateX(v-bind(translateX));
  overflow: auto;
  user-select: none;
  -webkit-user-select: none;
  --header-z-index: 3;
}

.header {
  display: flex;
  justify-content: space-between;
  position: sticky;
  z-index: var(--header-z-index);
  top: 0;
  height: 0;
  margin-bottom: 40px;
  padding: 0 5px 0 10px;
  box-shadow: 0 0px 20px 35px rgba(248, 248, 248, .95);
}

.title {
  flex: 1;
  height: 30px;
  margin-top: 5px;
  font-size: 16px;
  line-height: 30px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.Button {
  margin-top: 5px;
  --font-size: 20px;
}

.pop-enter-from,
.pop-leave-to {
  transform: translateX(v-bind(translateX)) scale(0);
}
</style>