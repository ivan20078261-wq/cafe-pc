const pedidosMock = [
  {
    id: 'PED-001',
    mesa: 4,
    productos: [
      { nombre: 'Flat White', modificadores: ['Leche de avena', 'Shot extra de espresso'], cantidad: 2 },
      { nombre: 'Tostada de palta', modificadores: ['Pan sin gluten'], cantidad: 1 },
    ],
    notas: 'Bien caliente, que no queme pero casi',
    estado: 'pendiente',
    creadoEn: Date.now() - 1000 * 60 * 3,
  },
  {
    id: 'PED-002',
    mesa: 7,
    productos: [
      { nombre: 'Latte Frío', modificadores: ['Leche de almendras', 'Jarabe de caramelo'], cantidad: 1 },
      { nombre: 'Cold Brew', modificadores: ['Hielo extra'], cantidad: 2 },
    ],
    notas: 'Sin hielo el Latte, el Cold Brew con hielo extra',
    estado: 'pendiente',
    creadoEn: Date.now() - 1000 * 60 * 7,
  },
  {
    id: 'PED-003',
    mesa: 2,
    productos: [
      { nombre: 'Cappuccino Clásico', modificadores: ['Leche deslactosada', 'Canela extra espolvoreada'], cantidad: 1 },
    ],
    notas: '',
    estado: 'preparando',
    creadoEn: Date.now() - 1000 * 60 * 12,
  },
  {
    id: 'PED-004',
    mesa: 5,
    productos: [
      { nombre: 'Miel Latte', modificadores: ['Leche de soya', 'Shot de vainilla'], cantidad: 1 },
      { nombre: 'Croissant de almendras', modificadores: ['Calentar'], cantidad: 1 },
    ],
    notas: 'Templado, que no esté quemandito',
    estado: 'pendiente',
    creadoEn: Date.now() - 1000 * 60 * 2,
  },
  {
    id: 'PED-005',
    mesa: 1,
    productos: [
      { nombre: 'Mocatha Fría', modificadores: ['Crema batida extra', 'Chips de chocolate'], cantidad: 2 },
      { nombre: 'Brownie', modificadores: ['Con helado de vainilla'], cantidad: 1 },
    ],
    notas: 'Una Mocatha sin crema, la otra con todo',
    estado: 'pendiente',
    creadoEn: Date.now() - 1000 * 60 * 5,
  },
  {
    id: 'PED-006',
    mesa: 3,
    productos: [
      { nombre: 'Affogato', modificadores: ['Shot extra', 'Chocolate rallado'], cantidad: 1 },
      { nombre: 'Espresso Doble', modificadores: [], cantidad: 2 },
    ],
    notas: 'Servir el Affogato apenas esté listo, el espresso en taza grande',
    estado: 'pendiente',
    creadoEn: Date.now() - 1000 * 60 * 9,
  },
  {
    id: 'PED-007',
    mesa: 8,
    productos: [
      { nombre: 'Latte Golden Milk', modificadores: ['Leche de coco', 'Shot de jengibre'], cantidad: 1 },
    ],
    notas: 'Bien especiado, con poca miel',
    estado: 'preparando',
    creadoEn: Date.now() - 1000 * 60 * 15,
  },
  {
    id: 'PED-008',
    mesa: 6,
    productos: [
      { nombre: 'Café de Especialidad V60', modificadores: ['Filtrado en caliente', 'Notas cítricas'], cantidad: 1 },
      { nombre: 'Matcha Latte', modificadores: ['Leche de almendras', 'Mitad de jarabe'], cantidad: 1 },
    ],
    notas: 'El V60 sin azúcar, el Matcha con miel',
    estado: 'pendiente',
    creadoEn: Date.now() - 1000 * 60 * 1,
  },
]

export default pedidosMock
