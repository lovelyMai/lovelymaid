<script setup lang="ts">
import { computed, ref } from 'vue'
import Input, { type InputOption } from './Input.vue'
import TextArea from './TextArea.vue'

import type { DateItem } from '../type'

export type FormItem = {
  id: string
  name: string
  type?: 'text' | 'number' | 'password' | 'select' | 'textarea' | 'date'
  value: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  width?: string
  height?: string
  options?: InputOption[]
  /** 是否启用选项过滤 (仅 type 为 select 时有效) */
  filter?: boolean
  /** 格式化 (仅 type 为 date 时有效) */
  format?: (date: DateItem) => string
  /** 是否启用校验（仅 type 为 select 或 date 时有效） */
  verify?: boolean
  /** 弹窗 z-index（仅 type 为 select 或 date 时有效）*/
  zIndex?: number
  /** 是否警告 */
  warning?: boolean
}
interface Props {
  /** 表单项默认宽 */
  itemWidth?: string
  /** 标单项默认高 */
  itemHeight?: string
}
const props = defineProps<Props>()
const items = defineModel<FormItem[]>('items', { required: true })

// 回车聚焦下一个输入框
const InputInstancesRef = ref<Record<string, InstanceType<typeof Input> | null>>({})
const TextAreaInstancesRef = ref<Record<string, InstanceType<typeof TextArea> | null>>({})
const onEnter = (index: number) => {
  InputInstancesRef.value[index]?.blur()
  InputInstancesRef.value[index + 1]?.focus()
  TextAreaInstancesRef.value[index]?.blur()
  TextAreaInstancesRef.value[index + 1]?.focus()
}

// 校验结果（key 为表单项 id）
const verifications = computed<Record<string, boolean>>(() => {
  const result: Record<string, boolean> = {}
  items.value.forEach((item, index) => {
    if (item.type === 'textarea') {
      result[item.id] = true
    } else {
      result[item.id] = InputInstancesRef.value[index]?.verification ?? false
    }
  })
  return result
})

// 暴露
defineExpose({ verifications })
</script>
<template>
  <ul :class="$style.Form" ref="FormRef">
    <li :class="$style.FormItem" v-for="(item, index) in items" :key="item.id" :style="{
      width: item.type === 'textarea' ? '100%' : (item.width ?? props.itemWidth ?? '150px'),
      height: item.type === 'textarea' ? '' : (item.height ?? props.itemHeight ?? '35px')
    }">
      <span :class="$style.name"
        :style="{ lineHeight: item.type === 'textarea' ? '42px' : (item.height ?? props.itemHeight ?? 35) + 'px' }">
        {{ item.name }}</span>
      <TextArea :class="$style.TextArea" v-if="item.type === 'textarea'"
        :ref="(el) => TextAreaInstancesRef[index] = (el as InstanceType<typeof TextArea> | null)"
        v-model:value="item.value" :placeholder="item.placeholder"
        :enterkeyhint="index === items.length - 1 ? 'done' : 'next'" :disabled="item.disabled"
        :on-enter="() => onEnter(index)" />
      <Input :class="$style.Input" v-else
        :ref="(el) => InputInstancesRef[index] = (el as InstanceType<typeof Input> | null)" :type="item.type"
        v-model:value="item.value" :placeholder="item.placeholder"
        :enterkeyhint="index === items.length - 1 ? 'done' : 'next'" :disabled="item.disabled" :readonly="item.readonly"
        :options="item.options" :filter="item.filter" :format="item.format" :verify="item.verify" :z-index="item.zIndex"
        v-model:warning="item.warning" :on-enter="() => onEnter(index)" />
    </li>
  </ul>
</template>
<style module>
.Form {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 10px;
}

.FormItem {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.FormItem .Input,
.FormItem .TextArea {
  flex: 1;
  min-width: 0;
}

.FormItem .Input {
  height: 100%;
}
</style>