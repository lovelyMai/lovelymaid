// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  plugins: [
    vue(),
    viteStaticCopy({
      targets: [
        {
          src: 'src/assets/icons/iconfont.ttf',
          dest: 'assets/icons'
        }
      ]
    })
  ],
  resolve: {
    alias: {
      '@': '/src'
    },
  },
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'LovelyMaid',
      fileName: (format) => `lovelymaid.${format}.js`,
      formats: ['es', 'umd']
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue'
        },
      }
    },
  },
})