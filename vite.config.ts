import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [react(), tailwindcss(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['icon.svg', 'apple-touch-icon.png'],
    manifest: {
      name: '轻衡 · 每日健康记录', short_name: '轻衡', description: '私密、离线的个人热量与身体数据记录',
      theme_color: '#f3f1ec', background_color: '#f3f1ec', display: 'standalone', orientation: 'portrait-primary', lang: 'zh-CN',
      icons: [
        { src: '/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
      ]
    },
    workbox: { globPatterns: ['**/*.{js,css,html,svg}'] }
  })]
})
