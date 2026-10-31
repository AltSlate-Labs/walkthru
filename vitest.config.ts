import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer')
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/renderer/setupTests.ts'],
    include: ['src/renderer/**/*.{test,spec}.{js,mjs,cjs,ts,mts,tsx,jsx}']
  }
})
