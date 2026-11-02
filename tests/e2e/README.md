# Pruebas de navegador

`customers.mjs` recorre la tienda como 14 tipos de clientes (visitante, comprador, regalo, combos, asistente de recomendaciones,
seguimiento de pedido, celular, contacto, stock que cambia, tienda vacía, accesibilidad, administrador, producto agotado y bot).

- El catálogo, los pedidos, el seguimiento y la IA del asistente se **simulan** en el navegador: no escriben en la base real.
- Local: `npm run build && npm start` y, en otra terminal, `npm run test:e2e` (una vez: `npx playwright install chromium`).
- Contra otra dirección: `BASE=https://tu-sitio.vercel.app npm run test:e2e`.
- Se ejecutan solas en GitHub Actions (`.github/workflows/ci.yml`) en cada subida.
