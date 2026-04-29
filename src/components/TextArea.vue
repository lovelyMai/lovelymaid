<script setup lang="ts">
import { ref } from 'vue'

import { debounce } from '@/utils/common'

interface Props {
  /** 输入框提示词 */
  placeholder?: string
  /** 移动端键盘回车图标 */
  enterkeyhint?: "enter" | "search" | "done" | "go" | "next" | "previous" | "send"
  /** 获得当前输入值 */
  onChange?: (inputValue: string) => void
  /** 回车搜索事件 */
  onEnter?: (inputValue: string) => void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '输入...'
});

// 输入值改变事件
const InputRef = ref<HTMLTextAreaElement | null>(null)
const inputValue = ref<string>('')
const autoResize = debounce(() => {
  InputRef.value!.style.height = 'auto'
  const newHeight = InputRef.value!.scrollHeight
  InputRef.value!.style.height = `${newHeight + 2}px`
}, 16)
const onInputChange = (e: Event) => {
  inputValue.value = (e.target as HTMLTextAreaElement).value
  props.onChange?.(inputValue.value)
  autoResize()
}

// 中文输入法下回车防止搜索
let isComposing = false;
const compositionend = async () => {
  await new Promise(resolve => setTimeout(resolve, 100))
  isComposing = false;
};
const compositionstart = () => {
  isComposing = true;
};

// 回车事件
const enter = (e: KeyboardEvent) => {
  if (isComposing) return
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    props.onEnter?.(inputValue.value)
  }
}

// 暴露方法
defineExpose({
  focus: () => InputRef.value?.focus(),
  blur: () => InputRef.value?.blur(),
})
</script>

<template>
  <textarea class="lovelymaid-glass-container" ref="InputRef" :value="inputValue" @input="onInputChange"
    @keydown="enter" :enterkeyhint="props.enterkeyhint" @compositionend="compositionend"
    @compositionstart="compositionstart" :placeholder="props.placeholder" />
</template>

<style scoped>
textarea {
  min-height: 55px;
  max-height: 120px;
  padding: 12px;
  border-radius: 18px;
  font-size: 14px;
  caret-color: #3c86f6;
  outline: 0px solid transparent;
  transition: outline .2s ease;
  resize: none;
  overflow-y: auto;
  scrollbar-width: thin;
}

textarea::placeholder {
  font-size: 14px;
  color: #544957;
}

textarea:focus {
  outline: 3px solid #94bbf0;
}
</style>