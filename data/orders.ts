import type { Order, StockMovement } from "@/types";

/** Pedidos FICTICIOS para el panel demo. No representan clientes reales. */
export const initialOrders: Order[] = [
  {
    id: "o-1048",
    code: "DEMO-1048",
    customerName: "Cliente de ejemplo A",
    district: "Miraflores, Lima",
    channel: "WhatsApp",
    createdAt: "2026-10-24",
    status: "pendiente",
    items: [
      { productId: "p-002", productName: "Pulsera Ojo Protector", variantLabel: "Rojo", quantity: 2, unitPrice: 34.9 },
    ],
  },
  {
    id: "o-1047",
    code: "DEMO-1047",
    customerName: "Cliente de ejemplo B",
    district: "Arequipa",
    channel: "Instagram",
    createdAt: "2026-10-23",
    status: "confirmado",
    items: [
      { productId: "p-003", productName: "Dúo Lazo Familiar", variantLabel: "Cruz + ojo turco", quantity: 1, unitPrice: 54.9 },
      { productId: "p-005", productName: "Pulsera Trébol de la Suerte", variantLabel: "Única", quantity: 1, unitPrice: 29.9 },
    ],
  },
  {
    id: "o-1046",
    code: "DEMO-1046",
    customerName: "Cliente de ejemplo C",
    district: "Surco, Lima",
    channel: "WhatsApp",
    createdAt: "2026-10-22",
    status: "preparado",
    items: [
      { productId: "p-010", productName: "Detalle de Regalo con Dedicatoria", variantLabel: "Cruz", quantity: 1, unitPrice: 36.9 },
    ],
  },
  {
    id: "o-1045",
    code: "DEMO-1045",
    customerName: "Cliente de ejemplo D",
    district: "Trujillo",
    channel: "WhatsApp",
    createdAt: "2026-10-21",
    status: "enviado",
    items: [
      { productId: "p-006", productName: "Set Medallas de Protección", variantLabel: "Roja + negra", quantity: 1, unitPrice: 49.9 },
    ],
  },
  {
    id: "o-1044",
    code: "DEMO-1044",
    customerName: "Cliente de ejemplo E",
    district: "San Miguel, Lima",
    channel: "Instagram",
    createdAt: "2026-10-19",
    status: "entregado",
    items: [
      { productId: "p-004", productName: "Pulsera Dulce Corazón", variantLabel: "Pastel", quantity: 2, unitPrice: 39.9 },
    ],
  },
  {
    id: "o-1043",
    code: "DEMO-1043",
    customerName: "Cliente de ejemplo F",
    district: "Cusco",
    channel: "WhatsApp",
    createdAt: "2026-10-17",
    status: "entregado",
    items: [
      { productId: "p-001", productName: "Pulsera Cruz de Luz", variantLabel: "Rojo", quantity: 1, unitPrice: 32.9 },
      { productId: "p-002", productName: "Pulsera Ojo Protector", variantLabel: "Negro", quantity: 1, unitPrice: 34.9 },
    ],
  },
  {
    id: "o-1042",
    code: "DEMO-1042",
    customerName: "Cliente de ejemplo G",
    district: "Callao",
    channel: "WhatsApp",
    createdAt: "2026-10-15",
    status: "cancelado",
    items: [
      { productId: "p-007", productName: "Dúo Ojo Turco Noche", variantLabel: "Dúo", quantity: 1, unitPrice: 44.9 },
    ],
  },
];

/** Movimientos de inventario FICTICIOS. */
export const initialMovements: StockMovement[] = [
  { id: "m-012", date: "2026-10-23", sku: "MA-DEMO-003-CO", productName: "Dúo Lazo Familiar", type: "salida", quantity: -1, note: "Pedido DEMO-1047" },
  { id: "m-011", date: "2026-10-22", sku: "MA-DEMO-010-CR", productName: "Detalle de Regalo con Dedicatoria", type: "salida", quantity: -1, note: "Pedido DEMO-1046" },
  { id: "m-010", date: "2026-10-20", sku: "MA-DEMO-010-TR", productName: "Detalle de Regalo con Dedicatoria", type: "entrada", quantity: 6, note: "Nueva producción" },
  { id: "m-009", date: "2026-10-18", sku: "MA-DEMO-008-PL", productName: "Collar Corazón Minimal", type: "entrada", quantity: 3, note: "Ingreso de muestra" },
  { id: "m-008", date: "2026-10-16", sku: "MA-DEMO-007-DU", productName: "Dúo Ojo Turco Noche", type: "ajuste", quantity: -2, note: "Conteo físico" },
  { id: "m-007", date: "2026-10-12", sku: "MA-DEMO-005-UN", productName: "Pulsera Trébol de la Suerte", type: "entrada", quantity: 10, note: "Nueva producción" },
];
