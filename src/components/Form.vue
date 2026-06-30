<script setup lang="ts">
import { ref } from 'vue'
import Input from './Input.vue'
import { type List } from './common/Menu.vue'

export type FormItem = {
  id: string
  name: string
  type?: 'text' | 'password' | 'select'
  value?: string
  options?: List
  placeholder?: string
  enterkeyhint?: "enter" | "search" | "done" | "go" | "next" | "previous" | "send"
  size?: [number | string, number | string]
}
interface Props {
  /** 表单配置 */
  config: FormItem[]
  /** 表单项默认尺寸 */
  defaultSize?: [number | string, number | string]
  /** 输入改变事件 */
  onChange?: (newValue: string, index: number) => void
}
const props = defineProps<Props>()

// 回车聚焦下一个输入框
const InputRefs = ref<Record<string, InstanceType<typeof Input> | null>>({})
const onEnter = (index: number) => {
  InputRefs.value[index + 1]?.focus()
}
</script>
<template>
  <ul :class="$style.Form">
    <li :class="$style.FormItem" v-for="(item, index) in props.config" :key="item.id" :style="{
      width: (item.size?.[0] ?? props.defaultSize?.[0] ?? 150) + 'px',
      height: (item.size?.[1] ?? props.defaultSize?.[1] ?? 35) + 'px'
    }">
      <span :class="$style.name">{{ item.name }}</span>
      <Input :class="$style.Input" :ref="(el) => InputRefs[index] = (el as InstanceType<typeof Input> | null)"
        :type="item.type" :value="item.value" :placeholder="item.placeholder" :options="item.options"
        :enterkeyhint="item.enterkeyhint" :onChange="(newValue) => props.onChange?.(newValue, index)"
        :onEnter="(_) => onEnter(index)" />
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
  align-items: center;
  gap: 10px;
}

.FormItem .Input {
  flex: 1;
  min-width: 0;
  height: 100%;
}
</style>