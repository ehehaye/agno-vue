import { defineConfig } from 'vite';
import { createVuePlugin } from 'vite-plugin-vue2';
import { fileURLToPath, URL } from 'node:url';
import { codeInspectorPlugin } from 'code-inspector-plugin';

export default defineConfig({
  plugins: [
    createVuePlugin(),
    codeInspectorPlugin({
      bundler: 'vite',
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/agno': {
        target: 'http://localhost:7777',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/agno/, ''),
      },
    },
  },
  css: {
    preprocessorOptions: {
      less: {
        additionalData: `@import '@/assets/styles/variables.less';\n@import '@/assets/styles/mixins.less';`,
      },
    },
  },
});
