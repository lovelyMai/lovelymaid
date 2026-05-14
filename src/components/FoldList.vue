<script setup lang="ts">
import { ref, nextTick, onMounted, watch } from 'vue'
import getSlideCount from '../utils/calculateOffsets'

interface Props {
  /** 标题 */
  title?: string
  /** 要渲染的列表 */
  list?: { id: string, name: string, [key: string]: any }[]
  /** 激活项索引 */
  activeId?: string
  /** 头部点击事件 */
  onHeaderClick?: () => void
  /** 列表项点击事件 */
  onItemClick?: (item: { id: string, name: string, [key: string]: any }, index: number) => void
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
  if (bodyRef.value) {
    bodyHeight.value = bodyRef.value!.offsetHeight
  }
}
const initialize = async () => {
  await calculateHeight()
  setTimeout(() => {
    enableTransition.value = true
  }, 100)
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
const oldList = ref<{ id: string, name: string }[] | undefined>(undefined)
watch(() => props.list, async (newList) => {
  if (!oldList.value) {
    oldList.value = [...newList]
  }
  if (enableTransition.value) {
    slideAnimating.value = false
    slideCount.value = getSlideCount(newList, oldList.value)
    await nextTick()
    slideAnimating.value = true
    oldList.value = [...newList]
  }
}, { deep: true })
</script>

<template>
  <div :class="['lovelymaid', $style.FoldList]">
    <div :class="$style.header" @click.stop="onHeaderClick">
      <div :class="$style.title">
        {{ props.title }}
      </div>
      <span :class="['lovelymai', 'lovely-right-arrow']"
        :style="{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }" :title="isOpen ? '收起列表' : '展开列表'"
        @click.stop="isOpen = !isOpen"></span>
    </div>
    <div :class="[$style.BodyContainer, { [$style.EnableTransition]: enableTransition }]"
      :style="{ height: isOpen ? `${bodyHeight}px` : '0px' }">
      <ul :class="[$style.body, { [$style.close]: !isOpen }]" ref="bodyRef">
        <li
          :class="[$style.item, { [$style.active]: item.id === props.activeId, [$style.slideAnimation]: slideAnimating }]"
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
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 30px;
  cursor: pointer;
}

.header .title {
  font-size: 12px;
  color: #767676;
  font-weight: 500;
}

.BodyContainer {
  overflow: hidden;
}

.BodyContainer.EnableTransition {
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
  font-size: 14px;
  line-height: 30px;
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
.lovelymaid {
  font-size: 16px;
  color: #767676;
  font-weight: 700;
  transition: transform .3s;
  cursor: pointer;
  will-change: transform;
}
</style>