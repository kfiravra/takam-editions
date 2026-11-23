// The client: its root is client/, and it is built into client/dist, which the server serves after a build.
// dotenv is loaded here too, so the proxy reads the same PORT as the server.
import 'dotenv/config';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// `||` and not `??`, as in server/config.ts: a PORT left empty in .env counts as not set.
const apiPort = Number(process.env.PORT || 3000);

export default defineConfig({
  root: 'client',
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    // When 5173 is taken, fail: a silent move to 5174 would leave an old server answering on 5173.
    strictPort: true,
    proxy: {
      '/api': `http://localhost:${apiPort}`,
    },
  },
});
