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
    name: "Ferreteria",
    description: "Buloneria, fijaciones, seguridad, adhesivos y consumibles.",
    icon: Wrench,
    accent: "bg-zinc-900",
  },
  {
    id: "pintureria",
    name: "Pintureria",
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
    description: "Ceramicos, porcelanatos, pastinas, pegamentos y zocalos.",
    icon: Ruler,
    accent: "bg-stone-500",
  },
  {
    id: "bano-cocina",
    name: "Bano y cocina",
    description: "Griferias, sanitarios, vanitorys, bachas y accesorios.",
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
  },
  {
    id: "pintura-sherwin",
    name: "Latex interior lavable",
    brand: "Sherwin-Williams",
    category: "Pintureria",
    unit: "Balde 20 L",
    availability: "A confirmar",
    description: "Terminacion mate para paredes interiores con buen poder cubritivo.",
    uses: ["Interiores", "Refacciones", "Obras nuevas"],
    related: ["Rodillo lana", "Enduido interior", "Cinta de pintor"],
    imageTone: "from-blue-200 via-white to-red-100",
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
    imageTone: "from-sky-300 via-blue-700 to-zinc-950",
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
  },
  {
    id: "griferia-fv",
    name: "Griferia monocomando cocina",
    brand: "FV",
    category: "Bano y cocina",
    unit: "Unidad",
    price: 88900,
    availability: "Disponible",
    description: "Griferia cromada de uso diario con cierre ceramico y diseno sobrio.",
    uses: ["Cocinas", "Departamentos", "Refacciones"],
    related: ["Bacha acero", "Flexible mallado", "Sifon cocina"],
    imageTone: "from-zinc-100 via-sky-100 to-zinc-400",
  },
  {
    id: "membrana-emapi",
    name: "Membrana liquida transitable",
    brand: "Emapi",
    category: "Pintureria",
    unit: "Balde 20 kg",
    availability: "Disponible",
    description: "Impermeabilizante elastico para terrazas, techos y superficies expuestas.",
    uses: ["Techos", "Terrazas", "Medianeras"],
    related: ["Venda geotextil", "Sellador", "Rodillo sintetico"],
    imageTone: "from-red-100 via-white to-rose-300",
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
    id: "ceramicos",
    title: "Ceramicos",
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
  { label: "Envios a domicilio", detail: "Coordinacion para Catamarca y zonas cercanas.", icon: Truck },
  { label: "Asesoramiento real", detail: "Te ayudamos a comprar lo justo para tu obra.", icon: ShieldCheck },
  { label: "Empresas y profesionales", detail: "Cotizaciones por volumen, obras y reposicion.", icon: Building2 },
  { label: "Todo para el hogar", detail: "Materiales, ferreteria, terminaciones y equipamiento.", icon: Home },
];
