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
  onChange?: (newValue: string) => void
  onEnter?: (inputValue: string) => void
}
interface Props {
  config: FormItem[]
}
const props = defineProps<Props>()
</script>
<template>
  <ul :class="['lovelymaid', $style.Form]">
    <li :class="$style.FormItem" v-for="(item, index) in props.config" :key="item.id" :style="{ width: item.width }">
      <span :class="$style.name">{{ item.name }}</span>
      <Input :class="$style.Input" :type="item.type" :value="item.value" :placeholder="item.placeholder"
        :enterkeyhint="item.enterkeyhint" :onChange="item.onChange" :onEnter="item.onEnter" />
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
}
</style>