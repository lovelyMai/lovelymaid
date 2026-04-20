<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'

import Button from './Button.vue';

import { debounce } from '@/utils/common';
import { getLayoutLeftInViewport } from '@/utils/getOffsetInViewport';

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
const ContainerRef = ref<HTMLElement | null>(null)
const transition = ref<string>('none')
const transformDistance = ref<number>(0)
const translateX = computed<string>(() => props.isOpen ? '0' : `${-transformDistance.value}px`)
const calculateTransform = () => {
  if (!ContainerRef.value) return
  transformDistance.value = getLayoutLeftInViewport(ContainerRef.value) + ContainerRef.value.offsetWidth + 10
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

// 切换 visilble
const display = ref<string>(props.visible ? 'block' : 'none')
const scale = ref<string>(props.visible ? '1' : '0')
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
  <div :class="[$style.ContentBar, 'lovelymaid-glass-container']" ref="ContainerRef">
    <div :class="$style.header">
      <div :class="$style.title" :title="props.title">{{ props.title }}</div>
      <Button type="glass" :class="$style.Button" :onClick="props.onCloseClick" title="收起内容栏">
        <span class="lovelymaid lovelymaid-close"></span>
      </Button>
    </div>
    <div :class="$style.content">
      <slot>这是内容</slot>
    </div>
  </div>
</template>

<style module>
.ContentBar {
  display: v-bind(display);
  border-radius: 20px;
  transform: translateX(v-bind(translateX)) scale(v-bind(scale));
  transition: v-bind(transition);
  overflow: auto;
  scrollbar-width: thin;
}

.header {
  display: flex;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 1;
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
  font-size: 20px;
}

.content {
  position: relative;
  z-index: 0;
}
</style>