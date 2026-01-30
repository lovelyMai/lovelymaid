<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  /** 输入框提示词 */
  placeholder?: string
  /** 回车搜索事件 */
  onSearch?: (inputValue: string) => void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '搜索...'
});

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
  <div class="Search">
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
  border-radius: 18px;
  font-size: 14px;
}

.iconfont {
  position: absolute;
  font-size: 14px;
  line-height: 35px;
  color: #767676;
}

.icon-search {
  left: 14px;
}

.icon-clear {
  text-align: center;
  right: 0;
  width: 35px;
  height: 35px;
  cursor: pointer;
}

.input {
  background-color: rgba(232, 232, 232, 1);
  width: 100%;
  height: 100%;
  border-radius: 20px;
  padding: 0 35px;
  font-size: inherit;
  font-weight: inherit;
  color: inherit;
  caret-color: #3c86f6;
  transition: outline .2s ease;
}

.input::placeholder {
  font-weight: 500;
  color: #767676;
}

.input:focus {
  outline: 3px solid #94bbf0;
}
</style>