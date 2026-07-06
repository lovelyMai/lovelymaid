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
  /** 表格行 */
  rows: Item[]
  /** 激活项索引 */
  activeIndexes?: Set<number>
  /** 激活项改变事件 */
  onActiveChange?: (newActiveIndexes: Set<number>) => void
  /** 排序 */
  sort: SortConfig
  /** 排序项改变事件 */
  onSortChange: (newSortConfig: SortConfig, newData: Item[]) => void
}
const props = withDefaults(defineProps<Props>(), {
  activeIndexes: () => new Set()
})

// 样式
const getBorderRadius = (index: number): string => {
  if (!props.activeIndexes?.has(index)) return '8px';
  const hasPrev = props.activeIndexes.has(index - 1);
  const hasNext = props.activeIndexes.has(index + 1);
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
  let newIndexes = new Set(props.activeIndexes)
  if (e.getModifierState('Meta')) {
    if (props.activeIndexes.has(index)) {
      newIndexes.delete(index)
    } else {
      newIndexes.add(index)
      lastActiveIndex = index
    }
  } else if (e.getModifierState('Shift') && props.activeIndexes.size > 0) {
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
  props.onActiveChange?.(newIndexes)
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
  const newData = [...props.rows].sort((a, b) => {
    if (order === 'asc') {
      return a[sortProp].localeCompare(b[sortProp], undefined, { numeric: true });
    } else {
      return b[sortProp].localeCompare(a[sortProp], undefined, { numeric: true });
    }
  })
  const newActiveIndexes = new Set<number>()
  for (const oldIndex of props.activeIndexes) {
    const oldRow = props.rows[oldIndex]
    const newIndex = newData.findIndex(newItem => newItem.id === oldRow.id)
    if (newIndex !== -1) {
      newActiveIndexes.add(newIndex)
    }
  }
  props.onSortChange({ id, order }, newData)
  props.onActiveChange?.(newActiveIndexes)
}
sortByColumn(props.sort.id, props.sort.order)
</script>

<template>
  <div :class="$style.Table">
    <ul :class="$style.header">
      <li :class="$style.item" v-for="column in props.columns" :key="column.id"
        :style="{ width: column.width + 'px', color: props.sort.id === column.id ? '#000' : '#808080' }"
        @click.stop="() => sortByColumn(column.id, props.sort.order === 'asc' ? 'desc' : 'asc')">
        <div :class="$style.container">
          <span :class="$style.text">{{ column.name }}</span>
          <span class="lovelymai lovely-down-arrow" v-show="column.id === props.sort.id"
            :style="{ transform: props.sort.order === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)' }"></span>
        </div>
      </li>
    </ul>
    <ul :class="$style.list" @pointerdown.stop.prevent="handleRowPointerDown">
      <li :class="$style.item" v-for="(row, index) in props.rows" :key="row.id"
        :style="{ backgroundColor: props.activeIndexes?.has(index) ? '#2962D9' : undefined, borderRadius: getBorderRadius(index) }"
        :data-index="index">
        <span :class="$style.text" v-for="column in props.columns" :key="column.id"
          :style="{ width: column.width + 'px', color: props.activeIndexes?.has(index) ? (props.sort.id === column.id ? '#fff' : '#bfd0f4') : (props.sort.id === column.id ? '#000' : '#808080') }">{{
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