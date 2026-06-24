import { MenuItem } from '../menu/menu-item.model';
import { priceLine } from './order-pricing';

const ITEM: MenuItem = {
  id: 'burger',
  name: 'Burger',
  description: '',
  priceCents: 8900,
  category: 'Burgers',
  available: true,
  optionGroups: [
    {
      id: 'temp',
      name: 'Temperature',
      required: true,
      min: 1,
      max: 1,
      options: [
        { id: 'medium', name: 'Medium', priceDeltaCents: 0 },
        { id: 'well', name: 'Well-done', priceDeltaCents: 0 },
      ],
    },
    {
      id: 'addons',
      name: 'Add-ons',
      required: false,
      min: 0,
      max: 2,
      options: [
        { id: 'bacon', name: 'Bacon', priceDeltaCents: 1500 },
        { id: 'cheese', name: 'Extra cheese', priceDeltaCents: 1000 },
      ],
    },
  ],
};

describe('priceLine', () => {
  it('adds option deltas and multiplies by quantity', () => {
    const line = priceLine(
      ITEM,
      [
        { groupId: 'temp', optionId: 'medium' },
        { groupId: 'addons', optionId: 'bacon' },
      ],
      2,
    );
    expect(line.unitPriceCents).toBe(10400); // 8900 + 1500
    expect(line.lineTotalCents).toBe(20800); // x2
    expect(line.selectedOptions).toHaveLength(2);
  });

  it('captures option names for display', () => {
    const line = priceLine(ITEM, [{ groupId: 'temp', optionId: 'well' }], 1);
    expect(line.selectedOptions[0]).toMatchObject({
      groupName: 'Temperature',
      optionName: 'Well-done',
    });
  });

  it('rejects a missing required group', () => {
    expect(() =>
      priceLine(ITEM, [{ groupId: 'addons', optionId: 'bacon' }], 1),
    ).toThrow();
  });

  it('rejects an unknown group', () => {
    expect(() =>
      priceLine(
        ITEM,
        [
          { groupId: 'temp', optionId: 'medium' },
          { groupId: 'sauce', optionId: 'bbq' },
        ],
        1,
      ),
    ).toThrow();
  });

  it('rejects an unknown option', () => {
    expect(() =>
      priceLine(ITEM, [{ groupId: 'temp', optionId: 'rare' }], 1),
    ).toThrow();
  });

  it('rejects exceeding a single-choice group', () => {
    expect(() =>
      priceLine(
        ITEM,
        [
          { groupId: 'temp', optionId: 'medium' },
          { groupId: 'temp', optionId: 'well' },
        ],
        1,
      ),
    ).toThrow();
  });

  it('rejects duplicate option picks', () => {
    expect(() =>
      priceLine(
        ITEM,
        [
          { groupId: 'temp', optionId: 'medium' },
          { groupId: 'addons', optionId: 'bacon' },
          { groupId: 'addons', optionId: 'bacon' },
        ],
        1,
      ),
    ).toThrow();
  });
});
