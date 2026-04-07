import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import EnvironmentPlugin from 'vite-plugin-environment'

export default defineConfig({
  base: "/",
  plugins: [
    react(),
    EnvironmentPlugin(
      {
        VITE_TAPPAY_APP_KEY: '',
        VITE_TAPPAY_APP_ID: '',
        VITE_APPLE_MERCHANT_ID: '',
        VITE_GOOGLE_MERCHANT_ID: '',
        VITE_ENABLE_GOOGLE_PAY: 'true',
        VITE_APP_ENV: 'production',
        VITE_TAPPAY_ENV: 'production',
        VITE_PAYMENT_API_URL: 'https://confgive.thehope.app/api/payment',
        VITE_GIVING_START_AT: '',
      },
      { defineOn: 'import.meta.env' }
    ),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: ".",
  },
  server: {
    host: true, // 讓 Vite 綁定 0.0.0.0，允許內網訪問
    port: 5173, // 可選，設定開發伺服器端口
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '25fwd.thehope.app'
    ]
  },
})
