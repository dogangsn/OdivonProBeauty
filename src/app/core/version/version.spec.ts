import { describe, expect, it } from 'vitest';
import { compareVersions } from './version-compare';

describe('Version comparison', () => {
  it('orders versions semantically', () => {
    expect(compareVersions('1.0.0', '1.0.1')).toBe(-1);
    expect(compareVersions('1.0.1', '1.0.0')).toBe(1);
    expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
    expect(compareVersions('1.2.0', '1.1.9')).toBe(1);
    expect(compareVersions('2.0.0', '1.9.9')).toBe(1);
  });

  it('strips build metadata and prerelease tags', () => {
    expect(compareVersions('1.0.0+abc', '1.0.0+def')).toBe(0);
    expect(compareVersions('1.0.1-rc.1', '1.0.0')).toBe(1);
  });
});
