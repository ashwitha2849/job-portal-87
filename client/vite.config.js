import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
  },
  // Serve Angular micro-app from public/angular-resume-upload/
  // (copy `angular-resume-analyser/dist/` there after building Angular)
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
      '/graphql': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000',
    }
  }
})
