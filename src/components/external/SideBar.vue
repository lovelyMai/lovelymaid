<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, reactive, nextTick } from 'vue'
import Card from './Card.vue'
import Loading from './Loading.vue'

import { useCssVar } from '@/utils/css-var.js'
import { watchDOM } from '@/utils/dom'
import { debounce } from '@/utils/function'
import { getLayoutLeft } from '@/utils/layout-offset.js'

interface Props {
  /** 是否显示 */
  visible?: boolean
  /** 按钮点击事件 */
  onButtonClick?: () => void
  /** 加载状态 */
  loading?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  visible: true,
})
const isOpen = defineModel<boolean>('open', { required: true })

// 初始化
const style = reactive({
  SideBar: {
    get translateX() {
      return isOpen.value ? '0' : `${-transformDistance.value}px`
    },
    scale: props.visible ? '1' : '0',
    transition: 'none',
  },
  button: {
    get translateX() {
      return isOpen.value
        ? '0'
        : `${transformDistance.value - (SideBarRef.value?.offsetWidth ?? 0) + 55}px`
    },
  },
})
onMounted(() => {
  if (!SideBarRef.value) return
  useCssVar(SideBarRef.value, style)
})

// 计算平移距离
const SideBarRef = ref<HTMLElement | null>(null)
const transformDistance = ref<number>(0)
let cleanup: () => void
const calculateTransform = () => {
  if (!SideBarRef.value) return
  transformDistance.value = getLayoutLeft(SideBarRef.value) + SideBarRef.value.offsetWidth + 10
}
const debounceCalculateTransform = debounce(calculateTransform, 100)
onMounted(() => {
  if (!SideBarRef.value) return
  calculateTransform()
  cleanup = watchDOM(SideBarRef.value, () => {
    debounceCalculateTransform()
  })
  setTimeout(() => {
    style.SideBar.transition = 'transform .5s'
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
    style.SideBar.transition = 'transform .3s'
    timer = setTimeout(() => {
      style.SideBar.transition = 'transform .5s'
    }, 300)
    if (newVisible) {
      await nextTick()
      style.SideBar.scale = '1'
    } else {
      style.SideBar.scale = '0'
    }
  },
)
</script>

<template>
  <Card
    :class="$style.SideBar"
    :ref="(ins) => (SideBarRef = (ins as InstanceType<typeof Card> | null)?.$el ?? null)"
  >
    <div :class="$style.header">
      <div :class="$style.text">
        <slot name="header"></slot>
      </div>
      <div
        :class="[$style.button, { [$style.close]: !isOpen }]"
        :title="isOpen ? '收起侧边栏' : '打开侧边栏'"
        @click.stop="
          () => {
            isOpen = !isOpen
            props.onButtonClick?.()
          }
        "
      >
        <span class="lovelymai lovely-left-sidebar"></span>
      </div>
    </div>
    <div :class="$style.mask">
      <div :class="$style.empty"></div>
      <slot>111</slot>
      <Loading :loading="props.loading" />
    </div>
  </Card>
</template>

<style module>
.SideBar {
  border-radius: 20px;
  transform: translateX(var(--SideBar-translateX)) scale(var(--SideBar-scale));
  transition: var(--SideBar-transition);
}

.header {
  display: flex;
  align-items: center;
  position: absolute;
  z-index: 1;
  width: 100%;
  height: 50px;
  padding: 0 10px;
}

.header .text {
  flex: 1;
  font-size: 16px;
  font-weight: 500;
  line-height: 30px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header .button {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 35px;
  height: 30px;
  border: none;
  border-radius: 15px;
  transform: translateX(var(--button-translateX));
  transition:
    transform 0.5s,
    box-shadow 0.5s;
  cursor: pointer;
}

.header .button.close {
  border: 1px solid #fff;
  background-color: rgba(255, 255, 255, 0.9);
  box-shadow: var(--lovelymai-box-shadow-200);
}

@media (hover: hover) {
  .header .button:hover {
    background-color: var(--lovelymai-color-gray-150);
  }
}

.mask {
  position: relative;
  z-index: 0;
  min-height: 100%;
  border-radius: inherit;
  overflow-y: auto;
}

.mask .empty {
  height: 50px;
}
</style>
<style scoped>
.lovely-left-sidebar {
  font-size: 20px;
  color: var(--lovelymai-color-gray-600);
}
</style>
