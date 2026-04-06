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
  title: '标题',
});
</script>

<template>
  <div :class="$style.Drawer">
    <transition name="lovelymaid-fade">
      <div :class="$style.mask" v-if="props.isOpen"></div>
    </transition>
    <transition name="lovelymaid-slide-up">
      <div :class="[$style.DrawerContainer, 'lovelymaid-common-container']" v-if="props.isOpen">
        <div :class="$style.header">
          <div :class="$style.title">{{ props.title }}</div>
          <Button type="close" :class="$style.Button" :onClick="props.onCloseClick" title="关闭弹窗" />
        </div>
        <div :class="$style.content">
          <slot>这是内容</slot>
        </div>
      </div>
    </transition>
  </div>
</template>

<style module>
.Drawer {
  position: relative;
  z-index: 10;
  --height: 90dvh;
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

.DrawerContainer {
  position: fixed;
  bottom: 0;
  z-index: 1;
  width: 100dvw;
  height: var(--height);
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