<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, reactive, nextTick } from 'vue'
import Card from './Card.vue';
import Button from './Button.vue';

import { debounce, watchDOM } from '@/utils/common';
import { getLayoutLeft } from '@/utils/getLayoutOffset.js';
import useCssVar from '@/utils/useCssVar';

interface Props {
  /** 是否显示 */
  visible?: boolean;
  /** 是否展开 */
  isOpen: boolean;
  /** 关闭事件 */
  onCloseClick: () => void;
  /** 标题 */
  title?: string;
}
const props = withDefaults(defineProps<Props>(), {
  visible: true,
  isOpen: true
})

// 初始化
const style = reactive({
  ContentBar: {
    get translateX() {
      return props.isOpen ? '0' : `${-transformDistance.value}px`
    },
    scale: props.visible ? '1' : '0',
    transition: 'none'
  }
})
onMounted(() => {
  if (!ContentBarRef.value?.$el) return
  useCssVar(ContentBarRef.value.$el, style)
})

// 计算平移距离
const ContentBarRef = ref<InstanceType<typeof Card> | null>(null)
const transformDistance = ref<number>(0)
let cleanup: () => void
const calculateTransform = () => {
  if (!ContentBarRef.value) return
  transformDistance.value = getLayoutLeft(ContentBarRef.value.$el) + ContentBarRef.value.$el.offsetWidth + 10
}
const debounceCalculateTransform = debounce(calculateTransform, 100)
onMounted(() => {
  if (!ContentBarRef.value) return
  calculateTransform()
  cleanup = watchDOM(ContentBarRef.value.$el, () => {
    debounceCalculateTransform()
  })
  setTimeout(() => style.ContentBar.transition = 'transform .5s', 100)
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
  style.ContentBar.transition = 'transform .3s'
  timer = setTimeout(() => style.ContentBar.transition = 'transform .5s', 300)
  if (newVisible) {
    await nextTick()
    style.ContentBar.scale = '1'
  } else {
    style.ContentBar.scale = '0'
  }
})
</script>

<template>
  <Card :class="$style.ContentBar" ref="ContentBarRef" type="glass">
    <div :class="$style.header">
      <div :class="$style.title" :title="props.title">{{ props.title }}</div>
      <Button type="glass" :class="$style.Button" :on-click="props.onCloseClick" title="收起内容栏">
        <span class="lovelymai lovely-close"></span>
      </Button>
    </div>
    <div :class="$style.content">
      <slot></slot>
    </div>
    <div :class="$style.tip">
      <slot name="tip"></slot>
    </div>
  </Card>
</template>

<style module>
.ContentBar {
  border-radius: 20px;
  transform: translateX(var(--ContentBar-translateX)) scale(var(--ContentBar-scale));
  transition: var(--ContentBar-transition);
  overflow: auto;
  scrollbar-width: thin;
}

.header {
  display: flex;
  justify-content: space-between;
  position: sticky;
  gap: 5px;
  top: 0;
  z-index: 1;
  height: 0;
  margin-bottom: 50px;
  padding: 0 10px 0 10px;
  box-shadow: 0 0px 20px 35px var(--color-gray-100);
}

.title {
  flex: 1;
  min-width: 0;
  height: 30px;
  margin-top: 10px;
  font-size: 16px;
  font-weight: 500;
  line-height: 30px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.Button {
  margin-top: 10px;
  font-size: 20px;
}

.content {
  display: flow-root;
  position: relative;
  z-index: 0;
}

.tip {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 2;
  transform: translate(-50%, -50%)
}
</style>