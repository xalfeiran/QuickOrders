import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server runs on 5173; proxying isn't needed because the API base URL
// is configured via VITE_API_BASE_URL.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
});
