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
  server: {
    host: '0.0.0.0'
  },
  build: {
    lib: {
      entry: 'src/index.ts',
      fileName: () => `lovelymaid.js`,
      formats: ['es']
    },
    rollupOptions: {
      external: ['vue'],
    },
  },
})