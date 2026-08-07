<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import Card from './Card.vue'
import Menu, { type MenuInstance } from '../internal/Menu.vue'

import type { Item } from '@/types'
import { createWindowManager, type WindowManager } from '@/utils/window.js'
import { createActivationManager, type ActivationManager } from '@/utils/activation.js'
import Loading from './Loading.vue'

export type ColumnConfig = {
  id: string | number
  name: string
  prop: string
  width?: string
}
export type SortConfig = {
  /** 列 id */
  id: string | number
  /** 排序规则 */
  order: 'asc' | 'desc'
}
interface Props {
  /** 列 */
  columns: ColumnConfig[]
  /** 行 */
  rows: Item[]
  /** 弹窗 z-index */
  zIndex?: number
  /** 加载状态 */
  loading?: boolean
}
const props = defineProps<Props>()
const sort = defineModel<SortConfig>('sort')
const activeIds = defineModel<Set<string | number>>('active-ids', { default: () => new Set() })

// 表头排序
const onHeaderClick = (column: ColumnConfig) => {
  const valid = props.rows.every(row => typeof row[column.prop] === 'string' || typeof row[column.prop] === 'number')
  if (!valid) return
  sort.value = { id: column.id, order: sort.value?.order === 'asc' ? 'desc' : 'asc' }
}
const sortedRows = computed<Item[]>(() => {
  if (!sort.value) return props.rows
  const sortProp = props.columns.find(column => column.id === sort.value!.id)!.prop
  const valid = props.rows.every(row => typeof row[sortProp] === 'string' || typeof row[sortProp] === 'number')
  if (!valid) return props.rows
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
const ActivationManager = ref<ActivationManager | null>(null)
onMounted(() => {
  if (!ListRef.value) return
  ActivationManager.value = createActivationManager(sortedRows, activeIds, ListRef.value)
})
onUnmounted(() => {
  ActivationManager.value?.cleanup()
})
const getBorderRadius = (index: number): string => {
  if (!ActivationManager.value?.activeIndexes.has(index)) return '8px';
  const hasPrev = ActivationManager.value.activeIndexes.has(index - 1);
  const hasNext = ActivationManager.value.activeIndexes.has(index + 1);
  if (!hasPrev && !hasNext) return '8px';
  if (hasPrev && hasNext) return '0';
  if (!hasPrev && hasNext) return '8px 8px 0 0';
  return '0 0 8px 8px';
};

// 启用/关闭排序
const headerRef = ref<HTMLElement | null>(null)
const MenuRef = ref<HTMLElement | null>(null)
const MenuManager = ref<WindowManager | null>(null)
onMounted(() => {
  if (!headerRef.value) return
  MenuManager.value = createWindowManager(headerRef.value, MenuRef, 'flex', 'contextmenu')
})
onUnmounted(() => {
  MenuManager.value?.cleanup()
})
</script>

<template>
  <Card :class="$style.Table">
    <ul :class="$style.header" ref="headerRef">
      <li :class="$style.column" v-for="column in props.columns" :key="column.id"
        :style="{ width: column.width ?? '200px', color: sort?.id === column.id ? '#000' : 'var(--lovelymai-color-gray-300)' }"
        @click.stop="() => onHeaderClick(column)">
        <span :class="$style.text">{{ column.name }}</span>
        <span class="lovelymai lovely-down-arrow" v-show="column.id === sort?.id"
          :style="{ transform: sort?.order === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)' }"></span>
      </li>
      <Menu :ref="(ins) => MenuRef = (ins as MenuInstance | null)?.root ?? null"
        :visible="MenuManager?.visible ?? false" :position="MenuManager?.position ?? [0, 0]" :z-index="props.zIndex"
        :options="[{ id: '1', name: '关闭排序' }]" :on-option-click="() => {
          sort = undefined
          MenuManager?.close()
        }" />
    </ul>
    <ul :class="$style.list" ref="ListRef">
      <li :class="$style.row" v-for="(row, index) in sortedRows" :key="row.id"
        :style="{ backgroundColor: ActivationManager?.activeIndexes.has(index) ? 'var(--lovelymai-color-blue-450)' : '', borderRadius: getBorderRadius(index) }">
        <span :class="$style.cell" v-for="column in props.columns" :key="column.id"
          :style="{ width: column.width ?? '200px', color: ActivationManager?.activeIndexes.has(index) ? (sort?.id === column.id ? '#fff' : 'var(--lovelymai-color-blue-50)') : (sort?.id === column.id ? '#000' : 'var(--lovelymai-color-gray-300)') }">
          <slot :row="row" :column="column">{{ row[column.prop] }}</slot>
        </span>
      </li>
    </ul>
    <Loading :loading="props.loading" :z-index="1" />
  </Card>
</template>

<style module>
.Table {
  position: relative;
  z-index: 0;
  padding: 12px;
  border-radius: 16px;
  overflow: auto;
  scrollbar-width: thin;
}

.header {
  display: flex;
  margin-bottom: 4px;
  width: max-content;
  height: 28px;
  border-bottom: 0.5px solid var(--lovelymai-color-gray-300);
  user-select: none;
  -webkit-user-select: none;
}

.header .column {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  cursor: pointer;
}

.header .column:not(:last-child) {
  border-right: 0.5px solid var(--lovelymai-color-gray-300);
}

.header .column .text {
  font-size: 12px;
  line-height: 16px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.list .row {
  display: flex;
  width: max-content;
  height: 35px;
}

.list .row:nth-child(even) {
  background-color: var(--lovelymai-color-gray-150);
}

.list .row .cell {
  flex-shrink: 0;
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
  color: var(--lovelymai-color-gray-300);
  font-weight: 700;
}
</style>