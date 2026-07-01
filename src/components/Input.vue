<script setup lang="ts">
import { computed, onMounted, ref, watch, useSlots, onUnmounted } from 'vue'
import Card from './Card.vue'
import Menu, { type MenuItem } from './common/Menu.vue'

import { watchDOM } from '../utils/common'
import { createMenuManager, type MenuManager } from '@/composables/menu.js'

interface Props {
  /** 输入框类型 */
  type?: "text" | "password" | "number" | "select"
  /** 值 */
  value?: string
  /** 选项 */
  config?: MenuItem[]
  /** 输入框提示词 */
  placeholder?: string
  /** 移动端键盘回车图标 */
  enterkeyhint?: "enter" | "search" | "done" | "go" | "next" | "previous" | "send"
  /** 输入改变事件 */
  onChange?: (newValue: string) => void
  /** 回车事件 */
  onEnter?: (inputValue: string) => void
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  value: '',
  config: () => []
});

// 初始化
const slots = useSlots()
const InputRef = ref<InstanceType<typeof Card> | null>(null)
const InputHeight = ref<string>('0')
const inputHeight = ref<string>('0')
const inputPaddingLeft = computed<string>(() => slots.default ? inputHeight.value : `calc(${inputHeight.value} / 2)`)
let cleanup: () => void
onMounted(() => {
  cleanup = watchDOM(InputRef.value?.$el, ({ height }) => {
    InputHeight.value = `${height}px`
    inputHeight.value = `${height - 2}px`
  }, true)
})
onUnmounted(() => cleanup())

// 输入值改变事件
const inputRef = ref<HTMLInputElement | null>(null)
const inputValue = ref<string>(props.value)
watch(() => props.value, (newValue) => {
  inputValue.value = newValue
})
const onInputChange = (e: Event) => {
  inputValue.value = (e.target as HTMLInputElement).value
  props.onChange?.(inputValue.value)
}

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

// 回车事件
const enter = async () => {
  if (isComposing) return
  props.onEnter?.(inputValue.value)
}

// 菜单
const MenuRef = ref<InstanceType<typeof Menu> | null>(null)
const selectRef = ref<HTMLElement | null>(null)
const MenuManager = ref<MenuManager | undefined>(undefined)
onMounted(() => {
  if (props.type !== 'select' || !selectRef.value || !MenuRef.value) return
  MenuManager.value = createMenuManager(selectRef.value, MenuRef.value)
})
onUnmounted(() => {
  MenuManager.value?.cleanup()
})
const onMenuClick = (item: MenuItem, index: number) => {
  if (item.config) return
  inputValue.value = item.name
  props.onChange?.(inputValue.value)
}

// 清空
const onInputClear = () => {
  inputValue.value = ''
  props.onChange?.(inputValue.value)
  inputRef.value?.focus()
}

// 暴露方法
defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
  select: () => inputRef.value?.select()
})
</script>

<template>
  <Card :class="$style.Input" ref="InputRef" :type="MenuManager?.visible ? 'select' : 'glass'">
    <div :class="[$style.icon, $style.custom]" v-if="$slots.default">
      <slot></slot>
    </div>
    <input :class="$style.input" v-if="props.type === 'text' || props.type === 'number' || props.type === 'password'"
      ref="inputRef" :type="props.type" :value="inputValue" @input="onInputChange" @keydown.enter="enter"
      :enterkeyhint="props.enterkeyhint" @compositionend="compositionend" @compositionstart="compositionstart"
      :placeholder="props.placeholder || '输入...'" />
    <div :class="$style.select" ref="selectRef" v-else-if="props.type === 'select'">
      <span :class="$style.text">{{ inputValue || props.placeholder || '选择...' }}</span>
      <Menu ref="MenuRef" :visible="MenuManager?.visible ?? false" :position="MenuManager?.position ?? [0, 0]"
        :config="props.config" :onItemClick="onMenuClick" />
    </div>
    <div :class="[$style.icon, $style.clear]">
      <span class="lovelymai lovely-clear" v-if="inputValue" @click.stop="onInputClear"></span>
    </div>
  </Card>
</template>

<style module>
.Input {
  display: flex;
  position: relative;
  height: 35px;
  border-radius: calc(v-bind(InputHeight) / 2);
  --font-size: 14px;
  --font-weight: 400;
  --clear-color: #767676;
  --placeholder-color: #544957;
}

.icon {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  width: v-bind(inputHeight);
  height: 100%;
  font-size: calc(v-bind(inputHeight) / 2);
  color: #19191a;
  pointer-events: none;
}

.icon.custom {
  left: 0;
}

.icon.clear {
  right: 0;
}

.input,
.select {
  flex: 1;
  min-width: 0;
  padding-left: v-bind(inputPaddingLeft);
  padding-right: v-bind(inputHeight);
  background-color: transparent;
  border: none;
  border-radius: calc(v-bind(inputHeight) / 2);
  font-size: var(--font-size);
  font-weight: var(--font-weight);
}

.input {
  caret-color: #3c86f6;
  outline: 0px solid transparent;
  transition: outline .2s ease;
}

.input::placeholder {
  font-size: var(--font-size);
  font-weight: var(--font-weight);
  color: var(--placeholder-color);
}

.input:focus {
  outline: 3px solid #94bbf0;
}

.input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
}

.select {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
}

.select .text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
<style scoped>
.lovely-clear {
  font-size: calc(v-bind(inputHeight) / 2);
  color: var(--clear-color);
  cursor: pointer;
  pointer-events: auto;
}
</style>