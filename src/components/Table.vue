<script setup lang="ts">
export type ColumnConfig = {
  id: string
  name: string
  prop: string
  width: number | string
  color?: string
}
interface Props {
  /** 表格配置 */
  config: ColumnConfig[]
  /** 表格数据 */
  data: { id: string, [key: string]: any }[]
  /** 激活项索引 */
  activeIndexes?: Set<number>
  /** 激活项改变事件 */
  onActiveChange?: (newActiveIndexes: Set<number>) => void
}
const props = withDefaults(defineProps<Props>(), {
  activeIndexes: () => new Set()
})

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
  e.preventDefault()
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

// 圆角变化
const getBorderRadius = (index: number): string => {
  if (!props.activeIndexes?.has(index)) return '8px';
  const hasPrev = props.activeIndexes.has(index - 1);
  const hasNext = props.activeIndexes.has(index + 1);
  if (!hasPrev && !hasNext) return '8px';
  if (hasPrev && hasNext) return '0';
  if (!hasPrev && hasNext) return '8px 8px 0 0';
  return '0 0 8px 8px';
};
</script>

<template>
  <div :class="$style.Table">
    <ul :class="$style.header">
      <li :class="$style.item" v-for="column in props.config" :key="column.id"
        :style="{ width: column.width + 'px', color: column.color ?? '#808080' }">
        {{ column.name }}</li>
    </ul>
    <ul :class="$style.list">
      <li :class="$style.item" v-for="(item, index) in props.data" :key="item.id"
        :style="{ backgroundColor: props.activeIndexes?.has(index) ? '#2962D9' : undefined, borderRadius: getBorderRadius(index) }"
        @pointerdown.stop="(e) => activateItem(e, index)">
        <span :class="$style.text" v-for="column in props.config" :key="column.id"
          :style="{ width: column.width + 'px', color: props.activeIndexes?.has(index) ? (column.color ? '#fff' : '#bfd0f4') : (column.color ?? '#808080') }">{{
            item[column.prop] }}</span>
      </li>
    </ul>
  </div>
</template>

<style module>
.header {
  display: flex;
  padding: 6px 0;
  margin-bottom: 4px;
  height: 28px;
  border-bottom: 0.5px solid #808080;
}

.header .item {
  padding: 0 8px;
  font-size: 12px;
  line-height: 16px;
  font-weight: 500;
}

.header .item:not(:last-child) {
  border-right: 0.5px solid #808080;
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