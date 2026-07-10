import {
  Bath,
  BrickWall,
  Building2,
  DoorOpen,
  Droplets,
  Hammer,
  Home,
  PaintBucket,
  Plug,
  Ruler,
  ShieldCheck,
  Truck,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Category = {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  accent: string;
};

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  unit: string;
  price?: number;
  availability: "Disponible" | "A confirmar" | "Bajo pedido";
  description: string;
  uses: string[];
  related: string[];
  imageTone: string;
  imageUrl?: string;
  sku?: string;
  stockNote?: string;
};

export type Calculator = {
  id: string;
  title: string;
  description: string;
  unit: string;
  icon: LucideIcon;
};

export const categories: Category[] = [
  {
    id: "obra-gruesa",
    name: "Obra gruesa",
    description: "Cemento, cal, hierros, ladrillos, bloques y aridos.",
    icon: BrickWall,
    accent: "bg-red-600",
  },
  {
    id: "ferreteria",
    name: "Ferretería",
    description: "Buloneria, fijaciones, seguridad, adhesivos y consumibles.",
    icon: Wrench,
    accent: "bg-prevedello-blue",
  },
  {
    id: "pintureria",
    name: "Pinturería",
    description: "Pinturas, impermeabilizantes, rodillos y accesorios.",
    icon: PaintBucket,
    accent: "bg-blue-700",
  },
  {
    id: "herramientas",
    name: "Herramientas",
    description: "Electricas, manuales, medicion y equipamiento de obra.",
    icon: Hammer,
    accent: "bg-amber-500",
  },
  {
    id: "pisos",
    name: "Pisos y revestimientos",
    description: "Cerámicos, porcelanatos, pastinas, pegamentos y zócalos.",
    icon: Ruler,
    accent: "bg-stone-500",
  },
  {
    id: "bano-cocina",
    name: "Baño y cocina",
    description: "Griferías, sanitarios, vanitorys, bachas y accesorios.",
    icon: Bath,
    accent: "bg-cyan-700",
  },
  {
    id: "aberturas",
    name: "Aberturas",
    description: "Puertas, ventanas, premarcos, cerraduras y herrajes.",
    icon: DoorOpen,
    accent: "bg-slate-700",
  },
  {
    id: "instalaciones",
    name: "Instalaciones",
    description: "Agua, gas, electricidad, desagues y conexiones.",
    icon: Plug,
    accent: "bg-emerald-700",
  },
];

export const products: Product[] = [
  {
    id: "cemento-avellaneda",
    name: "Cemento portland alta resistencia",
    brand: "Avellaneda",
    category: "Obra gruesa",
    unit: "Bolsa 50 kg",
    availability: "Disponible",
    description: "Cemento para estructuras, contrapisos y trabajos generales de obra.",
    uses: ["Hormigon", "Mamposteria", "Contrapisos"],
    related: ["Cal hidratada", "Arena gruesa", "Hierro nervado"],
    imageTone: "from-zinc-200 via-neutral-100 to-stone-300",
    imageUrl: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "pintura-sherwin",
    name: "Látex interior lavable",
    brand: "Sherwin-Williams",
    category: "Pinturería",
    unit: "Balde 20 L",
    availability: "A confirmar",
    description: "Terminacion mate para paredes interiores con buen poder cubritivo.",
    uses: ["Interiores", "Refacciones", "Obras nuevas"],
    related: ["Rodillo lana", "Enduido interior", "Cinta de pintor"],
    imageTone: "from-blue-200 via-white to-red-100",
    imageUrl: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "taladro-bosch",
    name: "Taladro percutor profesional",
    brand: "Bosch",
    category: "Herramientas",
    unit: "Unidad",
    price: 159900,
    availability: "Disponible",
    description: "Equipo robusto para perforacion en mamposteria, madera y metal.",
    uses: ["Instaladores", "Obra", "Taller"],
    related: ["Mechas widia", "Discos de corte", "Extensiones"],
    imageTone: "from-sky-300 via-blue-700 to-prevedello-blue",
    imageUrl: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "porcelanato-ilva",
    name: "Porcelanato simil cemento",
    brand: "ILVA",
    category: "Pisos y revestimientos",
    unit: "Caja m2",
    availability: "Bajo pedido",
    description: "Pieza de gran formato con estetica contemporanea para interior y exterior.",
    uses: ["Living", "Locales", "Galerias"],
    related: ["Pegamento flexible", "Pastina gris", "Crucetas niveladoras"],
    imageTone: "from-neutral-300 via-stone-200 to-zinc-500",
    imageUrl: "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "griferia-fv",
    name: "Grifería monocomando cocina",
    brand: "FV",
    category: "Baño y cocina",
    unit: "Unidad",
    price: 88900,
    availability: "Disponible",
    description: "Grifería cromada de uso diario con cierre cerámico y diseño sobrio.",
    uses: ["Cocinas", "Departamentos", "Refacciones"],
    related: ["Bacha acero", "Flexible mallado", "Sifon cocina"],
    imageTone: "from-zinc-100 via-sky-100 to-zinc-400",
    imageUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "membrana-emapi",
    name: "Membrana líquida transitable",
    brand: "Emapi",
    category: "Pinturería",
    unit: "Balde 20 kg",
    availability: "Disponible",
    description: "Impermeabilizante elastico para terrazas, techos y superficies expuestas.",
    uses: ["Techos", "Terrazas", "Medianeras"],
    related: ["Venda geotextil", "Sellador", "Rodillo sintetico"],
    imageTone: "from-red-100 via-white to-rose-300",
    imageUrl: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "hierro-acindar-8",
    name: "Hierro nervado ADN 420",
    brand: "Acindar",
    category: "Obra gruesa",
    unit: "Barra 12 m",
    availability: "Disponible",
    description: "Barras nervadas para columnas, vigas, plateas y estructuras de hormigón.",
    uses: ["Estructuras", "Columnas", "Encadenados"],
    related: ["Alambre recocido", "Estribos", "Cemento"],
    imageTone: "from-slate-300 via-zinc-200 to-slate-600",
    imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "ladrillo-ceramico-18",
    name: "Ladrillo cerámico hueco 18",
    brand: "Palmar",
    category: "Obra gruesa",
    unit: "Pallet / unidad",
    availability: "A confirmar",
    description: "Mampostería liviana para vivienda, ampliaciones y cerramientos de obra.",
    uses: ["Muros", "Ampliaciones", "Obra nueva"],
    related: ["Cemento", "Cal", "Arena"],
    imageTone: "from-orange-200 via-red-100 to-stone-300",
    imageUrl: "https://images.unsplash.com/photo-1604629761625-2c5a1d7065f0?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "durlock-placa-standard",
    name: "Placa de yeso estándar",
    brand: "Durlock",
    category: "Obra gruesa",
    unit: "Placa 1.20 x 2.40",
    availability: "Disponible",
    description: "Sistema liviano para cielorrasos, tabiques interiores y revestimientos.",
    uses: ["Cielorraso", "Tabiques", "Revestimientos"],
    related: ["Masilla", "Cinta", "Perfil omega"],
    imageTone: "from-zinc-100 via-white to-zinc-300",
    imageUrl: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "termotanque-senorial",
    name: "Termotanque alta recuperación",
    brand: "Señorial",
    category: "Baño y cocina",
    unit: "Unidad",
    availability: "Bajo pedido",
    description: "Equipo para vivienda familiar, locales y reposición sanitaria.",
    uses: ["Viviendas", "Locales", "Reposición"],
    related: ["Flexible", "Válvula", "Kit instalación"],
    imageTone: "from-sky-100 via-white to-zinc-300",
    imageUrl: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "cable-tpr-25",
    name: "Cable tipo taller 2x2.5",
    brand: "Kalop",
    category: "Instalaciones",
    unit: "Metro / rollo",
    availability: "Disponible",
    description: "Cable flexible para alimentación, obra, taller y conexiones seguras.",
    uses: ["Electricidad", "Taller", "Obra"],
    related: ["Térmica", "Ficha", "Caño corrugado"],
    imageTone: "from-emerald-100 via-zinc-100 to-slate-300",
    imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "puerta-chapa-inyectada",
    name: "Puerta chapa inyectada exterior",
    brand: "Oblak",
    category: "Aberturas",
    unit: "Unidad",
    availability: "A confirmar",
    description: "Puerta resistente para ingreso, depósitos, viviendas y locales.",
    uses: ["Ingreso", "Depósitos", "Vivienda"],
    related: ["Cerradura", "Premarco", "Burlete"],
    imageTone: "from-slate-200 via-zinc-200 to-slate-500",
    imageUrl: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "set-rodillos-pintura",
    name: "Kit rodillo + bandeja + pincel",
    brand: "El Galgo",
    category: "Pinturería",
    unit: "Kit",
    availability: "Disponible",
    description: "Kit práctico para pintura interior, retoques y trabajos de mantenimiento.",
    uses: ["Interiores", "Mantenimiento", "Refacción"],
    related: ["Látex", "Cinta", "Enduido"],
    imageTone: "from-blue-100 via-white to-red-100",
    imageUrl: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "adhesivo-porcelanato",
    name: "Adhesivo porcelanato flexible",
    brand: "Klaukol",
    category: "Pisos y revestimientos",
    unit: "Bolsa 30 kg",
    availability: "Disponible",
    description: "Pegamento flexible para piezas grandes, interiores y exteriores.",
    uses: ["Porcelanato", "Cerámicos", "Exterior"],
    related: ["Pastina", "Niveladores", "Llana"],
    imageTone: "from-stone-100 via-zinc-100 to-neutral-300",
    imageUrl: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=80",
  },
];

export const brands = [
  "Sherwin-Williams",
  "Bosch",
  "FV",
  "ILVA",
  "Ferrum",
  "Avellaneda",
  "Acindar",
  "Loma Negra",
  "Tersuave",
  "Durlock",
];

export const calculators: Calculator[] = [
  {
    id: "pintura",
    title: "Pintura",
    description: "Calcula litros segun metros, manos y rendimiento.",
    unit: "litros",
    icon: PaintBucket,
  },
  {
    id: "cerámicos",
    title: "Cerámicos",
    description: "Estima cajas, m2 y desperdicio sugerido.",
    unit: "m2",
    icon: Ruler,
  },
  {
    id: "cemento",
    title: "Cemento",
    description: "Arma una base para contrapiso, carpeta u hormigon.",
    unit: "bolsas",
    icon: BrickWall,
  },
  {
    id: "instalaciones",
    title: "Instalaciones",
    description: "Lista materiales de agua, gas o electricidad.",
    unit: "items",
    icon: Droplets,
  },
];

export const serviceHighlights = [
  { label: "Envíos a domicilio", detail: "Coordinación para Catamarca y zonas cercanas.", icon: Truck },
  { label: "Asesoramiento real", detail: "Te ayudamos a comprar lo justo para tu obra.", icon: ShieldCheck },
  { label: "Empresas y profesionales", detail: "Cotizaciones por volumen, obras y reposicion.", icon: Building2 },
  { label: "Todo para el hogar", detail: "Materiales, ferretería, terminaciones y equipamiento.", icon: Home },
];
