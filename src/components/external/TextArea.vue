<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import Card from './Card.vue'

interface Props {
  /** 最小行数 */
  minrow?: number
  /** 输入框提示词 */
  placeholder?: string
  /** 移动端键盘回车图标 */
  enterkeyhint?: "enter" | "search" | "done" | "go" | "next" | "previous" | "send"
  /** 是否禁用 */
  disabled?: boolean
  /** 回车事件 */
  onEnter?: () => void
}
const props = withDefaults(defineProps<Props>(), {
  minrow: 1,
  disabled: false,
  placeholder: '输入...'
})
const inputValue = defineModel<string>('value', { required: true })

// 输入输入事件
const TextAreaRef = ref<InstanceType<typeof Card> | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
watch(inputValue, async () => {
  await nextTick()
  autoResize()
})
const autoResize = () => {
  const currentHeight = textareaRef.value!.clientHeight + 2
  TextAreaRef.value!.$el.style.height = `${currentHeight}px`
  textareaRef.value!.style.height = 'auto'
  const newHeight = textareaRef.value!.scrollHeight
  textareaRef.value!.style.height = `${newHeight}px`
  TextAreaRef.value!.$el.style.height = 'auto'
}

// 中文输入法下回车防止搜索
let isComposing = false;
const compositionend = () => {
  setTimeout(() => {
    isComposing = false;
  }, 10)
};
const compositionstart = () => {
  isComposing = true;
};

// 回车事件
const enter = (e: KeyboardEvent) => {
  if (isComposing || e.shiftKey) return
  props.onEnter?.()
}

// 暴露
defineExpose({
  focus: () => textareaRef.value?.focus(),
  blur: () => textareaRef.value?.blur(),
  select: () => textareaRef.value?.select()
})
</script>

<template>
  <Card :class="$style.TextArea" ref="TextAreaRef" type="glass">
    <textarea :rows="props.minrow" ref="textareaRef" :value="inputValue"
      @input="(e) => inputValue = (e.target as HTMLTextAreaElement).value" :placeholder="props.placeholder"
      :enterkeyhint="props.enterkeyhint" :disabled="props.disabled" @keydown.enter.prevent="enter"
      @compositionstart="compositionstart" @compositionend="compositionend" />
  </Card>
</template>

<style module>
.TextArea {
  border-radius: var(--border-radius);
  --max-height: auto;
  --border-radius: 20px;
  --font-size: 14px;
  --font-weight: 400;
  --line-height: 18px;
  --placeholder-color: var(--color-gray-400);
}
</style>
<style scoped>
textarea {
  display: block;
  width: 100%;
  max-height: var(--max-height);
  padding: 12px;
  background-color: transparent;
  border: none;
  border-radius: calc(var(--border-radius) - 1px);
  font-size: var(--font-size);
  font-weight: var(--font-weight);
  line-height: var(--line-height);
  caret-color: var(--color-blue-200);
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
  outline: 3px solid var(--color-blue-100);
}
</style>