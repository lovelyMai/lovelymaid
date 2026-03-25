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
const fontSize = ref<string>('0')
onMounted(() => watchRef(ButtonRef, () => {
  fontSize.value = `${ButtonRef.value.offsetWidth / 2}px`
}, true))
</script>

<template>
  <div :class="[$style.Button, 'lovelymaid-glass-container']" @click="props.onClick" :title="props.title"
    ref="ButtonRef">
    <span :class="['iconfont', `icon-${props.type}`]"></span>
  </div>
</template>

<style module>
.Button {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  touch-action: none;
  transition: transform .2s;
  --font-size: v-bind(fontSize);
  --font-weight: 500;
  --color: #19191a;
  --transform: none;
}

.Button:active {
  background-color: #fff;
  transform: scale(1.2);
}
</style>
<style scoped>
.iconfont {
  font-size: var(--font-size);
  font-weight: var(--font-weight);
  color: var(--color);
  transform: var(--transform);
}
</style>