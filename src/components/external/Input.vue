<script setup lang="ts">
import { onMounted, ref, useSlots, onUnmounted, reactive, computed, watch } from 'vue'
import Card from './Card.vue'
import Menu, { type MenuInstance } from '../internal/Menu.vue'
import DateWindow, { type DateInstance } from '../internal/Date.vue'

import type { OptionItem, DateItem } from '../type'
import { formatDate, verifyDate, watchDOM } from '@/utils/common'
import useCssVar from '@/utils/use-css-var.js'
import { createWindowManager, type WindowManager } from '@/composables/window'

export type InputOption = OptionItem & { selectable?: boolean }
interface Props {
  /** 输入框类型 */
  type?: "text" | "password" | "number" | "select" | "date"
  /** 输入框提示词 */
  placeholder?: string
  /** 移动端键盘回车图标 */
  enterkeyhint?: "enter" | "search" | "done" | "go" | "next" | "previous" | "send"
  /** 是否禁用 */
  disabled?: boolean
  /** 选项 (仅 type 为 select 时有效) */
  options?: InputOption[]
  /** 是否启用选项过滤 (仅 type 为 select 时有效) */
  filter?: boolean
  /** 格式化 (仅 type 为 date 时有效) */
  format?: (date: DateItem) => string
  /** 是否启用校验（仅 type 为 select 或 date 时有效） */
  verify?: boolean
  /** 回车事件 */
  onEnter?: () => void
}
const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  options: () => [],
  filter: false,
  format: ([year, month, day]: DateItem): string => `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`,
  verify: true
})
const inputValue = defineModel<string>('value', { required: true })
const warning = defineModel<boolean>('warning', { default: false })

// 初始化
const InputRef = ref<InstanceType<typeof Card> | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const slots = useSlots()
const style = reactive({
  Input: {
    width: 0,
    height: 0
  },
  input: {
    height: 0,
    get paddingLeft() {
      return slots.default ? style.Input.height : style.Input.height / 2
    }
  }
})
let cleanup: () => void
onMounted(() => {
  if (!InputRef.value) return
  cleanup = watchDOM(InputRef.value.$el, ({ width, height }) => {
    style.Input.width = width
    style.Input.height = height
    style.input.height = height - 2
  })
  useCssVar(InputRef.value.$el, style)
})
onUnmounted(() => cleanup())

// 中文输入法下回车防止搜索
let isComposing = false;
const compositionend = () => {
  setTimeout(() => {
    isComposing = false;
  }, 10);
};
const compositionstart = () => {
  isComposing = true;
};

// 菜单
const MenuRef = ref<HTMLElement | null>(null)
const MenuManager = ref<WindowManager | null>(null)
let isSelecting: boolean = false
onMounted(() => {
  if (!inputRef.value || props.type !== 'select') return
  MenuManager.value = createWindowManager(inputRef.value, MenuRef)
})
onUnmounted(() => {
  MenuManager.value?.cleanup()
})
const onOptionClick = (option: InputOption) => {
  inputRef.value?.focus()
  if (option.options && !option.selectable) return
  isSelecting = true
  inputValue.value = option.name
  MenuManager.value?.close()
}
const filterOptions = (options: InputOption[], keyword: string): InputOption[] =>
  options.reduce<InputOption[]>((acc, option) => {
    if (option.name.includes(keyword)) {
      acc.push(option);
    } else if (option.options) {
      const children = filterOptions(option.options, keyword);
      if (children.length > 0) {
        acc.push({ ...option, options: children });
      }
    }
    return acc;
  }, [])
const filteredOptions = computed<InputOption[]>(() => {
  const keyword = inputValue.value.trim()
  return keyword ? filterOptions(props.options, keyword) : props.options
})
const showingOptions = computed<InputOption[]>(() => props.filter ? filteredOptions.value : props.options)
watch(showingOptions, () => {
  if (!MenuManager.value) return
  if (isSelecting) {
    isSelecting = false
  } else {
    MenuManager.value.open()
  }
})

// 日历
const date = ref<DateItem>(formatDate(Date.now()))
const DateRef = ref<HTMLElement | null>(null)
const DateManager = ref<WindowManager | null>(null)
onMounted(() => {
  if (!inputRef.value || props.type !== 'date') return
  DateManager.value = createWindowManager(inputRef.value, DateRef)
})
onUnmounted(() => {
  DateManager.value?.cleanup()
})
const onDateClick = () => {
  inputRef.value?.focus()
  inputValue.value = props.format(date.value)
  DateManager.value?.close()
}

// 回车
const enter = () => {
  if (isComposing) return
  props.onEnter?.()
}

// 清空
const clear = () => {
  inputValue.value = ''
  inputRef.value?.focus()
  MenuManager.value?.open()
  DateManager.value?.open()
}

// Tab 补全
const collectSelectable = (options: InputOption[]): InputOption[] => options.flatMap(option => option.options && !option.selectable ? collectSelectable(option.options) : [option])
const tab = () => {
  if (props.type === 'select') {
    if (!MenuManager.value) return
    const selectable = collectSelectable(filteredOptions.value)
    if (selectable.length !== 1) return
    isSelecting = true
    inputValue.value = selectable[0].name
    MenuManager.value.close()
  } else if (props.type === 'date') {
    if (!DateManager.value) return
    const match = inputValue.value.match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/)
    if (!match) return
    const newDate: DateItem = [Number(match[1]), Number(match[2]), Number(match[3])]
    date.value = newDate
    inputValue.value = props.format(newDate)
    DateManager.value.close()
  }
}

// 校验是否通过
const verified = computed<boolean>(() => {
  if (!inputValue.value || !props.verify) return true
  if (props.type === 'select') {
    const isSelectable = (options: InputOption[]): boolean =>
      options.some(option => {
        if (option.options && !option.selectable) return isSelectable(option.options)
        return option.name === inputValue.value
      })
    return isSelectable(props.options)
  }
  if (props.type === 'date') {
    const match = inputValue.value.match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/)
    if (!match) return false
    const dateItem: DateItem = [Number(match[1]), Number(match[2]), Number(match[3])]
    return verifyDate(dateItem) && props.format(dateItem) === inputValue.value
  }
  return true
})
watch(inputValue, () => {
  if (props.type !== 'select' && props.type !== 'date') return
  if (verified.value) {
    warning.value = false
  } else {
    warning.value = true
  }
})

// 暴露
defineExpose({
  verification: verified,
  focus: () => {
    inputRef.value?.focus()
    MenuManager.value?.open()
    DateManager.value?.open()
  },
  blur: () => {
    inputRef.value?.blur()
    MenuManager.value?.close()
    DateManager.value?.close()
  },
  select: () => inputRef.value?.select()
})
</script>

<template>
  <Card :class="$style.Input" ref="InputRef" type="glass">
    <div :class="[$style.icon, $style.custom]" v-if="$slots.default">
      <slot></slot>
    </div>
    <input :class="$style.input" ref="inputRef" :style="{ outline: warning ? '3px solid var(--color-red-200)' : '' }"
      :type="props.type === 'select' || props.type === 'date' ? 'text' : props.type" :value="inputValue"
      @input="(e) => inputValue = (e.target as HTMLInputElement).value"
      :placeholder="props.placeholder ?? (props.type === 'select' || props.type === 'date' ? '选择...' : '输入...')"
      :enterkeyhint="props.enterkeyhint" :disabled="props.disabled" @keydown.enter.prevent="enter"
      @keydown.tab.prevent="tab" @compositionstart="compositionstart" @compositionend="compositionend" />
    <div :class="[$style.icon, $style.clear]">
      <span class="lovelymai lovely-clear" v-show="inputValue && !props.disabled" @click.stop="() => clear()"></span>
    </div>
    <Menu :ref="(ins) => MenuRef = (ins as MenuInstance | null)?.root ?? null" v-if="props.type === 'select'"
      :visible="MenuManager?.visible ?? false" :position="MenuManager?.position ?? [0, 0]" :options="showingOptions"
      :width="style.Input.width + 'px'" :on-option-click="onOptionClick" />
    <DateWindow :ref="(ins) => DateRef = (ins as DateInstance | null)?.root ?? null" v-if="props.type === 'date'"
      :visible="DateManager?.visible ?? false" :position="DateManager?.position ?? [0, 0]" v-model:date="date"
      :on-date-click="onDateClick" />
  </Card>
</template>

<style module>
.Input {
  display: flex;
  position: relative;
  height: 35px;
  border-radius: calc(var(--Input-height) * 0.5px);
  --font-size: 14px;
  --font-weight: 400;
  --line-height: 18px;
  --clear-color: var(--color-gray-300);
  --placeholder-color: var(--color-gray-400);
}

.icon {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  width: calc(var(--input-height) * 1px);
  height: 100%;
  font-size: calc(var(--input-height) * 0.5px);
  color: var(--color-gray-500);
  pointer-events: none;
}

.icon.custom {
  left: 0;
}

.icon.clear {
  right: 0;
}

.input {
  flex: 1;
  min-width: 0;
  padding-left: calc(var(--input-paddingLeft) * 1px);
  padding-right: calc(var(--input-height) * 1px);
  background-color: transparent;
  border: none;
  border-radius: calc(var(--input-height) * 0.5px);
  font-size: var(--font-size);
  font-weight: var(--font-weight);
  line-height: var(--line-height);
}

.input {
  caret-color: var(--color-blue-200);
  outline: 0px solid transparent;
  transition: outline .2s ease;
}

.input::placeholder {
  color: var(--placeholder-color);
}

.input:focus {
  outline: 3px solid var(--color-blue-100);
}

.input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
}
</style>
<style scoped>
.lovely-clear {
  font-size: calc(var(--input-height) * 0.5px);
  color: var(--clear-color);
  cursor: pointer;
  pointer-events: auto;
}
</style>