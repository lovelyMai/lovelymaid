<script setup lang="ts">
import { ref } from 'vue';
import { SideBar, Search, FoldList, ContentBar, ActionButton } from '.'

const sideBarCloseContentBar = ref<boolean>(false)

// 侧边栏
const visible = ref(true)
const onSideBarSwitch = (value: boolean) => {
  if (value) {
    contentIsOpen.value = sideBarCloseContentBar.value ? true : false
  } else {
    sideBarCloseContentBar.value = contentIsOpen.value ? true : false
    contentIsOpen.value = false
  }
}

// 搜索框
const onSearch = (value: string) => {
  foldList.value = foldList.value.filter(item => item.name !== value);
  foldList.value.unshift({ id: Date.now(), name: value })
}

// 折叠列表
const foldList = ref<{ id: number, name: string }[]>([])
const foldListActiveIndex = ref<number>(-1)
const onFoldListHeaderClick = () => {
  contentIsOpen.value = true
  foldListActiveIndex.value = -1
}
const onFoldListItemClick = (item: { id: number, name: string }, index: number) => {
  foldListActiveIndex.value = index
  contentIsOpen.value = true
}

// 内容栏
const contentIsOpen = ref(false)
const onContentBarCloseClick = () => {
  contentIsOpen.value = false
  foldListActiveIndex.value = -1
}
</script>

<template>
  <SideBar :visible="visible" class="SideBar" :onSwitch="onSideBarSwitch">
    <Search placeholder="搜索任何内容" class="Search" :onSearch="onSearch" />
    <FoldList class="FoldList" :list="foldList" :activeIndex="foldListActiveIndex"
      :onItemClick="onFoldListItemClick" :onHeaderClick="onFoldListHeaderClick" />
  </SideBar>
  <ContentBar :visible="visible" class="ContentBar" :isOpen="contentIsOpen" :onCloseClick="onContentBarCloseClick">
    <ActionButton class="ActionButton">
      <template #item-0>
        <span>操作一</span>
      </template>
      <template #item-1>
        <span>操作二</span>
      </template>
      <template #item-2>
        <span>操作三</span>
      </template>
    </ActionButton>
    <div class="content">内容</div>
  </ContentBar>
  <button @click="() => visible = !visible">切换</button>
</template>

<style scoped>
.SideBar {
  width: 200px;
  height: 800px;
}

.ContentBar {
  position: absolute;
  left: 300px;
  top: 100px;
  width: 200px;
  height: 800px;
}

.content {
  height: 1000px;
  background-color: pink;
}
</style>
