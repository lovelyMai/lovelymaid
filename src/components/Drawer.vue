<script setup lang="ts">
import { toRef } from 'vue';

import Button from './Button.vue';

interface Props {
  /** 是否展开 */
  isOpen?: boolean;
  /** 标题 */
  title?: string;
  /** 关闭按钮点击事件 */
  onCloseClick?: () => void;
  /** 抽屉高度 */
  height?: string
}
const props = withDefaults(defineProps<Props>(), {
  isOpen: true,
  title: '标题',
  height: '90dvh'
});
const height = toRef(props.height)
</script>

<template>
  <div class="Drawer">
    <transition name="lovelymaid-fade">
      <div class="mask" v-if="props.isOpen"></div>
    </transition>
    <transition name="lovelymaid-slide-up">
      <div class="drawer-container lovelymaid-mobile-container" v-if="props.isOpen">
        <div class="header">
          <div class="title">{{ props.title }}</div>
          <Button type="close" :onClick="props.onCloseClick" title="关闭弹窗" />
        </div>
        <div class="content">
          <slot>这是内容</slot>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.Drawer {
  position: relative;
  z-index: 10;
}

.mask {
  position: fixed;
  left: 0;
  top: 0;
  width: 100dvw;
  height: 100dvh;
  background-color: rgba(0, 0, 0, 0.1);
  transition: opacity .3s;
}

.drawer-container {
  position: fixed;
  bottom: 0;
  z-index: 1;
  width: 100dvw;
  height: v-bind(height);
  border-top-left-radius: 38px;
  border-top-right-radius: 38px;
  transition: transform .5s cubic-bezier(0.2, 0.9, 0.4, 1);
  overflow: auto;
  overscroll-behavior-y: contain;
  scrollbar-width: thin;
}

.header {
  display: flex;
  justify-content: center;
  position: sticky;
  top: 0;
  z-index: 1;
  height: 0;
  margin-bottom: 60px;
  box-shadow: 0 0px 20px 35px rgba(248, 248, 248, .95);
}

.title {
  max-width: calc(100% - 130px);
  height: 45px;
  margin-top: 15px;
  font-size: 20px;
  font-weight: 500;
  line-height: 45px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.Button {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 45px;
  height: 45px;
  --font-size: 28px;
  --font-weight: 600;
}

.content {
  position: relative;
  z-index: 0;
}
</style>
<style>
.lovelymaid-fade-enter-from,
.lovelymaid-fade-leave-to {
  opacity: 0;
}

.lovelymaid-slide-up-enter-from,
.lovelymaid-slide-up-leave-to {
  transform: translateY(100%);
}
</style>