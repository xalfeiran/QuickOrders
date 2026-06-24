import { describe, it, expect } from 'vitest';
import { lineKey, buildCartLine, describeOptions } from './line.js';

const burger = { id: 'burger-classic', name: 'Classic Burger', priceCents: 8900 };

const opt = (groupId, optionId, optionName, priceDeltaCents) => ({
  groupId,
  groupName: groupId,
  optionId,
  optionName,
  priceDeltaCents,
});

describe('lineKey', () => {
  it('is independent of the order options were picked in', () => {
    const a = lineKey(burger.id, [
      opt('temperature', 'medium', 'Medium', 0),
      opt('add-ons', 'bacon', 'Bacon', 1500),
    ]);
    const b = lineKey(burger.id, [
      opt('add-ons', 'bacon', 'Bacon', 1500),
      opt('temperature', 'medium', 'Medium', 0),
    ]);
    expect(a).toBe(b);
  });

  it('differs when the options differ', () => {
    const a = lineKey(burger.id, [opt('temperature', 'medium', 'Medium', 0)]);
    const b = lineKey(burger.id, [opt('temperature', 'well', 'Well', 0)]);
    expect(a).not.toBe(b);
  });
});

describe('buildCartLine', () => {
  it('prices base + option deltas', () => {
    const line = buildCartLine(
      burger,
      [opt('add-ons', 'bacon', 'Bacon', 1500)],
      2,
    );
    expect(line.unitPriceCents).toBe(10400);
    expect(line.quantity).toBe(2);
    expect(line.menuItemId).toBe('burger-classic');
  });

  it('produces a stable key for identical variants', () => {
    const a = buildCartLine(burger, [opt('t', 'm', 'M', 0)], 1);
    const b = buildCartLine(burger, [opt('t', 'm', 'M', 0)], 3);
    expect(a.key).toBe(b.key);
  });
});

describe('describeOptions', () => {
  it('joins option names with a separator', () => {
    expect(
      describeOptions([
        opt('g', 'a', 'Large', 0),
        opt('g', 'b', 'Aioli', 500),
      ]),
    ).toBe('Large · Aioli');
  });
});
