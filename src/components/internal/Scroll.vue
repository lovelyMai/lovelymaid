<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

import { ListItem } from '../type';
import { debounce } from '@/utils/common';

interface Props {
  /** 列表 */
  lists: [ListItem[], ListItem[]]
}
const props = defineProps<Props>()
const activeIds = defineModel<[string, string]>('active-ids')
watch(() => props.lists, (newLists) => {
  if (activeIds.value === undefined) {
    activeIds.value = newLists.map(list => list[0].id) as [string, string]
  }
}, { immediate: true })

// 激活 id
const leftRef = ref<HTMLElement | null>(null)
const rightRef = ref<HTMLElement | null>(null)
let stopWatch: (() => void) | undefined
const calculateActiveIds = (el: 'left' | 'right') => {
  let index: number | undefined
  if (el === 'left' && leftRef.value) {
    index = Math.floor(leftRef.value.scrollTop / 24)
    activeIds.value = [props.lists[0][index].id, activeIds.value![1]]
  } else if (el === 'right' && rightRef.value) {
    index = Math.floor(rightRef.value.scrollTop / 24)
    activeIds.value = [activeIds.value![0], props.lists[1][index].id]
  }
}
const delayCalculateActiveIds = debounce(calculateActiveIds, 100)
onMounted(() => {
  if (!leftRef.value || !rightRef.value) return
  stopWatch = watch([() => props.lists, activeIds], ([newLists, newActiveIds]) => {
    leftRef.value!.scrollTop = 24 * newLists[0].findIndex(item => item.id === newActiveIds![0])
    rightRef.value!.scrollTop = 24 * newLists[1].findIndex(item => item.id === newActiveIds![1])
  }, { immediate: true, deep: true })
})
onUnmounted(() => {
  stopWatch?.()
})
</script>

<template>
  <div :class="$style.Scroll">
    <div :class="$style.selected"></div>
    <ul :class="[$style.list, $style.left]" ref="leftRef" @scroll="() => delayCalculateActiveIds('left')">
      <li :class="$style.item" v-for="item in Array(3).fill('')">
        <span>{{ item }}</span>
      </li>
      <li :class="$style.item" v-for="item in props.lists[0]">
        <span>{{ item.name }}</span>
      </li>
      <li :class="$style.item" v-for="item in Array(3).fill('')">
        <span>{{ item }}</span>
      </li>
    </ul>
    <ul :class="[$style.list, $style.right]" ref="rightRef" @scroll="() => delayCalculateActiveIds('right')">
      <li :class="$style.item" v-for="item in Array(3).fill('')">
        <span>{{ item }}</span>
      </li>
      <li :class="$style.item" v-for="item in props.lists[1]">
        <span>{{ item.name }}</span>
      </li>
      <li :class="$style.item" v-for="item in Array(3).fill('')">
        <span>{{ item }}</span>
      </li>
    </ul>
  </div>
</template>

<style module>
.Scroll {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  z-index: 0;
  padding: 16px 0;
  height: 200px;
}

.selected {
  position: absolute;
  left: 0;
  top: calc(50% - 12px);
  z-index: 0;
  width: 100%;
  height: 24px;
  background-color: #f4f4f4;
  border-radius: 12px;
}

.list {
  position: relative;
  z-index: 1;
  width: 50%;
  height: 168px;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: none;
  scroll-snap-type: y mandatory;
}

.list.left {
  padding-left: 5px;
}

.list.right {
  padding: 0 5px 0 10px;
}

.list .item {
  display: flex;
  height: 24px;
  font-size: 16px;
  line-height: 24px;
  scroll-snap-align: start;
}

.list.left .item {
  justify-content: flex-end;
}

.list.right .item {
  justify-content: flex-start;
}
</style>