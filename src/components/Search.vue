<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { watchRef } from '../utils/common'

interface Props {
  /** 输入框提示词 */
  placeholder?: string
  /** 回车搜索事件 */
  onSearch?: (inputValue: string) => void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '搜索...'
});

// 初始化
const SearchRef = ref<HTMLElement | null>(null)
const searchHeight = ref<string>('0')
onMounted(() => watchRef(SearchRef, () => {
  searchHeight.value = `${SearchRef.value!.offsetHeight}px`
}, true))

// 输入框内容
const inputValue = ref<string>('')

// 中文输入法下回车防止搜索
let isComposing = false;
const compositionend = async () => {
  await new Promise(resolve => setTimeout(resolve, 100))
  isComposing = false;
};
const compositionstart = () => {
  isComposing = true;
};

// 回车搜索事件
const search = async (inputValue: string) => {
  if (isComposing) return
  props.onSearch?.(inputValue)
}

</script>

<template>
  <div class="lovelymaid-glass-container Search" ref="SearchRef">
    <span class="iconfont icon-search"></span>
    <input v-model="inputValue" class='input' @keyup.enter.prevent="search(inputValue.trim())" enterkeyhint="search"
      @compositionend="compositionend" @compositionstart="compositionstart" type="text"
      :placeholder="props.placeholder" />
    <span v-if="inputValue" class="iconfont icon-clear" @click.stop="inputValue = ''"></span>
  </div>
</template>

<style scoped>
.Search {
  display: flex;
  align-items: center;
  position: relative;
  height: 35px;
  font-size: calc(v-bind(searchHeight) / 3);
  border-radius: calc(v-bind(searchHeight) / 2);
  --search-color: #19191a;
  --clear-color: #767676;
  --placeholder-color: #544957;
}

.iconfont {
  position: absolute;
  font-size: calc(v-bind(searchHeight) / 3);
}

.icon-search {
  left: calc(v-bind(searchHeight) / 3);
  color: var(--search-color);
}

.icon-clear {
  right: calc(v-bind(searchHeight) / 3);
  color: var(--clear-color);
  cursor: pointer;
}

.input {
  width: 100%;
  height: 100%;
  background-color: transparent;
  border-radius: calc(v-bind(searchHeight) / 2);
  padding: 0 v-bind(searchHeight);
  font-size: inherit;
  font-weight: inherit;
  caret-color: #3c86f6;
  transition: outline .2s ease;
}

.input::placeholder {
  font-size: inherit;
  font-weight: 400;
  color: var(--placeholder-color);
}

.input:focus {
  outline: 3px solid #94bbf0;
}
</style>