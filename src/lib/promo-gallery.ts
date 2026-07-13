export type PromoCollection = {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  image: string;
  ctaLabel: string;
  whatsappMessage: string;
};

export const promoHeroImages = [
  "/promo/anillos/anillos1.jpg",
  "/promo/cadenas/cadena1.jpg",
  "/promo/combos/combos1.jpg",
  "/promo/pulseras/pulseras1.jpg",
];

export const promoCollections: PromoCollection[] = [
  {
    id: "anillos",
    title: "Anillos con presencia",
    eyebrow: "Coleccion destacada",
    description: "Piezas doradas con formas organicas para elevar cualquier look diario.",
    image: "/promo/anillos/anillos1.jpg",
    ctaLabel: "Quiero ver anillos",
    whatsappMessage: "Quiero ver la coleccion de anillos",
  },
  {
    id: "cadenas",
    title: "Cadenas que protagonizan",
    eyebrow: "Capas y dijes",
    description: "Collares listos para llevar solos o en capas, con dijes que resaltan al instante.",
    image: "/promo/cadenas/cadena1.jpg",
    ctaLabel: "Ver cadenas",
    whatsappMessage: "Quiero conocer las cadenas disponibles",
  },
  {
    id: "pulseras",
    title: "Pulseras para regalar",
    eyebrow: "Detalles con color",
    description: "Pulseras delicadas y tematicas para fechas especiales y regalos con significado.",
    image: "/promo/pulseras/pulseras1.jpg",
    ctaLabel: "Ver pulseras",
    whatsappMessage: "Quiero ver las pulseras disponibles",
  },
];

export const promoCombos = [
  {
    title: "Combos listos para obsequiar",
    description: "Arma una compra rapida con sets que ya combinan entre si y comunican mejor la promocion.",
    image: "/promo/combos/combos1.jpg",
  },
  {
    title: "Promociones visuales para temporadas",
    description: "Tus combos ya traen una narrativa clara para fechas especiales y campanas de WhatsApp.",
    image: "/promo/combos/combos2.jpg",
  },
];
