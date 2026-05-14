<script setup lang="ts">
import { onMounted, ref } from 'vue'

interface Props {
  /** 最小行数 */
  minrow?: number
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
  minrow: 1,
  placeholder: '输入...'
});

// 输入值改变事件
const TextAreaRef = ref<HTMLTextAreaElement | null>(null)
const inputValue = ref<string>('')
const autoResize = () => {
  TextAreaRef.value!.style.height = 'auto'
  const newHeight = TextAreaRef.value!.scrollHeight
  console.log(newHeight)
  TextAreaRef.value!.style.height = `${newHeight}px`
}
const onInputChange = (e: Event) => {
  inputValue.value = (e.target as HTMLTextAreaElement).value
  props.onChange?.(inputValue.value)
  autoResize()
}
onMounted(() => {
  autoResize()
})

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
  focus: () => TextAreaRef.value?.focus(),
  blur: () => TextAreaRef.value?.blur(),
})
</script>

<template>
  <div :class="[$style.container, 'lovelymaid', 'lovelymaid-glass-container']" ref="ContainerRef">
    <textarea :rows="props.minrow" ref="TextAreaRef" :value="inputValue" @input="onInputChange" @keydown="enter"
      :enterkeyhint="props.enterkeyhint" @compositionend="compositionend" @compositionstart="compositionstart"
      :placeholder="props.placeholder" />
  </div>
</template>

<style module>
.container {
  border-radius: var(--border-radius);
  --max-height: auto;
  --border-radius: 20px;
  --font-size: 14px;
  --font-weight: 400;
  --line-height: normal;
  --placeholder-color: #544957;
}
</style>
<style scoped>
textarea {
  display: block;
  width: 100%;
  max-height: var(--max-height);
  padding: 12px;
  background-color: transparent;
  border-radius: calc(var(--border-radius) - 1px);
  font-size: var(--font-size);
  font-weight: var(--font-weight);
  line-height: var(--line-height);
  caret-color: #3c86f6;
  outline: 0px solid transparent;
  transition: outline .2s ease;
  resize: none;
  overflow-y: auto;
  scrollbar-width: thin;
}

textarea::placeholder {
  color: var(--placeholder-color);
}

textarea:focus {
  outline: 3px solid #94bbf0;
}
</style>