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
const ButtonHeight = ref<string>('')
const fontSize = ref<string>('0')
onMounted(() => watchRef(ButtonRef, () => {
  ButtonHeight.value = `${ButtonRef.value.offsetHeight}px`
  fontSize.value = `${ButtonRef.value.offsetWidth / 2}px`
}, true))
</script>

<template>
  <div ref="ButtonRef" :class="[$style.Button, { 'lovelymaid-glass-container': props.type === 'glass' }]"
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
  background-color: #3b86f7;
  border-radius: calc(v-bind(ButtonHeight) / 2);
  cursor: pointer;
  touch-action: none;
  transition: transform .2s;
  font-size: v-bind(fontSize);
  font-weight: 500;
  color: #19191a;
}

.Button:active {
  transform: scale(1.2);
}

.Button.lovelymaid-glass-container:active {
  background-color: #fff;
}
</style>