<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

import { watchRef } from '../utils/common'

interface Props {
  /** 输入框类型 */
  type?: "text" | "password"
  /** 值 */
  value?: string
  /** 输入框提示词 */
  placeholder?: string
  /** 移动端键盘回车图标 */
  enterkeyhint?: "enter" | "search" | "done" | "go" | "next" | "previous" | "send"
  /** 输入改变事件 */
  onChange?: (newValue: string) => void
  /** 回车搜索事件 */
  onEnter?: (inputValue: string) => void
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  value: '',
  placeholder: '输入...'
});

// 初始化
const ContainerRef = ref<HTMLElement | null>(null)
const containerHeight = ref<string>('0')
const inputHeight = ref<string>('0')
onMounted(() => watchRef(ContainerRef, () => {
  const offsetHeight = ContainerRef.value!.offsetHeight
  containerHeight.value = `${offsetHeight}px`
  inputHeight.value = `${offsetHeight - 2}px`
}, true))

// 输入值改变事件
const InputRef = ref<HTMLInputElement | null>(null)
const inputValue = ref<string>(props.value)
watch(() => props.value, (newValue) => {
  inputValue.value = newValue
})
const onInputChange = (e: Event) => {
  inputValue.value = (e.target as HTMLInputElement).value
  props.onChange?.(inputValue.value)
}
const onInputClear = () => {
  inputValue.value = ''
  props.onChange?.(inputValue.value)
  InputRef.value?.focus()
}

// 中文输入法下回车防止搜索
let isComposing = false;
const compositionend = () => {
  isComposing = false;
};
const compositionstart = () => {
  isComposing = true;
};

// 回车事件
const enter = async (inputValue: string) => {
  if (isComposing) return
  props.onEnter?.(inputValue)
}

// 暴露方法
defineExpose({
  focus: () => InputRef.value?.focus(),
  blur: () => InputRef.value?.blur(),
  select: () => InputRef.value?.select()
})
</script>

<template>
  <div :class="['lovelymaid', 'lovelymaid-glass-container', $style.Input]" ref="ContainerRef">
    <div :class="[$style.icon, $style.custom]">
      <slot><span class="lovelymai lovely-search"></span></slot>
    </div>
    <input :type="props.type" ref="InputRef" :value="inputValue" @input="onInputChange"
      @keydown.enter="enter(inputValue)" :enterkeyhint="props.enterkeyhint" @compositionend="compositionend"
      @compositionstart="compositionstart" :placeholder="props.placeholder" />
    <div :class="[$style.icon, $style.clear]">
      <span class="lovelymai lovely-clear" v-if="inputValue" @click.stop="onInputClear"></span>
    </div>
  </div>
</template>

<style module>
.Input {
  display: flex;
  position: relative;
  height: 35px;
  border-radius: calc(v-bind(containerHeight) / 2);
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
</style>
<style scoped>
input {
  width: 100%;
  height: 100%;
  background-color: transparent;
  border: none;
  border-radius: calc(v-bind(inputHeight) / 2);
  padding: 0 v-bind(inputHeight);
  font-size: var(--font-size);
  font-weight: var(--font-weight);
  caret-color: #3c86f6;
  outline: 0px solid transparent;
  transition: outline .2s ease;
}

input::placeholder {
  font-size: var(--font-size);
  font-weight: var(--font-weight);
  color: var(--placeholder-color);
}

input:focus {
  outline: 3px solid #94bbf0;
}

.lovely-clear {
  font-size: calc(v-bind(inputHeight) / 2);
  color: var(--clear-color);
  cursor: pointer;
  pointer-events: auto;
}
</style>