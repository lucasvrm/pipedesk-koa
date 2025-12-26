import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/unit/**/*.{test,spec}.{ts,tsx}', 'src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['tests/e2e/**'],
    setupFiles: './tests/setup.ts',
    css: true,
    env: {
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'tests/**',
        'src/main.tsx',
        'src/vite-end.d.ts',
        'src/components/ui/**', // shadcn components
      ],
      thresholds: {
        statements: 45,
        branches: 35,
        functions: 45,
        lines: 45,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
