# Usage

## Step 1: Import CSS in your entry file

Add the following import statement **at the very beginning** of your main entry file (usually `main.js` or `main.ts`):

```javascript
import 'lovelymaid/dist/lovelymaid.css'
```

**Important:** Make sure this import comes **before any other style imports** in your project. This allows your custom styles to override the component library's default styles.

Example `main.js`:
```javascript
// main.js or main.ts
import 'lovelymaid/dist/lovelymaid.css'  // ← MUST be first!
import './your-own-styles.css'
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
```

## Step 2: Use components in any Vue component

Import and use LovelyMaid components directly in your Vue components:

```vue
<script setup>
import { SideBar } from 'lovelymaid'
</script>

<template>
  <SideBar :visible="true">
    Sidebar Content
  </SideBar>
</template>
```