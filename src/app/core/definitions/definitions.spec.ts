import { describe, expect, it } from 'vitest';
import { DEFAULT_DEFINITIONS, DEFINITION_CATEGORIES } from './definitions.model';

describe('Definitions System', () => {
  it('defines 10 core business categories', () => {
    expect(DEFINITION_CATEGORIES.length).toBe(10);
    const keys = DEFINITION_CATEGORIES.map((c) => c.key);
    expect(keys).toContain('payment-methods');
    expect(keys).toContain('expense-categories');
    expect(keys).toContain('customer-segments');
    expect(keys).toContain('body-zones');
    expect(keys).toContain('room-types');
    expect(keys).toContain('staff-roles');
    expect(keys).toContain('product-units');
    expect(keys).toContain('time-off-types');
    expect(keys).toContain('consent-types');
    expect(keys).toContain('invoice-types');
  });

  it('provides default items for every category', () => {
    for (const cat of DEFINITION_CATEGORIES) {
      const items = DEFAULT_DEFINITIONS[cat.key];
      expect(items).toBeDefined();
      expect(items.length).toBeGreaterThan(0);
      expect(items[0].name).toBeTruthy();
      expect(items[0].code).toBeTruthy();
      expect(items[0].active).toBe(true);
    }
  });
});
