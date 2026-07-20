<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import Menu, { type MenuInstance } from '../internal/Menu.vue'

import { createMenuManager, type MenuManager } from '@/composables/menu'
import { createActivationManager, type ActivationManager } from '@/composables/activation'

import type { Item } from '../type.js'

export type ColumnConfig = {
  id: string
  name: string
  prop: string
  width: number | string
}
export type SortConfig = {
  /** 列 id */
  id: string
  /** 排序规则 */
  order: 'asc' | 'desc'
}
interface Props {
  /** 列 */
  columns: ColumnConfig[]
  /** 行 */
  rows: Item[]
}
const props = defineProps<Props>()
const sort = defineModel<SortConfig>('sort')
const activeIds = defineModel<Set<string>>('active-ids', { default: () => new Set() })

// 表头排序
const sortedRows = computed<Item[]>(() => {
  if (!sort.value) return props.rows
  const sortProp = props.columns.find(column => column.id === sort.value!.id)!.prop
  return [...props.rows].sort((a, b) => {
    if (sort.value!.order === 'asc') {
      return a[sortProp].localeCompare(b[sortProp], undefined, { numeric: true });
    } else {
      return b[sortProp].localeCompare(a[sortProp], undefined, { numeric: true });
    }
  })
})

// 列表项激活
const ListRef = ref<HTMLElement | null>(null)
const ActivationManagerInstance = ref<ActivationManager | null>(null)
onMounted(() => {
  if (!ListRef.value) return
  ActivationManagerInstance.value = createActivationManager(sortedRows, activeIds, ListRef.value)
})
onUnmounted(() => {
  ActivationManagerInstance.value?.cleanup()
})
const getBorderRadius = (index: number): string => {
  if (!ActivationManagerInstance.value?.activeIndexes.has(index)) return '8px';
  const hasPrev = ActivationManagerInstance.value.activeIndexes.has(index - 1);
  const hasNext = ActivationManagerInstance.value.activeIndexes.has(index + 1);
  if (!hasPrev && !hasNext) return '8px';
  if (hasPrev && hasNext) return '0';
  if (!hasPrev && hasNext) return '8px 8px 0 0';
  return '0 0 8px 8px';
};

// 启用/关闭排序
const headerRef = ref<HTMLElement | null>(null)
const MenuInstance = ref<MenuInstance | null>(null)
const MenuManager = ref<MenuManager | null>(null)
onMounted(() => {
  if (!headerRef.value || !MenuInstance.value) return
  MenuManager.value = createMenuManager(headerRef.value, MenuInstance.value, 'flex', 'contextmenu')
})
onUnmounted(() => {
  MenuManager.value?.cleanup()
})
</script>

<template>
  <div :class="$style.Table">
    <ul :class="$style.header" ref="headerRef">
      <li :class="$style.column" v-for="column in props.columns" :key="column.id"
        :style="{ width: column.width + 'px', color: sort?.id === column.id ? '#000' : '#808080' }"
        @click.stop="() => sort = { id: column.id, order: sort?.order === 'asc' ? 'desc' : 'asc' }">
        <div :class="$style.container">
          <span :class="$style.text">{{ column.name }}</span>
          <span class="lovelymai lovely-down-arrow" v-show="column.id === sort?.id"
            :style="{ transform: sort?.order === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)' }"></span>
        </div>
      </li>
      <Menu :ref="(ins) => MenuInstance = (ins as MenuInstance | null)" :visible="MenuManager?.visible ?? false"
        :position="MenuManager?.position ?? [0, 0]" :options="[{ id: '1', name: '关闭排序' }]"
        :on-option-click="() => sort = undefined" />
    </ul>
    <ul :class="$style.list" ref="ListRef">
      <li :class="$style.row" v-for="(row, index) in sortedRows" :key="row.id"
        :style="{ backgroundColor: ActivationManagerInstance?.activeIndexes.has(index) ? '#2962D9' : '', borderRadius: getBorderRadius(index) }">
        <span :class="$style.text" v-for="column in props.columns" :key="column.id"
          :style="{ width: column.width + 'px', color: ActivationManagerInstance?.activeIndexes.has(index) ? (sort?.id === column.id ? '#fff' : '#bfd0f4') : (sort?.id === column.id ? '#000' : '#808080') }">{{
            row[column.prop] }}</span>
      </li>
    </ul>
  </div>
</template>

<style module>
.header {
  display: flex;
  margin-bottom: 4px;
  height: 28px;
  border-bottom: 0.5px solid #808080;
  user-select: none;
  -webkit-user-select: none;
}

.header .column {
  padding: 6px 0;
  cursor: pointer;
}

.header .column .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 8px;
}

.header .column:not(:last-child) .container {
  border-right: 0.5px solid #808080;
}

.header .column .container .text {
  font-size: 12px;
  line-height: 16px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.list .row {
  display: flex;
  height: 35px;
}

.list .row:nth-child(even) {
  background-color: #f5f5f5;
}

.list .row .text {
  padding: 0 8px;
  font-size: 16px;
  line-height: 35px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
<style scoped>
.lovely-down-arrow {
  font-size: 12px;
  color: #808080;
  font-weight: 700;
}
</style>