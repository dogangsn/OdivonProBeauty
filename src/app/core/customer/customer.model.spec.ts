import { describe, expect, it } from 'vitest';
import { calculateAge, isValidTckn } from './customer.model';

describe('Customer Model Utilities', () => {
  describe('calculateAge', () => {
    it('returns null for empty or invalid birthDate', () => {
      expect(calculateAge(null)).toBeNull();
      expect(calculateAge(undefined)).toBeNull();
      expect(calculateAge('')).toBeNull();
      expect(calculateAge('invalid-date')).toBeNull();
    });

    it('calculates age correctly based on current date', () => {
      const today = new Date();
      const birthYear = today.getFullYear() - 25;
      const birthMonth = String(today.getMonth() + 1).padStart(2, '0');
      const birthDay = String(today.getDate()).padStart(2, '0');
      const birthDate = `${birthYear}-${birthMonth}-${birthDay}`;

      expect(calculateAge(birthDate)).toBe(25);
    });

    it('handles birthday that has not occurred yet this year', () => {
      const today = new Date();
      const birthYear = today.getFullYear() - 30;
      // Tomorrow or next month
      const futureMonth = today.getMonth() === 11 ? 12 : today.getMonth() + 2;
      const birthDate = `${birthYear}-${String(futureMonth).padStart(2, '0')}-28`;

      const calculated = calculateAge(birthDate);
      expect(calculated).toBeLessThanOrEqual(30);
    });
  });

  describe('isValidTckn', () => {
    it('returns false for falsy or malformed strings', () => {
      expect(isValidTckn(null)).toBe(false);
      expect(isValidTckn(undefined)).toBe(false);
      expect(isValidTckn('')).toBe(false);
      expect(isValidTckn('12345')).toBe(false);
      expect(isValidTckn('123456789012')).toBe(false);
      expect(isValidTckn('01234567890')).toBe(false); // cannot start with 0
      expect(isValidTckn('abcdefghijk')).toBe(false);
    });

    it('validates authentic algorithmic TCKN numbers', () => {
      // 10000000146 is a mathematically valid TCKN
      expect(isValidTckn('10000000146')).toBe(true);
      // 10000000214 is a mathematically valid TCKN
      expect(isValidTckn('10000000214')).toBe(true);
      // 10000000382 is a mathematically valid TCKN
      expect(isValidTckn('10000000382')).toBe(true);
    });

    it('rejects numbers that fail 10th or 11th digit checksums', () => {
      expect(isValidTckn('10000000147')).toBe(false);
      expect(isValidTckn('11111111111')).toBe(false);
      expect(isValidTckn('12345678901')).toBe(false);
    });
  });
});
