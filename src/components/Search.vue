<script setup lang="ts">
import { onMounted, ref } from 'vue'

interface Props {
  /** 输入框提示词 */
  placeholder?: string
  /** 回车搜索事件 */
  onSearch?: (inputValue: string) => void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '搜索...'
});

const searchRef = ref<HTMLElement | null>(null)
const searchHeight = ref<number>(0)
onMounted(() => setTimeout(() => searchHeight.value = searchRef.value!.offsetHeight, 0))

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
  <div class="Search" ref="searchRef">
    <span class="iconfont icon-search"></span>
    <input v-model="inputValue" class='input' @keyup.enter.prevent="search(inputValue.trim())"
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
  font-size: 14px;
  background-color: #eee;
  border-radius: calc(v-bind(searchHeight) / 2 * 1px);
  --search-color: #767676;
  --clear-color: #767676;
  --placeholder-color: #767676;
}

.iconfont {
  position: absolute;
  font-size: 14px;
}

.icon-search {
  left: calc((v-bind(searchHeight) / 2 - 7) * 1px);
  color: var(--search-color);
}

.icon-clear {
  right: calc((v-bind(searchHeight) / 2 - 7) * 1px);
  color: var(--clear-color);
  cursor: pointer;
}

.input {
  width: 100%;
  height: 100%;
  background-color: transparent;
  border-radius: calc(v-bind(searchHeight) / 2 * 1px);
  padding: 0 calc(v-bind(searchHeight) * 1px);
  font-size: inherit;
  font-weight: inherit;
  caret-color: #3c86f6;
  transition: outline .2s ease;
}

.input::placeholder {
  font-weight: 400;
  color: var(--placeholder-color);
}

.input:focus {
  outline: 3px solid #94bbf0;
}
</style>