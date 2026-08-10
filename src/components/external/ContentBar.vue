<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, reactive, nextTick } from 'vue'
import Button from './Button.vue'
import Card from './Card.vue'
import Loading from './Loading.vue'

import { useCssVar } from '@/utils/css-var.js'
import { watchDOM } from '@/utils/dom'
import { debounce } from '@/utils/function'
import { getLayoutLeft } from '@/utils/layout-offset.js'

interface Props {
  /** 是否显示 */
  visible?: boolean
  /** 是否展开 */
  isOpen: boolean
  /** 关闭事件 */
  onCloseClick: () => void
  /** 加载状态 */
  loading?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  visible: true,
  isOpen: true,
  loading: false,
})

// 初始化
const style = reactive({
  ContentBar: {
    get translateX() {
      return props.isOpen ? '0' : `${-transformDistance.value}px`
    },
    scale: props.visible ? '1' : '0',
    transition: 'none',
  },
})
onMounted(() => {
  if (!ContentBarRef.value) return
  useCssVar(ContentBarRef.value, style)
})

// 计算平移距离
const ContentBarRef = ref<HTMLElement | null>(null)
const transformDistance = ref<number>(0)
let cleanup: () => void
const calculateTransform = () => {
  if (!ContentBarRef.value) return
  transformDistance.value =
    getLayoutLeft(ContentBarRef.value) + ContentBarRef.value.offsetWidth + 10
}
const debounceCalculateTransform = debounce(calculateTransform, 100)
onMounted(() => {
  if (!ContentBarRef.value) return
  calculateTransform()
  cleanup = watchDOM(ContentBarRef.value, () => {
    debounceCalculateTransform()
  })
  setTimeout(() => {
    style.ContentBar.transition = 'transform .5s'
  }, 100)
  window.addEventListener('resize', debounceCalculateTransform)
})
onUnmounted(() => {
  cleanup()
  window.removeEventListener('resize', debounceCalculateTransform)
})

// 切换 visilble
let timer: number | undefined
watch(
  () => props.visible,
  async (newVisible) => {
    clearTimeout(timer)
    style.ContentBar.transition = 'transform .3s'
    timer = setTimeout(() => {
      style.ContentBar.transition = 'transform .5s'
    }, 300)
    if (newVisible) {
      await nextTick()
      style.ContentBar.scale = '1'
    } else {
      style.ContentBar.scale = '0'
    }
  },
)
</script>

<template>
  <Card
    :class="$style.ContentBar"
    :ref="(ins) => (ContentBarRef = (ins as InstanceType<typeof Card> | null)?.$el ?? null)"
  >
    <div :class="$style.header">
      <div :class="$style.title">
        <slot name="header"></slot>
      </div>
      <Button :class="$style.Button" type="glass" :on-click="props.onCloseClick" title="收起内容栏">
        <span class="lovelymai lovely-close"></span>
      </Button>
    </div>
    <div :class="$style.content">
      <slot></slot>
    </div>
    <Loading :loading="props.loading" :z-index="1" />
  </Card>
</template>

<style module>
.ContentBar {
  border-radius: 20px;
  transform: translateX(var(--ContentBar-translateX)) scale(var(--ContentBar-scale));
  transition: var(--ContentBar-transition);
  overflow: auto;
  scrollbar-width: thin;
}

.header {
  display: flex;
  justify-content: space-between;
  gap: 5px;
  position: sticky;
  top: 0;
  z-index: 2;
  height: 0;
  margin-bottom: 50px;
  padding: 0 10px 0 10px;
  box-shadow: 0 0px 20px 35px var(--lovelymai-color-gray-100);
}

.title {
  flex: 1;
  min-width: 0;
  height: 30px;
  margin-top: 10px;
  font-size: 16px;
  font-weight: 500;
  line-height: 30px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.Button {
  margin-top: 10px;
  font-size: 20px;
}

.content {
  display: flow-root;
  position: relative;
  z-index: 0;
}
</style>
