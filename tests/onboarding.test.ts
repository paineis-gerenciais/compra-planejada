import { describe, it, expect, vi } from 'vitest';
import { deveMostrarOnboarding, marcarOnboardingVisto } from '../src/lib/servicos/onboarding';

function fakeStorage() {
  const dados: Record<string, string> = {};
  return {
    getItem: (k: string) => (k in dados ? dados[k]! : null),
    setItem: (k: string, v: string) => { dados[k] = v; }
  };
}

describe('onboarding', () => {
  it('aparece por padrão quando nunca foi marcado', () => {
    expect(deveMostrarOnboarding(fakeStorage())).toBe(true);
  });

  it('deixa de aparecer depois de marcado', () => {
    const s = fakeStorage();
    marcarOnboardingVisto(s);
    expect(deveMostrarOnboarding(s)).toBe(false);
  });

  it('storage indisponível não trava o app — assume já visto', () => {
    const quebrado = {
      getItem: () => { throw new Error('bloqueado'); }
    };
    expect(deveMostrarOnboarding(quebrado)).toBe(false);
  });

  it('falha ao gravar não lança exceção', () => {
    const quebrado = {
      setItem: () => { throw new Error('bloqueado'); }
    };
    expect(() => marcarOnboardingVisto(quebrado)).not.toThrow();
  });
});
