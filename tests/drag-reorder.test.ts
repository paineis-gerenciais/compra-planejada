import { describe, it, expect } from 'vitest';
import { indiceAlvo, reordenar } from '../src/lib/domain/dragReorder';

describe('indiceAlvo', () => {
  const linhas = [
    { top: 0, height: 40 },   // meio em 20
    { top: 40, height: 40 },  // meio em 60
    { top: 80, height: 40 }   // meio em 100
  ];

  it('ponteiro acima de tudo aponta para o índice 0', () => {
    expect(indiceAlvo(-10, linhas)).toBe(0);
  });
  it('ponteiro no meio da primeira linha ainda aponta para ela', () => {
    expect(indiceAlvo(10, linhas)).toBe(0);
  });
  it('ponteiro logo depois do meio da primeira linha já aponta para a segunda', () => {
    expect(indiceAlvo(25, linhas)).toBe(1);
  });
  it('ponteiro abaixo de tudo aponta para o fim da lista', () => {
    expect(indiceAlvo(500, linhas)).toBe(3);
  });
  it('lista vazia sempre aponta para 0', () => {
    expect(indiceAlvo(100, [])).toBe(0);
  });
});

describe('reordenar', () => {
  it('move um item para baixo', () => {
    expect(reordenar(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'a', 'c', 'd']);
  });
  it('move um item para cima', () => {
    expect(reordenar(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c']);
  });
  it('mover para o próprio lugar não muda nada', () => {
    expect(reordenar(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'b', 'c']);
  });
  it('mover para o fim funciona', () => {
    expect(reordenar(['a', 'b', 'c'], 0, 3)).toEqual(['b', 'c', 'a']);
  });
  it('índice de origem inválido devolve a lista original', () => {
    const original = ['a', 'b'];
    expect(reordenar(original, -1, 1)).toBe(original);
    expect(reordenar(original, 5, 1)).toBe(original);
  });
  it('lista de um item só não muda', () => {
    expect(reordenar(['a'], 0, 0)).toEqual(['a']);
  });
});
