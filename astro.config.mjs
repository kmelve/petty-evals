import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://petty-evals.dev',
  vite: {
    plugins: [tailwindcss()],
    // resvg ships a native .node binary; let Node load it instead of Vite bundling it.
    ssr: { external: ['@resvg/resvg-js'] },
    optimizeDeps: { exclude: ['@resvg/resvg-js'] },
  },
});
