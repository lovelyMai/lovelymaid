<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import Card from './Card.vue'

interface Props {
  /** 最小行数 */
  minrow?: number
  /** 值 */
  value?: string
  /** 输入框提示词 */
  placeholder?: string
  /** 移动端键盘回车图标 */
  enterkeyhint?: "enter" | "search" | "done" | "go" | "next" | "previous" | "send"
  /** 获得当前输入值 */
  onChange?: (inputValue: string) => void
  /** 回车事件 */
  onEnter?: (inputValue: string) => void
}

const props = withDefaults(defineProps<Props>(), {
  minrow: 1,
  value: '',
  placeholder: '输入...'
});

// 输入值改变事件
const TextAreaRef = ref<InstanceType<typeof Card> | null>(null)
const InputRef = ref<HTMLTextAreaElement | null>(null)
const inputValue = ref<string>(props.value)
watch(() => props.value, (newValue) => {
  inputValue.value = newValue
})
const onInputChange = (e: Event) => {
  inputValue.value = (e.target as HTMLInputElement).value
  props.onChange?.(inputValue.value)
}
watch(inputValue, async () => {
  await nextTick()
  autoResize()
})
const autoResize = () => {
  const currentHeight = InputRef.value!.clientHeight + 2
  TextAreaRef.value!.$el.style.height = `${currentHeight}px`
  InputRef.value!.style.height = 'auto'
  const newHeight = InputRef.value!.scrollHeight
  InputRef.value!.style.height = `${newHeight}px`
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
  e.preventDefault()
  props.onEnter?.(inputValue.value)
}

// 暴露方法
defineExpose({
  focus: () => InputRef.value?.focus(),
  blur: () => InputRef.value?.blur(),
  select: () => InputRef.value?.select()
})
</script>

<template>
  <Card :class="$style.TextArea" ref="TextAreaRef" type="glass">
    <textarea :rows="props.minrow" ref="InputRef" :value="inputValue" @input="onInputChange" @keydown.enter="enter"
      :enterkeyhint="props.enterkeyhint" @compositionstart="compositionstart" @compositionend="compositionend"
      :placeholder="props.placeholder" />
  </Card>
</template>

<style module>
.TextArea {
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
  border: none;
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