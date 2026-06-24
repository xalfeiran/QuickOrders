import { useMemo, useState } from 'react';
import { useCart } from '../cart/CartContext.jsx';
import { formatPrice } from '../utils/money.js';

// Bottom-sheet for choosing quantity and options before adding an item to the
// cart. Single-choice groups (max 1) render as radios; multi-choice groups
// render as checkboxes capped at their max.
export default function ItemCustomizer({ item, onClose }) {
  const { addLine } = useCart();
  const [quantity, setQuantity] = useState(1);

  // selections: { [groupId]: optionId[] }. Pre-select the first option of
  // required single-choice groups so the common case needs no extra taps.
  const [selections, setSelections] = useState(() => {
    const initial = {};
    for (const group of item.optionGroups) {
      const single = group.max === 1;
      initial[group.id] =
        group.required && single ? [group.options[0].id] : [];
    }
    return initial;
  });

  function toggleOption(group, optionId) {
    setSelections((current) => {
      const chosen = current[group.id] ?? [];
      if (group.max === 1) {
        // Radio behaviour: always exactly the tapped option.
        return { ...current, [group.id]: [optionId] };
      }
      // Checkbox behaviour: toggle, but never exceed the group's max.
      if (chosen.includes(optionId)) {
        return { ...current, [group.id]: chosen.filter((id) => id !== optionId) };
      }
      if (chosen.length >= group.max) return current;
      return { ...current, [group.id]: [...chosen, optionId] };
    });
  }

  // Flattened list of chosen options with the detail the cart needs.
  const selectedOptions = useMemo(() => {
    const result = [];
    for (const group of item.optionGroups) {
      for (const optionId of selections[group.id] ?? []) {
        const option = group.options.find((o) => o.id === optionId);
        if (option) {
          result.push({
            groupId: group.id,
            groupName: group.name,
            optionId: option.id,
            optionName: option.name,
            priceDeltaCents: option.priceDeltaCents,
          });
        }
      }
    }
    return result;
  }, [item, selections]);

  // Every group must have at least its minimum number of choices.
  const isValid = item.optionGroups.every((group) => {
    const count = (selections[group.id] ?? []).length;
    return count >= group.min && count <= group.max;
  });

  const unitPriceCents =
    item.priceCents +
    selectedOptions.reduce((sum, o) => sum + o.priceDeltaCents, 0);
  const totalCents = unitPriceCents * quantity;

  function handleAdd() {
    if (!isValid) return;
    addLine(item, selectedOptions, quantity);
    onClose();
  }

  function groupHint(group) {
    if (group.max === 1) return group.required ? 'Obligatorio' : 'Opcional';
    if (group.required) return `Elige ${group.min}–${group.max}`;
    return `Elige hasta ${group.max}`;
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-label={`Personalizar ${item.name}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet__head">
          <div>
            <h3 className="sheet__title">{item.name}</h3>
            <p className="sheet__desc">{item.description}</p>
          </div>
          <button
            className="sheet__close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="sheet__body">
          {item.optionGroups.map((group) => (
            <fieldset key={group.id} className="option-group">
              <legend className="option-group__legend">
                <span>{group.name}</span>
                <span className="option-group__hint">{groupHint(group)}</span>
              </legend>

              {group.options.map((option) => {
                const chosen = (selections[group.id] ?? []).includes(option.id);
                const atMax =
                  group.max > 1 &&
                  !chosen &&
                  (selections[group.id] ?? []).length >= group.max;
                return (
                  <label
                    key={option.id}
                    className={`option-row${atMax ? ' option-row--disabled' : ''}`}
                  >
                    <input
                      type={group.max === 1 ? 'radio' : 'checkbox'}
                      name={group.id}
                      checked={chosen}
                      disabled={atMax}
                      onChange={() => toggleOption(group, option.id)}
                    />
                    <span className="option-row__name">{option.name}</span>
                    {option.priceDeltaCents > 0 && (
                      <span className="option-row__price">
                        +{formatPrice(option.priceDeltaCents)}
                      </span>
                    )}
                  </label>
                );
              })}
            </fieldset>
          ))}
        </div>

        <div className="sheet__foot">
          <div className="stepper">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Quitar uno"
            >
              −
            </button>
            <span>{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              aria-label="Agregar uno"
            >
              +
            </button>
          </div>
          <button
            className="button"
            onClick={handleAdd}
            disabled={!isValid}
          >
            Agregar · {formatPrice(totalCents)}
          </button>
        </div>
      </div>
    </div>
  );
}
