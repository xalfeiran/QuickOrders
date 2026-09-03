# Notas de la versión — Open Testing (QuickOrder Owner)

App: **QuickOrder Owner** (owner-app) · Versión interna: 1.0.0

---

## Google Play — Open testing

Notas de la versión (campo "Novedades", límite 500 caracteres — este texto usa 385):

```
Novedades de esta versión:
• Se corrigió el detalle de un pedido: ahora muestra correctamente cliente, teléfono y total (antes aparecía vacío o en "NaN").
• Nuevo indicador (›) en la lista de Pedidos para saber que se puede abrir el detalle.
• El ícono de la app y la pantalla de carga ahora usan el logotipo de QuickOrder.

Gracias por probar la app. Si algo no se ve bien, repórtalo.
```

Pega este texto en Play Console → Testing → Open testing → tu release → **Release notes** (es-MX / es-419).

---

## Apple TestFlight — External Testing

Texto para el campo **"What to Test"** (límite ~4000 caracteres):

```
QuickOrder Owner — app para dueños y encargados de negocio: gestionar pedidos,
menú, inventario y enlaces de pedido desde el celular.

Novedades de esta versión
• Se corrigió el detalle de un pedido: antes mostraba Cliente y Teléfono vacíos
  y el Total como "NaN". Ahora se ve la información completa del pedido.
• Se agregó un indicador (›) en la lista de Pedidos, para que sea claro que
  cada tarjeta se puede tocar y abrir su detalle.
• El ícono de la app y la pantalla de carga al abrir la app ahora muestran el
  logotipo de QuickOrder.

Qué probar
• Pedidos → toca un pedido de la lista → confirma que Cliente, Teléfono,
  Entrega/Dirección, Pago, los artículos y el Total se vean correctos (no
  vacíos, no "NaN").
• Cambia el estado de un pedido tanto desde la lista como desde el detalle,
  y confirma que se refleje en ambos lugares.
• Cierra y vuelve a abrir la app: revisa que la pantalla de carga muestre el
  logotipo y que la sesión se mantenga iniciada si ya habías entrado.
• Menú, Inventario, Enlaces y Ajustes: uso general, en busca de datos que no
  carguen o se vean mal.

Cómo reportar un problema
[Completar: correo, WhatsApp o canal donde el equipo recibe reportes de bugs]
Incluye, si puedes: qué pantalla, qué esperabas ver, y qué viste en su lugar.
```

---

## Registro interno (para tu propio historial de cambios)

```
## 1.0.0 — Open testing
- Fix: el detalle de un pedido (GET /admin/orders/{id}) devolvía el modelo
  crudo de Eloquent en vez del mismo formato camelCase que usa la lista de
  pedidos, dejando Cliente/Teléfono vacíos y el Total en NaN tanto en la app
  como en el panel web. Corregido en el backend (AdminOrderService).
- UI: indicador de flecha (›) en cada tarjeta de la lista de Pedidos.
- Branding: ícono de app, pantalla de carga, favicon del sitio y del panel
  admin usan ahora el logotipo de QuickOrder.
```

---

**Antes de publicar:** falta completar el canal de reporte de bugs en la
sección de TestFlight (marcado arriba). El resto del texto está listo para
copiar y pegar tal cual.
