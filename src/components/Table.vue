<script setup lang="ts">
import type { Item } from './type'
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
  /** 表格列 */
  columns: ColumnConfig[]
}
const props = defineProps<Props>()
const rows = defineModel<Item[]>('rows', { required: true })
const sort = defineModel<SortConfig>('sort', { required: true })
const activeIndexes = defineModel<Set<number>>('active-indexes', { default: () => new Set() })

// 样式
const getBorderRadius = (index: number): string => {
  if (!activeIndexes.value?.has(index)) return '8px';
  const hasPrev = activeIndexes.value.has(index - 1);
  const hasNext = activeIndexes.value.has(index + 1);
  if (!hasPrev && !hasNext) return '8px';
  if (hasPrev && hasNext) return '0';
  if (!hasPrev && hasNext) return '8px 8px 0 0';
  return '0 0 8px 8px';
};

// 列表项激活
let lastActiveIndex: number | undefined = undefined
const removeContinuous = (set: Set<number>): Set<number> => {
  const result = new Set<number>();
  for (const num of set) {
    if (!set.has(num - 1) && !set.has(num + 1)) {
      result.add(num);
    }
  }
  return result;
}
const activateItem = (e: PointerEvent, index: number) => {
  let newIndexes = new Set(activeIndexes.value)
  if (e.getModifierState('Meta')) {
    if (activeIndexes.value.has(index)) {
      newIndexes.delete(index)
    } else {
      newIndexes.add(index)
      lastActiveIndex = index
    }
  } else if (e.getModifierState('Shift') && activeIndexes.value.size > 0) {
    newIndexes = removeContinuous(newIndexes)
    const minIndex = Math.min(lastActiveIndex ?? 0, index)
    const maxIndex = Math.max(lastActiveIndex ?? 0, index)
    for (let i = minIndex; i <= maxIndex; i++) {
      newIndexes.add(i)
    }
  } else {
    newIndexes = new Set([index])
    lastActiveIndex = index
  }
  activeIndexes.value = newIndexes
}
const handleRowPointerDown = (e: PointerEvent) => {
  const target = e.target as HTMLElement
  const li = target.closest('li')
  if (!li) return
  const index = li.dataset.index
  if (index === undefined) return
  activateItem(e, Number(index))
}

// 表头排序
const sortByColumn = (id: string, order: 'asc' | 'desc') => {
  const sortProp = props.columns.find(column => column.id === id)!.prop
  const newRows = [...rows.value].sort((a, b) => {
    if (order === 'asc') {
      return a[sortProp].localeCompare(b[sortProp], undefined, { numeric: true });
    } else {
      return b[sortProp].localeCompare(a[sortProp], undefined, { numeric: true });
    }
  })
  const newActiveIndexes = new Set<number>()
  for (const oldIndex of activeIndexes.value) {
    const oldRow = rows.value[oldIndex]
    const newIndex = newRows.findIndex(newItem => newItem.id === oldRow.id)
    if (newIndex !== -1) {
      newActiveIndexes.add(newIndex)
    }
  }
  rows.value = newRows
  sort.value = { id, order }
  activeIndexes.value = newActiveIndexes
}
sortByColumn(sort.value.id, sort.value.order)
</script>

<template>
  <div :class="$style.Table">
    <ul :class="$style.header">
      <li :class="$style.item" v-for="column in props.columns" :key="column.id"
        :style="{ width: column.width + 'px', color: sort.id === column.id ? '#000' : '#808080' }"
        @click.stop="() => sortByColumn(column.id, sort.order === 'asc' ? 'desc' : 'asc')">
        <div :class="$style.container">
          <span :class="$style.text">{{ column.name }}</span>
          <span class="lovelymai lovely-down-arrow" v-show="column.id === sort.id"
            :style="{ transform: sort.order === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)' }"></span>
        </div>
      </li>
    </ul>
    <ul :class="$style.list" @pointerdown.stop.prevent="handleRowPointerDown">
      <li :class="$style.item" v-for="(row, index) in rows" :key="row.id"
        :style="{ backgroundColor: activeIndexes.has(index) ? '#2962D9' : '', borderRadius: getBorderRadius(index) }"
        :data-index="index">
        <span :class="$style.text" v-for="column in props.columns" :key="column.id"
          :style="{ width: column.width + 'px', color: activeIndexes.has(index) ? (sort.id === column.id ? '#fff' : '#bfd0f4') : (sort.id === column.id ? '#000' : '#808080') }">{{
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
}

.header .item {
  padding: 6px 0;
  cursor: pointer;
}

.header .item .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 8px;
}

.header .item:not(:last-child) .container {
  border-right: 0.5px solid #808080;
}

.header .item .container .text {
  font-size: 12px;
  line-height: 16px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.list .item {
  display: flex;
  height: 35px;
}

.list .item:nth-child(even) {
  background-color: #f5f5f5;
}

.list .item .text {
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