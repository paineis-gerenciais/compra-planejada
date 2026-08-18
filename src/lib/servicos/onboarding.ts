/**
 * Onboarding do primeiro acesso.
 *
 * Guardado no localStorage do aparelho (não no perfil do usuário): é
 * intencional que o onboarding apareça de novo num aparelho novo, mesmo
 * para quem já tem conta — a pessoa não conhece a interface *deste
 * aparelho*, mesmo já conhecendo o produto.
 */

const CHAVE = 'compras-onboarding-visto';

export function deveMostrarOnboarding(storage: Pick<Storage, 'getItem'> = localStorage): boolean {
  try {
    return storage.getItem(CHAVE) !== '1';
  } catch {
    // localStorage indisponível (modo privado restrito, etc.) — não trava o app
    return false;
  }
}

export function marcarOnboardingVisto(storage: Pick<Storage, 'setItem'> = localStorage): void {
  try {
    storage.setItem(CHAVE, '1');
  } catch {
    /* melhor esforço; se não gravar, o onboarding só aparece de novo — sem dano */
  }
}
