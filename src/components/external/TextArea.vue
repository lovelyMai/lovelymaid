<script setup lang="ts">
import { nextTick, onMounted, reactive, ref, useSlots, watch } from 'vue'
import Card from './Card.vue'

import type { EnterKeyHint } from '@/types'
import { useCssVar } from '@/utils/css-var'

interface Props {
  /** 最小行数 */
  minrow?: number
  /** 输入框提示词 */
  placeholder?: string
  /** 移动端键盘回车图标 */
  enterkeyhint?: EnterKeyHint
  /** 是否禁用 */
  disabled?: boolean
  /** 回车事件 */
  onEnter?: () => void
}
const props = withDefaults(defineProps<Props>(), {
  minrow: 1,
  disabled: false,
  placeholder: '输入...',
})
const inputValue = defineModel<string>('value', { required: true })

// 初始化
const textareaContainerRef = ref<HTMLElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const slots = useSlots()
const style = reactive({
  textarea: {
    get paddingBottom() {
      return slots.default ? 40 : 12
    },
  },
})
onMounted(() => {
  if (!textareaContainerRef.value) return
  useCssVar(textareaContainerRef.value, style)
})

// 输入输入事件
watch(inputValue, async () => {
  await nextTick()
  autoResize()
})
const autoResize = () => {
  textareaRef.value!.style.height = 'auto'
  textareaRef.value!.style.height = `${textareaRef.value!.scrollHeight}px`
}

// 中文输入法下不触发回车事件
let isComposing = false
const compositionend = () => {
  setTimeout(() => {
    isComposing = false
  }, 10)
}
const compositionstart = () => {
  isComposing = true
}

// 回车事件
const enter = (e: KeyboardEvent) => {
  // 正在打字或按住了 shift 直接无视
  if (isComposing || e.shiftKey) return
  // 普通 enter 才阻止换行+触发回车事件
  e.preventDefault()
  props.onEnter?.()
}

// 暴露
defineExpose({
  focus: () => textareaRef.value?.focus(),
  blur: () => textareaRef.value?.blur(),
  select: () => textareaRef.value?.select(),
})
</script>

<template>
  <Card
    :class="$style.textareaContainer"
    :ref="(el) => (textareaContainerRef = (el as InstanceType<typeof Card> | null)?.$el ?? null)"
  >
    <textarea
      :class="$style.textarea"
      ref="textareaRef"
      :rows="props.minrow"
      :value="inputValue"
      @input="(e) => (inputValue = (e.target as HTMLTextAreaElement).value)"
      :placeholder="props.placeholder"
      :enterkeyhint="props.enterkeyhint"
      :disabled="props.disabled"
      @keydown.enter="enter"
      @compositionstart="compositionstart"
      @compositionend="compositionend"
    />
    <div :class="$style.footer" v-if="slots.default">
      <slot></slot>
    </div>
  </Card>
</template>

<style module>
.textareaContainer {
  position: relative;
  border-radius: var(--border-radius);
  --max-height: auto;
  --border-radius: 20px;
  --font-size: 14px;
  --font-weight: 400;
  --line-height: 18px;
  --placeholder-color: var(--lovelymai-color-gray-400);
}

.textarea {
  display: block;
  width: 100%;
  max-height: var(--max-height);
  padding: 12px;
  padding-bottom: calc(var(--textarea-paddingBottom) * 1px);
  background-color: transparent;
  border: none;
  border-radius: calc(var(--border-radius) - 1px);
  font-size: var(--font-size);
  font-weight: var(--font-weight);
  line-height: var(--line-height);
  caret-color: var(--lovelymai-color-blue-200);
  outline: 0px solid transparent;
  transition: outline 0.2s ease;
  resize: none;
  overflow-y: auto;
  scrollbar-width: thin;
}

.textarea::placeholder {
  color: var(--placeholder-color);
}

.textarea:focus {
  outline: 3px solid var(--lovelymai-color-blue-100);
}

.footer {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 28px;
  pointer-events: none;
}
</style>
