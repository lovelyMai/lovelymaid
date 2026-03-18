<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'

import Button from './Button.vue';

interface Props {
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

</script>

<template>
  <transition name="slide-up">
    
  </transition>
</template>

<style scoped>

.slide-up-enter-from,
.slide-up-leave-to {
  
}
</style>