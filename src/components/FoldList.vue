<script setup lang="ts">
import { ref, nextTick, onMounted, watch } from 'vue'
import getSlideCount from '../utils/calculateOffsets'

interface Props {
  /** 标题 */
  title?: string
  /** 要渲染的列表 */
  list?: { id: string, name: string }[]
  /** 激活项索引 */
  activeIndex?: number
  /** 头部点击事件 */
  onHeaderClick?: () => void
  /** 列表项点击事件 */
  onItemClick?: (item: { id: string, name: string }, index: number) => void
}
const props = withDefaults(defineProps<Props>(), {
  title: '标题',
  list: () => [],
});

// 标准流高度动画
const isOpen = ref<boolean>(true)
const bodyHeight = ref<number>(0)
const bodyRef = ref<HTMLElement | null>(null)
const enableTransition = ref(false)
const calculateHeight = async () => {
  await nextTick()
  if (bodyRef.value) bodyHeight.value = bodyRef.value!.offsetHeight
}
const initialize = async () => {
  await calculateHeight()
  setTimeout(() => enableTransition.value = true, 100)
}
onMounted(() => {
  initialize()
})
watch(() => props.list.length, async () => await calculateHeight())

// 列表项动画
const slideCount = ref<number[]>([])
const slideAnimating = ref<boolean>(false)
const oldList = ref<{ id: string, name: string }[]>([...props.list])
watch(() => props.list, (newList) => {
  if (enableTransition.value) {
    slideCount.value = getSlideCount(newList, oldList.value)
    slideAnimating.value = true
    oldList.value = [...newList]
  }
}, { deep: true })
</script>

<template>
  <div :class="$style.FoldList">
    <div :class="$style.header" @click.stop="onHeaderClick">
      <div :class="$style.title">
        {{ props.title }}
      </div>
      <span :class="['iconfont', 'icon-right-arrow']" :style="{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }"
        :title="isOpen ? '收起列表' : '展开列表'" @click.stop="isOpen = !isOpen"></span>
    </div>
    <div :class="[$style.BodyContainer, { [$style.EnableTransition]: enableTransition }]"
      :style="{ height: isOpen ? `${bodyHeight}px` : '0px' }">
      <ul ref="bodyRef" :class="[$style.body, { [$style.close]: !isOpen }]">
        <li v-for="(item, index) in props.list" :key="index" @click.stop="() => onItemClick?.(item, index)"
          :style="{ '--translateY': `${slideCount[index] * 100}%` }" @animationend="() => slideAnimating = false"
          :class="{ [$style.active]: index === props.activeIndex, [$style.slideAnimation]: slideAnimating }">
          <slot :item="item" :index="index">{{ item.name }}</slot>
        </li>
      </ul>
    </div>
  </div>
</template>

<style module>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 30px;
}

.title {
  font-size: 12px;
  color: #767676;
  font-weight: 500;
}

.BodyContainer {
  overflow: hidden;
}

.EnableTransition {
  transition: height .5s ease;
}

.body {
  transform: translateY(0);
  transition: transform .5s ease;
  transition-delay: 0.032s;
}

.close {
  transform: translateY(-100%);
}

.body li {
  height: 30px;
  padding: 0 10px;
  border-radius: 6px;
  font-size: 14px;
  line-height: 30px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all .2s;
}

.active {
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
.iconfont {
  font-size: 16px;
  color: #767676;
  font-weight: 700;
  transition: transform .3s;
  cursor: pointer;
  will-change: transform;
}
</style>