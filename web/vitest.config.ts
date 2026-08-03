import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve('./src')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        'src/app/(provider|layout|loading|not-found|error|route-*/page|template).tsx',
        'src/app/(provider|layout|loading|not-found|error|route-*/page|template).ts',
        'src/app/*/layout.tsx',
        'src/app/*/loading.tsx',
        'src/app/*/not-found.tsx',
        'src/app/*/error.tsx',
        'src/app/*/page.tsx'
      ]
    },
    include: ['src/**/__tests__/**/*.{test,spec}.{ts,tsx}'],
    mockReset: true,
    restoreMocks: true
  }
});