import type { Faq, Testimonial } from "@/types";

/**
 * TESTIMONIOS DE DEMOSTRACIÓN — no son reseñas reales.
 * Reemplázalos por reseñas reales con autorización de cada clienta/cliente,
 * o elimina la sección si aún no hay reseñas.
 */
export const testimonials: Testimonial[] = [
  {
    id: "t-1",
    name: "Testimonio de ejemplo",
    text: "Aquí irá una reseña real sobre la pieza, el empaque o la atención recibida por WhatsApp.",
    product: "Pulsera Ojo Protector",
  },
  {
    id: "t-2",
    name: "Testimonio de ejemplo",
    text: "Espacio para una experiencia real de regalo: a quién se lo dieron y qué significó.",
    product: "Dúo Lazo Familiar",
  },
  {
    id: "t-3",
    name: "Testimonio de ejemplo",
    text: "Texto provisional. Usa reseñas cortas, con nombre y permiso de la persona.",
    product: "Detalle de Regalo con Dedicatoria",
  },
];

/** PREGUNTAS FRECUENTES — contenido provisional para editar con la marca. */
export const faqs: Faq[] = [
  {
    question: "¿Cómo hago un pedido?",
    answer:
      "Agrega tus joyas al carrito y presiona «Pedir por WhatsApp». Se abrirá un mensaje con tu pedido para que lo revises y lo envíes. MariArte te confirmará disponibilidad, precio final y entrega.",
  },
  {
    question: "¿Hacen envíos a provincias?",
    answer:
      "La marca comunica envíos a todo el Perú. El costo, la empresa de envío y el plazo se coordinan por WhatsApp según tu ciudad. (Texto provisional por confirmar.)",
  },
  {
    question: "¿Qué medios de pago aceptan?",
    answer:
      "Por ahora los pagos se coordinan directamente con la tienda por WhatsApp. Esta web todavía no procesa pagos en línea.",
  },
  {
    question: "¿Puedo agregar una dedicatoria?",
    answer:
      "Sí. En el carrito puedes escribir una nota para regalo; se incluirá en el mensaje de WhatsApp. La disponibilidad de tarjetas y empaques se confirma con la tienda.",
  },
  {
    question: "¿De qué material son las joyas?",
    answer:
      "MariArte trabaja con plata y acero quirúrgico, entre otros materiales. Cada ficha indicará el material confirmado de esa pieza.",
  },
  {
    question: "¿Puedo cambiar una pieza?",
    answer:
      "La política de cambios está pendiente de definición por la marca. Consulta por WhatsApp antes de comprar. (Texto provisional.)",
  },
];
