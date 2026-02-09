<script setup lang="ts">
import { onMounted, ref } from 'vue';

interface Props {
  /** 按钮图标 */
  type: string
  /** 切换按钮点击事件 */
  onClick?: () => void
  /** 悬停提示 */
  title?: string
}
const props = defineProps<Props>()

// 计算字体大小
const buttonRef = ref<HTMLElement | null>(null)
const fontSize = ref<number>(0)
onMounted(() => setTimeout(() => fontSize.value = buttonRef.value!.offsetWidth * 1 / 2, 0))
</script>

<template>
  <div class="Button" @click="props.onClick" :title="props.title ? props.title : ''" ref="buttonRef">
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
  --font-size: calc(v-bind(fontSize) * 1px);
  --transform: none;
}

.Button:hover {
  background-color: #eee;
}

.iconfont {
  font-size: var(--font-size);
  color: #19191a;
  transform: var(--transform);
}
</style>