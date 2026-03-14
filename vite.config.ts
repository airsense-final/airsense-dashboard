import { defineConfig, type UserConfig } from 'vite'
import react from '@vitejs/plugin-react'
// @ts-ignore
import obfuscator from 'vite-plugin-javascript-obfuscator'

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const config: UserConfig = {
    plugins: [react()],
    build: {
      sourcemap: false,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
        format: {
          comments: false,
        },
      },
      cssMinify: true,
      reportCompressedSize: false,
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
    },
  }

  // Sadece build aşamasında ve plugin varsa obfuscator ekle
  if (command === 'build' && config.plugins) {
    config.plugins.push(
      obfuscator({
        options: {
          compact: true,
          controlFlowFlattening: false,
          debugProtection: true,
          debugProtectionInterval: 2000,
          disableConsoleOutput: true,
          selfDefending: true,
          stringArray: true,
          rotateStringArray: true,
          shuffleStringArray: true,
          stringArrayThreshold: 0.75,
        },
      })
    )
  }

  return config
})
