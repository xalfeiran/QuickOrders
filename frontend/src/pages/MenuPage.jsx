import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useBusiness } from '../business/BusinessContext.jsx';
import MenuItemCard from '../components/MenuItemCard.jsx';
import ItemCustomizer from '../components/ItemCustomizer.jsx';

// Agrupa los platillos por categoría conservando el orden en que aparecen.
function groupByCategory(items) {
  const groups = [];
  const byName = new Map();
  for (const item of items) {
    if (!byName.has(item.category)) {
      const group = { category: item.category, items: [] };
      byName.set(item.category, group);
      groups.push(group);
    }
    byName.get(item.category).items.push(item);
  }
  return groups;
}

// Página principal: carga el menú y lo lista. Tocar un platillo abre el
// personalizador.
export default function MenuPage() {
  const { slug } = useBusiness();
  const [menu, setMenu] = useState([]);
  const [status, setStatus] = useState('loading');
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    setStatus('loading');
    api
      .getMenu(slug)
      .then((items) => {
        setMenu(items);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [slug]);

  if (status === 'loading') return <p className="notice">Cargando menú…</p>;
  if (status === 'error')
    return (
      <p className="notice">No pudimos cargar el menú. Inténtalo de nuevo.</p>
    );

  return (
    <section>
      <h2 className="page-title">Menú</h2>

      {groupByCategory(menu).map((group) => (
        <div key={group.category} className="menu-category">
          <h3 className="menu-category__title">{group.category}</h3>
          <div className="menu-list">
            {group.items.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                onSelect={setSelectedItem}
              />
            ))}
          </div>
        </div>
      ))}

      {selectedItem && (
        <ItemCustomizer
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </section>
  );
}
