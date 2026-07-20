<script setup lang="ts">
interface Props {
  type?: 'common' | 'glass'
}
const props = withDefaults(defineProps<Props>(), {
  type: 'common'
})

const typeClass = {
  common: 'lovelymai-common-container',
  glass: 'lovelymai-glass-container'
}
</script>

<template>
  <div :class="typeClass[props.type]">
    <slot></slot>
  </div>
</template>