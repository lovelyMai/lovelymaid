<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import ContentBar from './ContentBar.vue'

import { useCssVar } from '@/utils/css-var.js'

interface Props {
  /** 宽 */
  width?: string
  /** 高 */
  height?: string
  /** z-index */
  zIndex?: number
  /** 关闭事件 */
  onClose?: () => void
  /** 加载状态 */
  loading?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  zIndex: 0,
})
const visible = defineModel<boolean>('visible', { required: true })

// 初始化
const ModalRef = ref<HTMLElement | null>(null)
const style = reactive({
  ContentBar: {
    get left() {
      return `calc(50% - ${this.width} / 2)`
    },
    get top() {
      return `calc(50% - ${this.height} / 2)`
    },
    get width() {
      return props.width ?? '50dvw'
    },
    get height() {
      return props.height ?? '90dvh'
    },
  },
})
onMounted(() => {
  if (!ModalRef.value) return
  useCssVar(ModalRef.value, style)
})

// 关闭
const close = () => {
  visible.value = false
  props.onClose?.()
}
</script>

<template>
  <teleport to="body">
    <div :class="$style.Modal" ref="ModalRef" :style="{ zIndex: props.zIndex }">
      <transition name="lovelymai-fade">
        <div :class="$style.mask" v-if="visible" @click.capture.stop="close"></div>
      </transition>
      <ContentBar
        :class="$style.ContentBar"
        :visible="visible"
        :is-open="true"
        :on-close-click="close"
        :loading="props.loading"
      >
        <template #header>
          <slot name="header"></slot>
        </template>
        <slot></slot>
      </ContentBar>
    </div>
  </teleport>
</template>

<style module>
.Modal {
  position: relative;
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
  left: var(--ContentBar-left);
  top: var(--ContentBar-top);
  width: var(--ContentBar-width);
  height: var(--ContentBar-height);
}
</style>
