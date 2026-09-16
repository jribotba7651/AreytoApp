import { describe, it, expect } from 'vitest';
import { formatTime, WORK_DURATION_MS, REST_DURATION_MS } from './pomodoro';

describe('formatTime', () => {
  it('formatea el inicio del ciclo de trabajo como 25:00', () => {
    expect(formatTime(WORK_DURATION_MS)).toBe('25:00');
  });

  it('formatea el inicio del descanso como 5:00', () => {
    expect(formatTime(REST_DURATION_MS)).toBe('5:00');
  });

  it('formatea valores intermedios con segundos de dos digitos', () => {
    expect(formatTime(24 * 60 * 1000 + 9 * 1000)).toBe('24:09');
  });

  it('redondea hacia arriba los milisegundos sobrantes', () => {
    expect(formatTime(60 * 1000 - 1)).toBe('1:00');
  });

  it('no devuelve valores negativos', () => {
    expect(formatTime(-5000)).toBe('0:00');
  });

  it('formatea menos de un minuto como 0:SS', () => {
    expect(formatTime(30000)).toBe('0:30');
  });
});
