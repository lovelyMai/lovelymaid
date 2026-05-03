<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { watchRef } from '../utils/common';

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
const ButtonRef = ref<any>(null)
const borderRadius = ref<string>('')
const fontSize = ref<string>('0')
onMounted(() => watchRef(ButtonRef, () => {
  const shorter = Math.min(ButtonRef.value.offsetHeight, ButtonRef.value.offsetWidth)
  borderRadius.value = `${shorter / 2}px`
  fontSize.value = `${shorter / 2}px`
}, true))
</script>

<template>
  <div ref="ButtonRef"
    :class="[$style.Button, { [$style.common]: props.type === 'common', 'lovelymaid-glass-container': props.type === 'glass' }]"
    @click="props.onClick" :title="props.title">
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

.Button:active {
  transform: scale(1.2);
}

.Button.lovelymaid-glass-container:active {
  background-color: #fff;
}
</style>