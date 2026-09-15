import { describe, it, expect } from 'vitest';
import { computeWordFrequencies } from './word-frequency';

describe('computeWordFrequencies', () => {
  it('excluye stopwords en espanol e ingles y cuenta palabras frecuentes', () => {
    const result = computeWordFrequencies(
      'La niebla cubria el valle. La niebla era densa y fria. The valley was cold and the fog was cold.',
      10,
    );
    const words = new Map(result.map((r) => [r.word, r.count]));
    expect(words.get('niebla')).toBe(2);
    expect(words.get('valle')).toBe(1);
    expect(words.get('cubria')).toBe(1);
    expect(words.has('la')).toBe(false);
    expect(words.has('el')).toBe(false);
    expect(words.has('the')).toBe(false);
    expect(words.has('and')).toBe(false);
  });

  it('respeta acentos y minusculas', () => {
    const result = computeWordFrequencies('Árbol árbol ÁRBOL río río', 10);
    const words = new Map(result.map((r) => [r.word, r.count]));
    expect(words.get('árbol')).toBe(3);
    expect(words.get('río')).toBe(2);
  });

  it('ignora simbolos de markdown', () => {
    const result = computeWordFrequencies('# Titulo\n\n**negrita** y *cursiva* [link](url) [[capitulo]]', 10);
    const words = new Map(result.map((r) => [r.word, r.count]));
    expect(words.has('negrita')).toBe(true);
    expect(words.has('cursiva')).toBe(true);
    expect(words.has('titulo')).toBe(false);
    expect(words.has('y')).toBe(false);
  });

  it('limita el resultado al numero pedido', () => {
    const result = computeWordFrequencies('perro perro perro gato gato rata', 3);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ word: 'perro', count: 3 });
  });

  it('devuelve array vacio para contenido sin palabras', () => {
    expect(computeWordFrequencies('', 10)).toEqual([]);
    expect(computeWordFrequencies('la el the and a y o', 10)).toEqual([]);
  });

  it('descarta palabras de una sola letra', () => {
    const result = computeWordFrequencies('a b c perro a b', 10);
    expect(result.map((r) => r.word)).toEqual(['perro']);
  });
});