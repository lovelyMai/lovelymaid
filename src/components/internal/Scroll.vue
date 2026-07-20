<script setup lang="ts">
import { watch } from 'vue'

import { ListItem } from '../type';

interface Props {
  /** 列表 */
  lists: [ListItem[], ListItem[]]
}
const props = defineProps<Props>()
const activeIds = defineModel<string[]>('active-ids')
watch(() => props.lists, (newLists) => {
  if (activeIds.value === undefined) {
    activeIds.value = newLists.map(list => list[0].id)
  }
}, { immediate: true })


</script>

<template>
  <div :class="$style.Scroll">
    <div :class="$style.selected"></div>
    <ul :class="[$style.list, $style.left]">
      <li :class="$style.item" v-for="item in props.lists[0]">
        <span>{{ item.name }}</span>
      </li>
    </ul>
    <ul :class="[$style.list, $style.right]">
      <li :class="$style.item" v-for="item in props.lists[1]">
        <span>{{ item.name }}</span>
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
  padding: 30px 0;
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
  height: 100%;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: none;
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
}

.list.left .item {
  justify-content: flex-end;
}

.list.right .item {
  justify-content: flex-start;
}
</style>