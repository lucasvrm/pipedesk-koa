import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, PluginOption } from "vite";

import createIconImportProxy from "@github/spark/vitePhosphorIconProxyPlugin";
import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // DO NOT REMOVE
    createIconImportProxy() as PluginOption,
    sparkPlugin() as PluginOption,
  ],
  server: {
    host: '0.0.0.0',
    port: 12000,
    cors: true,
    strictPort: false,
  },
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src')
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
          ],
          'vendor-charts': ['d3', 'recharts'],

          // Feature chunks
          // Note: These paths are relative to the project root and may need
          // updating if files are moved. Consider using dynamic imports or
          // pattern-based chunking if file structure changes frequently.
          'feature-analytics': [
            './src/features/analytics/components/AnalyticsDashboard.tsx',
            './src/features/analytics/components/Dashboard.tsx',
            './src/features/analytics/components/ConversionTrendChart.tsx',
          ],
          'feature-deals': [
            './src/features/deals/components/DealsView.tsx',
            './src/features/deals/components/MasterMatrixView.tsx',
          ],
          'feature-tasks': [
            './src/features/tasks/components/TaskManagementView.tsx',
          ],
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
});
