<script setup lang="ts">
interface Props {
  type?: 'common' | 'glass'
}
const props = withDefaults(defineProps<Props>(), {
  type: 'common'
})
</script>

<template>
  <div :class="props.type === 'common' ? 'lovelymaid-common-container' : 'lovelymaid-glass-container'">
    <slot></slot>
  </div>
</template>

<style module></style>