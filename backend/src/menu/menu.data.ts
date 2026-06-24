import { MenuItem, MenuOption, MenuOptionGroup } from './menu-item.model';

// Catálogo de Alita Mía. Datos planos, separados del servicio que los entrega,
// para que sean fáciles de leer y de migrar a una base de datos más adelante.
//
// Los precios y los ajustes de precio van en centavos (MXN). Los grupos de
// opciones describen lo que el cliente puede personalizar por platillo:
//   - elección única obligatoria → min 1, max 1   (botones de radio)
//   - selección múltiple opcional → min 0, max N   (casillas)

// Las 10 salsas de la casa. El nivel de picor se muestra con 🌶️ en el nombre.
const SAUCES: MenuOption[] = [
  { id: 'buffalo-hot', name: 'Búfalo Hot 🌶️🌶️🌶️🌶️🌶️', priceDeltaCents: 0 },
  { id: 'mango-habanero', name: 'Mango Habanero 🌶️🌶️🌶️🌶️', priceDeltaCents: 0 },
  { id: 'buffalo-clasica', name: 'Búfalo Clásica 🌶️🌶️🌶️', priceDeltaCents: 0 },
  { id: 'buffalo-cajun', name: 'Búfalo Cajún 🌶️🌶️', priceDeltaCents: 0 },
  { id: 'tamarindo-morita', name: 'Tamarindo Morita 🌶️🌶️', priceDeltaCents: 0 },
  { id: 'parmesano-hot', name: 'Parmesano Hot 🌶️🌶️', priceDeltaCents: 0 },
  { id: 'bbq-picante', name: 'BBQ Picante 🌶️🌶️', priceDeltaCents: 0 },
  { id: 'lemon-pepper', name: 'Lemon Pepper', priceDeltaCents: 0 },
  { id: 'bbq', name: 'BBQ', priceDeltaCents: 0 },
  { id: 'parmesano', name: 'Parmesano', priceDeltaCents: 0 },
];

// Grupo "elige exactamente N salsas".
function sauceGroup(
  count: number,
  id = 'salsas',
  name = count === 1 ? 'Salsa (elige 1)' : `Salsas (elige ${count})`,
): MenuOptionGroup {
  return { id, name, required: true, min: count, max: count, options: SAUCES };
}

// Extra de queso opcional (varias entradas lo permiten).
const QUESO_EXTRA: MenuOptionGroup = {
  id: 'extras',
  name: 'Extras',
  required: false,
  min: 0,
  max: 1,
  options: [{ id: 'queso', name: 'Queso extra', priceDeltaCents: 1200 }],
};

export const MENU: MenuItem[] = [
  // ----- Entradas -----
  {
    id: 'papas-francesa',
    name: 'Papas a la Francesa',
    description: 'Crujientes papas a la francesa.',
    priceCents: 4500,
    category: 'Entradas',
    available: true,
    optionGroups: [QUESO_EXTRA],
  },
  {
    id: 'papas-gajo',
    name: 'Papas Gajo',
    description: 'Papas gajo sazonadas.',
    priceCents: 5500,
    category: 'Entradas',
    available: true,
    optionGroups: [QUESO_EXTRA],
  },
  {
    id: 'aros-cebolla',
    name: 'Aros de Cebolla',
    description: 'Aros de cebolla capeados.',
    priceCents: 5500,
    category: 'Entradas',
    available: true,
    optionGroups: [QUESO_EXTRA],
  },
  {
    id: 'dedos-queso',
    name: 'Dedos de Queso (orden de 5)',
    description: 'Cinco dedos de queso empanizados.',
    priceCents: 7000,
    category: 'Entradas',
    available: true,
    optionGroups: [QUESO_EXTRA],
  },

  // ----- Alitas (fritas y bañadas en la salsa de tu elección) -----
  {
    id: 'alitas-5',
    name: '5 Alitas',
    description: 'Fritas a la perfección. Incluye guarnición. Elige 1 salsa.',
    priceCents: 7500,
    category: 'Alitas',
    available: true,
    optionGroups: [sauceGroup(1)],
  },
  {
    id: 'alitas-10',
    name: '10 Alitas',
    description: 'Fritas a la perfección. Incluye guarnición. Elige 2 salsas.',
    priceCents: 15000,
    category: 'Alitas',
    available: true,
    optionGroups: [sauceGroup(2)],
  },
  {
    id: 'alitas-15',
    name: '15 Alitas',
    description: 'Fritas a la perfección. Incluye guarnición. Elige 3 salsas.',
    priceCents: 22500,
    category: 'Alitas',
    available: true,
    optionGroups: [sauceGroup(3)],
  },
  {
    id: 'alitas-20',
    name: '20 Alitas',
    description: 'Fritas a la perfección. Incluye guarnición. Elige 4 salsas.',
    priceCents: 30000,
    category: 'Alitas',
    available: true,
    optionGroups: [sauceGroup(4)],
  },

  // ----- Boneless (100% pechuga empanizada) -----
  {
    id: 'boneless-250',
    name: 'Boneless 250 g (aprox. 8 pzas)',
    description: '100% pechuga empanizada. Incluye guarnición. Elige 1 salsa.',
    priceCents: 9000,
    category: 'Boneless',
    available: true,
    optionGroups: [sauceGroup(1)],
  },
  {
    id: 'boneless-500',
    name: 'Boneless 500 g (aprox. 17 pzas)',
    description: '100% pechuga empanizada. Incluye guarnición. Elige 2 salsas.',
    priceCents: 18000,
    category: 'Boneless',
    available: true,
    optionGroups: [sauceGroup(2)],
  },
  {
    id: 'boneless-750',
    name: 'Boneless 750 g (aprox. 24 pzas)',
    description: '100% pechuga empanizada. Incluye guarnición. Elige 3 salsas.',
    priceCents: 27000,
    category: 'Boneless',
    available: true,
    optionGroups: [sauceGroup(3)],
  },
  {
    id: 'boneless-1kg',
    name: 'Boneless 1 kg (aprox. 34 pzas)',
    description: '100% pechuga empanizada. Incluye guarnición. Elige 4 salsas.',
    priceCents: 36000,
    category: 'Boneless',
    available: true,
    optionGroups: [sauceGroup(4)],
  },

  // ----- Hamburguesa -----
  {
    id: 'hamburguesa-suprema',
    name: 'Hamburguesa Suprema',
    description:
      'Filete de pechuga de pollo crujiente, jitomate, pepinillos artesanales, lechuga, queso y aderezo especial.',
    priceCents: 13000,
    category: 'Hamburguesas',
    available: true,
    optionGroups: [
      {
        id: 'version',
        name: 'Versión',
        required: true,
        min: 1,
        max: 1,
        options: [
          { id: 'sola', name: 'Sola', priceDeltaCents: 0 },
          {
            id: 'paquete',
            name: 'En paquete (papas + refresco)',
            priceDeltaCents: 4000,
          },
        ],
      },
      {
        id: 'cambio-guarnicion',
        name: 'Cambia las papas (solo en paquete)',
        required: false,
        min: 0,
        max: 1,
        options: [
          { id: 'aros', name: 'Aros de cebolla', priceDeltaCents: 3000 },
          { id: 'dedos', name: 'Dedos de queso', priceDeltaCents: 3000 },
          { id: 'papas-gajo', name: 'Papas gajo', priceDeltaCents: 3000 },
        ],
      },
    ],
  },

  // ----- Los Nidos -----
  {
    id: 'los-nidos',
    name: 'Los Nidos',
    description:
      'EL CLÁSICO: cama de papas a la francesa con queso, ranch y catsup, con boneless. EL VERDE: versión fit sobre cama de lechuga, zanahoria y pepino con ranch.',
    priceCents: 12500,
    category: 'Los Nidos',
    available: true,
    optionGroups: [
      {
        id: 'tipo',
        name: 'Tipo',
        required: true,
        min: 1,
        max: 1,
        options: [
          { id: 'clasico', name: 'El Clásico', priceDeltaCents: 0 },
          { id: 'verde', name: 'El Verde', priceDeltaCents: 0 },
        ],
      },
      sauceGroup(1),
    ],
  },

  // ----- Especialidades -----
  {
    id: 'plato-mixto',
    name: 'Plato Mixto',
    description:
      'Boneless, alitas, dedos de queso, papas gajo, aros de cebolla y papas a la francesa. Elige 2 salsas.',
    priceCents: 26500,
    category: 'Especialidades',
    available: true,
    optionGroups: [sauceGroup(2)],
  },

  // ----- Paquetes -----
  {
    id: 'pk1',
    name: 'Paquete 1',
    description: '10 alitas (2 salsas) y 200 g de boneless (1 salsa).',
    priceCents: 23500,
    category: 'Paquetes',
    available: true,
    optionGroups: [
      sauceGroup(2, 'salsas-alitas', 'Salsas para alitas (elige 2)'),
      sauceGroup(1, 'salsas-boneless', 'Salsa para boneless (elige 1)'),
      {
        id: 'acompanamiento',
        name: 'Acompañamiento',
        required: true,
        min: 1,
        max: 1,
        options: [
          { id: 'flan', name: 'Rebanada de flan', priceDeltaCents: 0 },
          { id: 'papas', name: 'Porción de papas', priceDeltaCents: 0 },
        ],
      },
    ],
  },
  {
    id: 'pk2',
    name: 'Paquete 2',
    description: '10 alitas (2 salsas) y 500 g de boneless (2 salsas).',
    priceCents: 37000,
    category: 'Paquetes',
    available: true,
    optionGroups: [
      sauceGroup(2, 'salsas-alitas', 'Salsas para alitas (elige 2)'),
      sauceGroup(2, 'salsas-boneless', 'Salsas para boneless (elige 2)'),
      {
        id: 'acompanamiento',
        name: 'Acompañamiento',
        required: true,
        min: 1,
        max: 1,
        options: [
          { id: 'flan', name: '2 rebanadas de flan', priceDeltaCents: 0 },
          { id: 'papas', name: '2 porciones de papas', priceDeltaCents: 0 },
        ],
      },
    ],
  },
  {
    id: 'pk3',
    name: 'Paquete 3',
    description: '15 alitas (3 salsas) y 750 g de boneless (3 salsas).',
    priceCents: 56000,
    category: 'Paquetes',
    available: true,
    optionGroups: [
      sauceGroup(3, 'salsas-alitas', 'Salsas para alitas (elige 3)'),
      sauceGroup(3, 'salsas-boneless', 'Salsas para boneless (elige 3)'),
      {
        id: 'acompanamiento',
        name: 'Acompañamiento',
        required: true,
        min: 1,
        max: 1,
        options: [
          { id: 'flan', name: '3 rebanadas de flan', priceDeltaCents: 0 },
          { id: 'papas', name: '3 porciones de papas', priceDeltaCents: 0 },
        ],
      },
    ],
  },
  {
    id: 'pk4',
    name: 'Paquete 4',
    description: '20 alitas (4 salsas) y 1 kg de boneless (4 salsas).',
    priceCents: 72000,
    category: 'Paquetes',
    available: true,
    optionGroups: [
      sauceGroup(4, 'salsas-alitas', 'Salsas para alitas (elige 4)'),
      sauceGroup(4, 'salsas-boneless', 'Salsas para boneless (elige 4)'),
      {
        id: 'acompanamiento',
        name: 'Acompañamiento',
        required: true,
        min: 1,
        max: 1,
        options: [
          { id: 'flan', name: '4 rebanadas de flan', priceDeltaCents: 0 },
          { id: 'papas', name: '4 porciones de papas', priceDeltaCents: 0 },
        ],
      },
    ],
  },

  // ----- Postre -----
  {
    id: 'flan',
    name: 'Flan Napolitano de Cajeta',
    description: 'Cremoso flan napolitano con cajeta.',
    priceCents: 4000,
    category: 'Postres',
    available: true,
    optionGroups: [],
  },
];
