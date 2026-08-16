import './app.css';
import { mount } from 'svelte';
import App from './App.svelte';

// Registra o service worker: sem isso o app carrega normal com internet,
// mas não funciona offline nem oferece o convite de instalação do PWA.
// import.meta.env.BASE_URL respeita o `base` do vite.config.ts, então o
// caminho fica correto tanto na raiz do domínio quanto numa subpasta
// (ex: compra-planejada.web.app).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch((e) => console.warn('Falha ao registrar o service worker', e));
  });
}

export default mount(App, { target: document.getElementById('app')! });
