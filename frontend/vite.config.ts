import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-modules': [
            './src/JobOrderManagement',
            './src/ServiceExecutionModule',
            './src/InspectionModule',
            './src/ExitPermitManagement'
          ]
        }
      }
    }
  }
})
