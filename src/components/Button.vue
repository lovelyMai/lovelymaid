<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { watchRef } from '../utils/common';

interface Props {
  /** 按钮图标 */
  type: string
  /** 切换按钮点击事件 */
  onClick?: () => void
  /** 悬停提示 */
  title?: string
}
const props = withDefaults(defineProps<Props>(), {
  title: ''
});

// 计算字体大小
const ButtonRef = ref<any>(null)
const FontSize = ref<string>('0')
onMounted(() => watchRef(ButtonRef, () => FontSize.value = `${ButtonRef.value.offsetWidth * 1 / 2}px`, true))
</script>

<template>
  <div class="Button" @click="props.onClick" :title="props.title" ref="ButtonRef">
    <span :class="['iconfont', `icon-${props.type}`]"></span>
  </div>
</template>

<style scoped>
.Button {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 30px;
  height: 30px;
  border: 1px solid #fff;
  border-radius: 50%;
  background-color: rgba(248, 248, 248, 0.9);
  backdrop-filter: blur(10px) saturate(1.5);
  box-shadow: 0 0 20px 0 rgba(0, 0, 0, .1);
  cursor: pointer;
  touch-action: none;
  transition: transform .2s;
  --font-size: calc(v-bind(FontSize) * 1px);
  --font-weight: 500;
  --color: #19191a;
  --transform: none;
}

.Button:active {
  background-color: #fff;
  transform: scale(1.2);
}

.iconfont {
  font-size: var(--font-size);
  font-weight: var(--font-weight);
  color: var(--color);
  transform: var(--transform);
}
</style>