<script lang="ts">
  import type { Auth } from 'firebase/auth';
  import {
    entrarComGoogle, criarConta, entrarComEmail, redefinirSenha, authErrorMessage
  } from '../auth/firebase';

  interface Props {
    auth: Auth;
    onUsarSemConta: () => void;
  }
  let { auth, onUsarSemConta }: Props = $props();

  let modo = $state<'login' | 'signup'>('login');
  let email = $state('');
  let senha = $state('');
  let erro = $state('');
  let ocupado = $state(false);

  async function comGoogle() {
    ocupado = true; erro = '';
    try { await entrarComGoogle(auth); }
    catch (e: any) {
      if (e?.code !== 'auth/popup-closed-by-user' && e?.code !== 'auth/cancelled-popup-request') {
        erro = authErrorMessage(e);
      }
    } finally { ocupado = false; }
  }

  async function enviar() {
    if (!email || !senha) { erro = 'Preencha e-mail e senha.'; return; }
    ocupado = true; erro = '';
    try {
      if (modo === 'signup') await criarConta(auth, email, senha);
      else await entrarComEmail(auth, email, senha);
    } catch (e: any) { erro = authErrorMessage(e); }
    finally { ocupado = false; }
  }

  async function esqueci() {
    if (!email) { erro = 'Digite seu e-mail acima e toque em "Esqueci minha senha".'; return; }
    try { await redefinirSenha(auth, email); erro = `Enviamos um link de redefinição para ${email}.`; }
    catch (e: any) { erro = authErrorMessage(e); }
  }
</script>

<div class="tela" role="dialog" aria-modal="true" aria-label="Entrar na conta">
  <div class="cartao">
    <h2>&#9679; Compra Planejada</h2>
    <p class="sub">
      {modo === 'signup'
        ? 'Crie sua conta para que suas listas fiquem salvas e sincronizadas entre seus aparelhos.'
        : 'Entre para sincronizar suas listas entre celular e computador.'}
    </p>
    {#if erro}<p class="erro" role="alert">{erro}</p>{/if}

    <button class="botao" disabled={ocupado} onclick={comGoogle}>
      <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M22.5 12.2c0-.8-.1-1.4-.2-2.1H12v4h6c-.1 1-.8 2.6-2.3 3.6l3.5 2.7c2.1-1.9 3.3-4.8 3.3-8.2z"/>
        <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-.9.7-2.2 1.1-3.8 1.1-2.9 0-5.4-1.9-6.3-4.6l-3.6 2.8C3.9 20.4 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.7 14.1c-.2-.7-.4-1.4-.4-2.1s.1-1.4.4-2.1L2.1 7.1C1.4 8.6 1 10.2 1 12s.4 3.4 1.1 4.9l3.6-2.8z"/>
        <path fill="#EA4335" d="M12 5.4c1.7 0 2.8.7 3.4 1.3l2.5-2.5C16.5 2.8 14 1.8 12 1.8 7.7 1.8 3.9 4.4 2.1 7.1l3.6 2.8C6.6 7.2 9.1 5.4 12 5.4z"/>
      </svg>
      Continuar com Google
    </button>

    <div class="sep">ou</div>

    <div class="campo">
      <label for="e">E-mail</label>
      <input id="e" type="email" bind:value={email} autocomplete="email" placeholder="voce@email.com" />
    </div>
    <div class="campo">
      <label for="s">Senha</label>
      <input id="s" type="password" bind:value={senha}
        autocomplete={modo === 'signup' ? 'new-password' : 'current-password'} placeholder="mínimo 6 caracteres" />
    </div>
    <button class="botao principal" disabled={ocupado} onclick={enviar}>
      {modo === 'signup' ? 'Criar conta' : 'Entrar'}
    </button>
    <button class="link" onclick={() => (modo = modo === 'signup' ? 'login' : 'signup')}>
      {modo === 'signup' ? 'Já tenho conta — entrar' : 'Não tenho conta — criar agora'}
    </button>
    {#if modo === 'login'}
      <button class="link" onclick={esqueci}>Esqueci minha senha</button>
    {/if}

    <div class="sep">ou</div>
    <button class="botao" onclick={onUsarSemConta}>Usar sem conta neste aparelho</button>
    <p class="nota">Sem conta, as listas ficam só neste navegador e não são sincronizadas.</p>
  </div>
</div>

<style>
  .tela {
    position: fixed; inset: 0; z-index: var(--z-auth); background: var(--paper);
    display: flex; align-items: center; justify-content: center; padding: var(--sp-4);
    overflow-y: auto;
  }
  .cartao {
    background: var(--card); border: 1px solid var(--border); border-radius: var(--r-lg);
    padding: 26px 22px; width: 100%; max-width: 380px; box-shadow: 0 12px 30px -12px var(--shadow);
  }
  h2 { font-family: var(--font-mono); font-size: var(--fs-lg); margin: 0 0 var(--sp-1); letter-spacing: var(--tracking-stamp); }
  .sub { font-size: var(--fs-sm); color: var(--ink-light); margin: 0 0 var(--sp-4); line-height: 1.5; }
  .campo { margin-bottom: var(--sp-3); }
  .campo label { display: block; font-size: var(--fs-xs); color: var(--ink-light); margin-bottom: 4px; }
  .campo input { width: 100%; font-size: 15px; padding: 11px var(--sp-3); border: 1px solid var(--border); border-radius: var(--r-md); background: var(--paper); }
  .botao {
    width: 100%; font-family: var(--font-mono); font-weight: 700; font-size: 13.5px;
    padding: 13px; border-radius: var(--r-md); border: 1px solid var(--border);
    background: var(--card); color: var(--ink); margin-bottom: var(--sp-2);
    display: flex; align-items: center; justify-content: center; gap: var(--sp-2); min-height: var(--tap);
  }
  .botao.principal { background: var(--green); color: #fff; border-color: var(--green); }
  .botao:disabled { opacity: 0.55; }
  .sep { display: flex; align-items: center; gap: var(--sp-3); margin: var(--sp-4) 0; font-size: var(--fs-xs); color: var(--ink-light); font-family: var(--font-mono); }
  .sep::before, .sep::after { content: ''; flex: 1; border-top: 1px dashed var(--border); }
  .link { background: none; border: none; color: var(--green); font-size: 12.5px; text-decoration: underline; padding: var(--sp-2) 0; display: block; width: 100%; text-align: center; }
  .erro { color: var(--red); font-size: 12.5px; margin: 0 0 var(--sp-3); background: var(--amber-light); padding: 9px 11px; border-radius: var(--r-sm); }
  .nota { font-size: 11.5px; color: var(--ink-light); text-align: center; margin-top: var(--sp-3); line-height: 1.5; }
</style>
