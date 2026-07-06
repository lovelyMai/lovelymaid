<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

import { watchDOM } from '../utils/common';

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

// 计算字体大小
const ButtonRef = ref<HTMLElement | null>(null)
const borderRadius = ref<string>('0')
const fontSize = ref<string>('0')
let cleanup: () => void
onMounted(() => {
  if (!ButtonRef.value) return
  cleanup = watchDOM(ButtonRef.value, ({ width, height }) => {
    const shorter = Math.min(width, height)
    borderRadius.value = `${shorter / 2}px`
    fontSize.value = `${shorter / 2}px`
  }, true)
})
onUnmounted(() => cleanup?.())
</script>

<template>
  <div
    :class="[$style.Button, { 'lovelymai-glass-container': props.type === 'glass', [$style.common]: props.type === 'common', }]"
    ref="ButtonRef" @click="props.onClick" :title="props.title">
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
  border-radius: v-bind(borderRadius);
  cursor: pointer;
  touch-action: none;
  transition: transform .2s;
  font-size: v-bind(fontSize);
  font-weight: 500;
  color: #19191a;
  --background-color: #3b86f7;
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