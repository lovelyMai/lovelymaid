<script setup lang="ts">
import { onMounted, ref, watch, useSlots, onUnmounted, reactive } from 'vue'
import Card from './Card.vue'
import Menu, { type MenuItem } from './common/Menu.vue'

import { watchDOM } from '../utils/common'
import { createMenuManager, type MenuManager } from '@/composables/menu.js'
import useCssVar from '@/utils/useCssVar.js'

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
const style = reactive({
  Input: {
    height: 0,
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
  useCssVar(InputRef.value.$el, style)
  cleanup = watchDOM(InputRef.value.$el, ({ height }) => {
    style.Input.height = height
    style.input.height = height - 2
  }, true)
})
onUnmounted(() => cleanup())

// 文字值改变
const inputRef = ref<HTMLInputElement | null>(null)
const onTextChange = (e: Event) => {
  props.onChange?.((e.target as HTMLInputElement).value)
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
// 回车
const textEnter = (e: KeyboardEvent) => {
  if (isComposing) return
  e.preventDefault()
  props.onEnter?.(props.value)
}

// 菜单
const MenuRef = ref<InstanceType<typeof Menu> | null>(null)
const selectRef = ref<HTMLElement | null>(null)
const MenuManagerInstance = ref<MenuManager | undefined>(undefined)
onMounted(() => {
  if (props.type !== 'select' || !selectRef.value || !MenuRef.value) return
  MenuManagerInstance.value = createMenuManager(selectRef.value, MenuRef.value)
})
onUnmounted(() => {
  MenuManagerInstance.value?.cleanup()
})
const onMenuClick = (item: MenuItem, index: number) => {
  if (item.config) return
  props.onChange?.(item.name)
}
const selectEnter = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    props.onEnter?.(props.value)
  }
}
watch(() => MenuManagerInstance.value?.visible, (newVisible) => {
  if (!MenuManagerInstance.value) return
  if (newVisible) {
    document.addEventListener('keydown', selectEnter, true)
  } else {
    document.removeEventListener('keydown', selectEnter, true)
  }
})

// 清空
const onInputClear = () => {
  props.onChange?.('')
  inputRef.value?.focus()
}

// 暴露方法
defineExpose({
  focus: () => {
    if (props.type === 'text' || props.type === 'number' || props.type === 'password') {
      inputRef.value?.focus()
    } else {
      if (!selectRef.value || !MenuManagerInstance.value) return
      const rect = selectRef.value.getBoundingClientRect()
      MenuManagerInstance.value.position = [rect.left + style.input.paddingLeft, rect.top + rect.height + 5]
      MenuManagerInstance.value.visible = true
      document.addEventListener('click', MenuManagerInstance.value.close, true)
    }
  },
  blur: () => {
    if (props.type === 'text' || props.type === 'number' || props.type === 'password') {
      inputRef.value?.blur()
    } else {
      if (!MenuManagerInstance.value) return
      MenuManagerInstance.value.visible = false
      MenuManagerInstance.value.cleanup()
    }
  },
  select: () => inputRef.value?.select()
})
</script>

<template>
  <Card :class="$style.Input" ref="InputRef" :type="MenuManagerInstance?.visible ? 'select' : 'glass'">
    <div :class="[$style.icon, $style.custom]" v-if="$slots.default">
      <slot></slot>
    </div>
    <input :class="$style.input" v-if="props.type === 'text' || props.type === 'number' || props.type === 'password'"
      ref="inputRef" :type="props.type" :value="props.value" @input="onTextChange" @keydown.enter.capture="textEnter"
      :enterkeyhint="props.enterkeyhint" @compositionend="compositionend" @compositionstart="compositionstart"
      :placeholder="props.placeholder || '输入...'" />
    <div :class="$style.select" ref="selectRef" v-else-if="props.type === 'select'">
      <span :class="$style.text">{{ props.value || props.placeholder || '选择...' }}</span>
      <Menu ref="MenuRef" :visible="MenuManagerInstance?.visible ?? false"
        :position="MenuManagerInstance?.position ?? [0, 0]" :config="props.config" :onItemClick="onMenuClick" />
    </div>
    <div :class="[$style.icon, $style.clear]">
      <span class="lovelymai lovely-clear" v-if="props.value" @click.stop="onInputClear"></span>
    </div>
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
  --clear-color: #767676;
  --placeholder-color: #544957;
}

.icon {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  width: calc(var(--input-height) * 1px);
  height: 100%;
  font-size: calc(var(--input-height) * 0.5px);
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
  caret-color: #3c86f6;
  outline: 0px solid transparent;
  transition: outline .2s ease;
}

.input::placeholder {
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
  font-size: calc(var(--input-height) * 0.5px);
  color: var(--clear-color);
  cursor: pointer;
  pointer-events: auto;
}
</style>