<script setup lang="ts">
import Input from './Input.vue'

export type FormItem = {
  id: string
  name: string
  type?: 'text' | 'password'
  value?: string
  placeholder?: string
  enterkeyhint?: "enter" | "search" | "done" | "go" | "next" | "previous" | "send"
  width?: string
  height?: string
}
interface Props {
  config: FormItem[]
  columnWidth?: string
  rowHeight?: string
  onChange?: (newValue: string, index: number) => void
  onEnter?: (inputValue: string, index: number) => void
}
const props = defineProps<Props>()
</script>
<template>
  <ul :class="['lovelymaid', $style.Form]">
    <li :class="$style.FormItem" v-for="(item, index) in props.config" :key="item.id"
      :style="{ width: item.width || props.columnWidth || '150px', height: item.height || props.rowHeight || '35px' }">
      <span :class="$style.name">{{ item.name }}</span>
      <Input :class="$style.Input" :type="item.type" :value="item.value" :placeholder="item.placeholder"
        :enterkeyhint="item.enterkeyhint" :onChange="(newValue) => props.onChange?.(newValue, index)" :onEnter="(inputValue) => props.onEnter?.(inputValue, index)" />
    </li>
  </ul>
</template>
<style module>
.Form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.FormItem {
  display: flex;
  align-items: center;
  gap: 10px;
}

.FormItem .Input {
  flex: 1;
  height: 100%;
}
</style>