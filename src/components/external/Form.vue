<script setup lang="ts">
import { ref } from 'vue'
import Input, { type InputOption } from './Input.vue'
import TextArea from './TextArea.vue'

import { DateItem } from '../type'

export type FormItem = {
  id: string
  name: string
  type?: 'text' | 'number' | 'password' | 'select' | 'textarea' | 'date'
  value: string
  placeholder?: string
  width?: string
  height?: string
  options?: InputOption[]
  format?: (date: DateItem) => string
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
const InputRefs = ref<Record<string, InstanceType<typeof Input> | null>>({})
const TextAreaRefs = ref<Record<string, InstanceType<typeof TextArea> | null>>({})
const onEnter = (index: number) => {
  InputRefs.value[index]?.blur()
  InputRefs.value[index + 1]?.focus()
  TextAreaRefs.value[index]?.blur()
  TextAreaRefs.value[index + 1]?.focus()
}
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
        :ref="(el) => TextAreaRefs[index] = (el as InstanceType<typeof TextArea> | null)" v-model:value="item.value"
        :placeholder="item.placeholder" :enterkeyhint="index === items.length - 1 ? 'done' : 'next'"
        :on-enter="() => onEnter(index)" />
      <Input :class="$style.Input" v-else :ref="(el) => InputRefs[index] = (el as InstanceType<typeof Input> | null)"
        :type="item.type" v-model:value="item.value" :placeholder="item.placeholder"
        :enterkeyhint="index === items.length - 1 ? 'done' : 'next'" :options="item.options" :format="item.format"
        :on-enter="() => onEnter(index)" />
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