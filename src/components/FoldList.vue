<script setup lang="ts">
import { ref, nextTick, onMounted, watch, computed } from 'vue'

import getSlideCount from '../utils/calculateOffsets'

interface Props {
  /** 标题 */
  title?: string
  /** 列表数据 */
  list: { id: string, name: string, [key: string]: any }[]
  /** 是否展开 */
  isOpen: boolean
  /** 激活项索引 */
  activeIndex?: number
  /** 展开状态改变事件 */
  onOpenChange: (newOpen: boolean) => void
  /** 头部点击事件 */
  onHeaderClick?: () => void
  /** 列表项点击事件 */
  onItemClick?: (item: { id: string, name: string, [key: string]: any }, index: number) => void
}
const props = withDefaults(defineProps<Props>(), {
  title: '标题',
  isOpen: true
});

// 标准流高度动画
const bodyHeight = ref<number>(0)
const bodyRef = ref<HTMLElement | null>(null)
const calculateHeight = async () => {
  await nextTick()
  if (bodyRef.value) {
    bodyHeight.value = bodyRef.value!.offsetHeight
  }
}
const initialize = async () => {
  await calculateHeight()
}
onMounted(() => {
  initialize()
})
watch(() => props.list.length, async () => {
  await calculateHeight()
})

// 列表项动画
const slideCount = ref<number[]>([])
const slideAnimating = ref<boolean>(false)
const oldlist = ref<{ id: string, name: string }[]>(props.list)
const listSnapshot = computed(() => props.list.map(item => item.id).join(','))
watch(listSnapshot, async (newSnapshot, oldSnapshot) => {
  if (newSnapshot === oldSnapshot) return
  slideAnimating.value = false
  slideCount.value = getSlideCount(props.list, oldlist.value)
  await nextTick()
  slideAnimating.value = true
  oldlist.value = [...props.list]
}, { deep: true })
</script>

<template>
  <div :class="$style.FoldList">
    <div :class="$style.header" @click="onHeaderClick">
      <div :class="$style.title">
        {{ props.title }}
      </div>
      <span class="lovelymai lovely-right-arrow" :style="{ transform: props.isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }"
        :title="isOpen ? '收起列表' : '展开列表'" @click.stop="() => onOpenChange(!props.isOpen)"></span>
    </div>
    <div :class="$style.BodyContainer" :style="{ height: isOpen ? `${bodyHeight}px` : '0px' }">
      <ul :class="[$style.body, { [$style.close]: !isOpen }]" ref="bodyRef">
        <li
          :class="[$style.item, { [$style.active]: index === props.activeIndex, [$style.slideAnimation]: slideAnimating }]"
          v-for="(item, index) in props.list" :key="item.id" @click.stop="() => onItemClick?.(item, index)"
          :style="{ '--translateY': `${slideCount[index] * 100}%`, 'z-index': `${props.list.length - index}` }"
          @animationend="() => slideAnimating = false">
          <slot :item="item" :index="index">{{ item.name }}</slot>
        </li>
      </ul>
    </div>
  </div>
</template>

<style module>
.FoldList {
  --header-height: 30px;
  --title-font-size: 12px;
  --title-color: #767676;
  --list-font-size: 14px;
  --list-line-height: 30px;
  --list-color: inherit;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: var(--header-height);
  cursor: pointer;
}

.header .title {
  font-size: var(--title-font-size);
  color: var(--title-color);
  font-weight: 500;
}

.BodyContainer {
  overflow: hidden;
  transition: height .5s ease;
}

.body {
  transform: translateY(0);
  transition: transform .5s ease;
}

.body.close {
  transform: translateY(-100%);
}

.body .item {
  position: relative;
  padding: 0 10px;
  border-radius: 6px;
  font-size: var(--list-font-size);
  line-height: var(--list-line-height);
  color: var(--list-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all .2s;
}

.body .item.active {
  background-color: rgba(228, 228, 228, 1);
  color: #3b86f7;
}

@keyframes slideAnimation {
  from {
    transform: translateY(var(--translateY));
  }

  to {
    transform: translateY(0);
  }
}

.slideAnimation {
  animation: slideAnimation .5s;
}
</style>

<style scoped>
.lovely-right-arrow {
  font-size: 16px;
  color: var(--title-color);
  font-weight: 700;
  transition: transform .3s;
  cursor: pointer;
}
</style>