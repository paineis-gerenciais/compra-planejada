/**
 * Inicialização do Firebase — bloco E/F.
 *
 * Um único projeto Firebase para o produto (não é mais "cada usuário cria o
 * próprio", como na v2/v3). Os valores abaixo não são secretos: todo app
 * Firebase os expõe no próprio bundle — a segurança real está nas Regras de
 * Segurança, não aqui.
 */

import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendPasswordResetEmail, signOut, onAuthStateChanged, type Auth, type User
} from 'firebase/auth';
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  type Firestore
} from 'firebase/firestore';

// Projeto: Compra Planejada (compra-planejada). Valores não são secretos —
// todo app Firebase os expõe no próprio bundle; a segurança real está nas
// Regras de Segurança do Firestore, não aqui.
const firebaseConfig = {
  apiKey: 'AIzaSyAUpRV2qN-3f7twXyBUbB8DBCO9pY4fJww',
  authDomain: 'compra-planejada.firebaseapp.com',
  projectId: 'compra-planejada',
  storageBucket: 'compra-planejada.firebasestorage.app',
  messagingSenderId: '215485454303',
  appId: '1:215485454303:web:68005d16976e4eb511566a'
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
export let firebaseReady = false;

export function initFirebase(): { auth: Auth; db: Firestore } | null {
  if (firebaseReady && auth && db) return { auth, db };
  if (firebaseConfig.apiKey === 'COLE_AQUI') {
    console.warn('Firebase não configurado: firebaseConfig ainda tem placeholders.');
    return null;
  }
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    // Persistência offline: escritas feitas sem rede ficam na fila e sobem
    // sozinhas ao reconectar. multiTabManager permite abas simultâneas.
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
    firebaseReady = true;
    return { auth, db };
  } catch (e) {
    console.warn('Falha ao inicializar o Firebase', e);
    return null;
  }
}

export function authErrorMessage(e: any): string {
  const mapa: Record<string, string> = {
    'auth/invalid-email': 'E-mail inválido.',
    'auth/user-not-found': 'Não encontramos uma conta com esse e-mail.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/email-already-in-use': 'Já existe uma conta com esse e-mail.',
    'auth/weak-password': 'A senha precisa de pelo menos 6 caracteres.',
    'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos.',
    'auth/network-request-failed': 'Sem conexão. Você pode usar sem conta por enquanto.',
    'auth/unauthorized-domain': 'Este endereço ainda não está autorizado no Firebase.'
  };
  return mapa[e?.code] ?? `Não foi possível concluir: ${e?.message ?? 'erro desconhecido'}`;
}

export async function entrarComGoogle(a: Auth): Promise<void> {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(a, provider);
  } catch (e: any) {
    if (e?.code === 'auth/popup-blocked' || e?.code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(a, provider);
      return;
    }
    throw e;
  }
}

export async function criarConta(a: Auth, email: string, senha: string): Promise<void> {
  await createUserWithEmailAndPassword(a, email, senha);
}
export async function entrarComEmail(a: Auth, email: string, senha: string): Promise<void> {
  await signInWithEmailAndPassword(a, email, senha);
}
export async function redefinirSenha(a: Auth, email: string): Promise<void> {
  await sendPasswordResetEmail(a, email);
}
export async function sair(a: Auth): Promise<void> {
  await signOut(a);
}
export function observarSessao(a: Auth, cb: (u: User | null) => void) {
  return onAuthStateChanged(a, cb);
}
