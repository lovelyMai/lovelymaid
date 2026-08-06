<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from 'vue';

import { watchDOM } from '@/utils/dom';
import { useCssVar } from '@/utils/css-var';

interface Props {
  /** 类型 */
  type?: 'common' | 'glass'
  /** 按钮点击事件 */
  onClick?: () => void
  /** 悬停提示 */
  title?: string
}
const props = withDefaults(defineProps<Props>(), {
  type: 'common',
  title: ''
});

// 初始化
const ButtonRef = ref<HTMLElement | null>(null)
const style = reactive({
  Button: {
    'border-radius': '0',
    'font-size': '0'
  }
})
let cleanup: (() => void) | undefined
onMounted(() => {
  if (!ButtonRef.value) return
  cleanup = watchDOM(ButtonRef.value, ({ width, height }) => {
    const shorter = Math.min(width, height)
    style.Button['border-radius'] = `${shorter / 2}px`
    style.Button['font-size'] = `${shorter / 2}px`
  })
  useCssVar(ButtonRef.value, style)
})
onUnmounted(() => {
  cleanup?.()
})
</script>

<template>
  <div
    :class="[$style.Button, { 'lovelymai-glass-container': props.type === 'glass', [$style.common]: props.type === 'common', }]"
    ref="ButtonRef" :title="props.title" @click.stop="() => props.onClick?.()">
    <slot></slot>
  </div>
</template>

<style module>
.Button {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 30px;
  height: 30px;
  border-radius: var(--Button-border-radius);
  font-size: var(--Button-font-size);
  font-weight: 500;
  color: var(--lovelymai-color-gray-600);
  transition: transform .2s;
  cursor: pointer;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  --background-color: var(--lovelymai-color-blue-200);
}

.Button.common {
  background-color: var(--background-color);
}

.Button.lovelymai-glass-container:active {
  background-color: #fff;
}

.Button:active {
  transform: scale(1.2);
}
</style>