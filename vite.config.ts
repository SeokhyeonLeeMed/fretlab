import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// `base: './'` makes the production build work from ANY path:
//   - GitHub Pages project site  https://<user>.github.io/fretlab/
//   - Cloudflare Pages / Netlify / Vercel root deploys
//   - opening dist/index.html straight off disk
// No custom domain and no env-specific configuration required.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { outDir: 'dist', sourcemap: false, target: 'es2020' },
  test: {
    environment: 'node',
    include: ['src/tests/**/*.test.ts', 'src/tests/**/*.test.tsx'],
  },
});
