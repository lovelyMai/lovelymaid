<script setup lang="ts">
import ContentBar from './ContentBar.vue';

interface Props {
  /** 类型 */
  type?: 'desktop' | 'mobile'
  /** 标题 */
  title?: string
  /** 关闭事件 */
  onClose?: () => void
}
const props = withDefaults(defineProps<Props>(), {
  type: 'desktop'
})
const visible = defineModel<boolean>('visible', { required: true })
</script>

<template>
  <teleport to="body">
    <div :class="$style.Modal">
      <transition name="lovelymai-fade">
        <div :class="$style.mask" v-if="visible" @click.capture.stop="() => visible = false"></div>
      </transition>
      <ContentBar :class="$style.ContentBar" :visible="visible" :is-open="true" :on-close-click="() => visible = false"
        :title="props.title">
        <slot></slot>
        <template #tip>
          <slot name="tip"></slot>
        </template>
      </ContentBar>
    </div>
  </teleport>
</template>

<style module>
.Modal {
  position: relative;
  z-index: 10;
  --width: 50dvw;
  --height: 90dvh;
}

.mask {
  position: fixed;
  left: 0;
  top: 0;
  width: 100dvw;
  height: 100dvh;
  background-color: rgba(0, 0, 0, 0.1);
}

.ContentBar {
  position: fixed;
  top: calc(50% - var(--height) / 2);
  left: calc(50% - var(--width) / 2);
  width: var(--width);
  height: var(--height);
}
</style>