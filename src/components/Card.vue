<script setup lang="ts">
interface Props {
  type?: 'common' | 'select' | 'glass'
}
const props = withDefaults(defineProps<Props>(), {
  type: 'common'
})

const typeClass = {
  common: 'lovelymaid-common-container',
  select: 'lovelymaid-select-container',
  glass: 'lovelymaid-glass-container'
}
</script>

<template>
  <div :class="typeClass[props.type]">
    <slot></slot>
  </div>
</template>

<style module></style>