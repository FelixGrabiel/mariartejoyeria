/**
 * Datos generales de la marca. Edita aquí el WhatsApp, Instagram y textos
 * globales: todos los componentes leen desde este archivo.
 */
export const site = {
  name: "MariArte",
  fullName: "MariArte | Joyería y Accesorios",
  tagline: "Joyas con significado, detalles que conectan",
  description:
    "Pulseras, dijes y sets con significado para regalar y acompañar momentos especiales. Atención por WhatsApp y envíos a todo el Perú.",
  whatsappNumber: "51981360835",
  whatsappDisplay: "+51 981 360 835",
  instagramUrl: "https://www.instagram.com/mariarte.accesorios/",
  instagramHandle: "@mariarte.accesorios",
  topBarMessage: "Envíos a todo el Perú · costo y plazo se coordinan por WhatsApp",
  /** Materiales comunicados por la marca en general. */
  brandMaterials: "plata y acero quirúrgico",
  demoNotice:
    "Prototipo de demostración: productos, precios, stock y pedidos son ejemplos y no corresponden a la oferta oficial de MariArte.",
} as const;

export const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/catalogo?categoria=regalos", label: "Regalos" },
  { href: "/regalo", label: "Arma tu regalo" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
] as const;

/** Fotos disponibles para elegir en el formulario del panel demo. */
export const demoImageLibrary = [
  { src: "/images/pulsera-ojo.jpg", label: "Pulsera ojo turco en muñeca" },
  { src: "/images/pulsera-cruz.jpg", label: "Pulsera cruz con bolsita" },
  { src: "/images/pulsera-duo.jpg", label: "Dúo de pulseras familiar" },
  { src: "/images/pulsera-perlas.jpg", label: "Pulsera de cuentas con corazón" },
  { src: "/images/pulsera-suerte.jpg", label: "Pulsera trébol en tarjeta" },
  { src: "/images/pulseras-medallas.jpg", label: "Set de medallas con empaque" },
  { src: "/images/pulseras-negras.jpg", label: "Pulseras negras con ojo turco" },
  { src: "/images/san-benito-piedras-1.jpg", label: "San Benito con ojo de tigre" },
  { src: "/images/san-benito-piedras-2.jpg", label: "San Benito con piedras azules y ojo turco" },
  { src: "/images/san-benito-plata-1.jpg", label: "San Benito en plata 950 en muñeca" },
  { src: "/images/san-benito-plata-2.jpg", label: "San Benito en plata 950 (detalle)" },
  { src: "/images/trebol-arbol-vida-1.jpg", label: "Árbol de la vida con turmalina en tarjeta" },
  { src: "/images/trebol-arbol-vida-2.jpg", label: "Árbol de la vida con turmalina en muñeca" },
  { src: "/images/pack-san-benito-muranos-1.jpg", label: "Pack San Benito con piedras muranos" },
  { src: "/images/pack-san-benito-muranos-2.jpg", label: "Pack San Benito con muranos en muñeca" },
  { src: "/images/hamsa-plata-1.jpg", label: "Mano de Hamsa en plata 950 con bolsita" },
  { src: "/images/hamsa-plata-2.jpg", label: "Mano de Hamsa en plata 950 en muñeca" },
  { src: "/images/ojo-turco-regulable-1.jpg", label: "Pulsera regulable con ojo turco en muñeca" },
  { src: "/images/ojo-turco-regulable-2.jpg", label: "Pulsera regulable con ojo turco" },
] as const;
