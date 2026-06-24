// Controlled delivery-address form. `value` is the address object, `onChange`
// receives the updated object. Required fields: street, exteriorNumber,
// neighborhood, city, postalCode.
export default function AddressForm({ value, onChange }) {
  function update(field, fieldValue) {
    onChange({ ...value, [field]: fieldValue });
  }

  return (
    <div className="form">
      <label className="field">
        <span>Calle</span>
        <input
          type="text"
          value={value.street}
          onChange={(e) => update('street', e.target.value)}
        />
      </label>

      <div className="field-row">
        <label className="field">
          <span>Núm. exterior</span>
          <input
            type="text"
            value={value.exteriorNumber}
            onChange={(e) => update('exteriorNumber', e.target.value)}
          />
        </label>
        <label className="field">
          <span>Núm. interior</span>
          <input
            type="text"
            value={value.interiorNumber}
            onChange={(e) => update('interiorNumber', e.target.value)}
          />
        </label>
      </div>

      <label className="field">
        <span>Colonia</span>
        <input
          type="text"
          value={value.neighborhood}
          onChange={(e) => update('neighborhood', e.target.value)}
        />
      </label>

      <div className="field-row">
        <label className="field">
          <span>Ciudad</span>
          <input
            type="text"
            value={value.city}
            onChange={(e) => update('city', e.target.value)}
          />
        </label>
        <label className="field">
          <span>Código postal</span>
          <input
            type="text"
            inputMode="numeric"
            value={value.postalCode}
            onChange={(e) => update('postalCode', e.target.value)}
          />
        </label>
      </div>

      <label className="field">
        <span>Referencias (opcional)</span>
        <textarea
          rows={2}
          placeholder="Puntos de referencia, color del edificio, etc."
          value={value.references}
          onChange={(e) => update('references', e.target.value)}
        />
      </label>
    </div>
  );
}
