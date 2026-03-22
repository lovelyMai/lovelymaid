<script setup lang="ts">

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
  isOpen: true,
  title: '标题'
});

</script>

<template>
  <transition name="slide-up">
    <div class="Drawer lovelymaid-container" v-if="props.isOpen">
      <div class="header">
        <div class="title">{{ props.title }}</div>
        <Button type="close" :onClick="props.onCloseClick" title="关闭弹窗" />
      </div>
      <div class="content">
        <slot>这是内容</slot>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.Drawer {
  position: fixed;
  bottom: 0;
  width: 100dvw;
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
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>