<script setup lang="ts">
import { onMounted, ref, useSlots, onUnmounted, reactive, computed, watch } from 'vue'
import Card from './Card.vue'
import Menu from './common/Menu.vue'

import { watchDOM } from '@/utils/common'
import useCssVar from '@/utils/useCssVar'
import { createMenuManager, type MenuManager } from '@/composables/menu'
import type { OptionItem } from './type'

export type InputOption = OptionItem & { selectable?: boolean }
interface Props {
  /** 输入框类型 */
  type?: "text" | "password" | "number" | "select"
  /** 选项 */
  options?: InputOption[]
  /** 输入框提示词 */
  placeholder?: string
  /** 移动端键盘回车图标 */
  enterkeyhint?: "enter" | "search" | "done" | "go" | "next" | "previous" | "send"
  /** 回车事件 */
  onEnter?: () => void
}
const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  options: () => []
})
const inputValue = defineModel<string>('value', { required: true })

// 初始化
const InputRef = ref<InstanceType<typeof Card> | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const slots = useSlots()
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
  cleanup = watchDOM(InputRef.value.$el, ({ height }) => {
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
const MenuRef = ref<InstanceType<typeof Menu> | null>(null)
const MenuManagerInstance = ref<MenuManager | null>(null)
onMounted(() => {
  if (!inputRef.value || !MenuRef.value) return
  MenuManagerInstance.value = createMenuManager(inputRef.value, MenuRef.value)
})
onUnmounted(() => {
  MenuManagerInstance.value?.cleanup()
})
const onOptionClick = (option: InputOption) => {
  inputRef.value?.focus()
  if (option.options && !option.selectable) return
  isSelecting = true
  inputValue.value = option.name
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
  MenuManagerInstance.value?.open()
}

// 根据输入值过滤选项
let isSelecting: boolean = false
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
watch(filteredOptions, () => {
  if (!MenuManagerInstance.value) return
  if (isSelecting) {
    isSelecting = false
  } else {
    MenuManagerInstance.value.open()
  }
})

// Tab 补全
const collectSelectable = (options: InputOption[]): InputOption[] => options.flatMap(option => option.options && !option.selectable ? collectSelectable(option.options) : [option])
const tab = () => {
  if (!MenuManagerInstance.value) return
  const selectable = collectSelectable(filteredOptions.value)
  if (selectable.length !== 1) return
  isSelecting = true
  inputValue.value = selectable[0].name
  MenuManagerInstance.value.close()
}

// 暴露方法
defineExpose({
  focus: () => {
    inputRef.value?.focus()
    MenuManagerInstance.value?.open()
  },
  blur: () => {
    inputRef.value?.blur()
    MenuManagerInstance.value?.close()
  },
  select: () => inputRef.value?.select()
})
</script>

<template>
  <Card :class="$style.Input" ref="InputRef" type="glass">
    <div :class="[$style.icon, $style.custom]" v-if="$slots.default">
      <slot></slot>
    </div>
    <input :class="$style.input" ref="inputRef" :type="props.type" :value="inputValue"
      @input="(e) => inputValue = (e.target as HTMLInputElement).value"
      :placeholder="props.placeholder ?? (props.type === 'select' ? '选择...' : '输入...')"
      :enterkeyhint="props.enterkeyhint" @keydown.enter.prevent="enter" @keydown.tab.prevent="tab"
      @compositionstart="compositionstart" @compositionend="compositionend" />
    <div :class="[$style.icon, $style.clear]">
      <span class="lovelymai lovely-clear" v-show="inputValue" @click.stop="() => clear()"></span>
    </div>
    <Menu ref="MenuRef" v-if="props.type === 'select'" :visible="MenuManagerInstance?.visible ?? false"
      :position="MenuManagerInstance?.position ?? [0, 0]" :options="filteredOptions" :on-option-click="onOptionClick" />
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
</style>
<style scoped>
.lovely-clear {
  font-size: calc(var(--input-height) * 0.5px);
  color: var(--clear-color);
  cursor: pointer;
  pointer-events: auto;
}
</style>