import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'child_process'

const gitHash = (() => {
  try { return execSync('git rev-parse --short HEAD').toString().trim(); } catch { return 'unknown'; }
})();
const gitBranch = (() => {
  try { return execSync('git rev-parse --abbrev-ref HEAD').toString().trim(); } catch { return 'main'; }
})();
const buildTime = new Date().toISOString();

export default defineConfig({
  base: '/saving-app/',
  plugins: [
    react(),
    tailwindcss(),
  ],
  define: {
    __GIT_HASH__: JSON.stringify(gitHash),
    __GIT_BRANCH__: JSON.stringify(gitBranch),
    __BUILD_TIME__: JSON.stringify(buildTime),
  },
})
