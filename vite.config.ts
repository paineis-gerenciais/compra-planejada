import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  // Firebase Hosting serve o app na raiz do domínio (compra-planejada.web.app
  // ou domínio próprio), diferente do GitHub Pages, que às vezes fica numa
  // subpasta (usuario.github.io/repo/). Caminho absoluto é o correto aqui.
  base: '/',
  build: { target: 'es2020', outDir: 'dist', sourcemap: true }
});
