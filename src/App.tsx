import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, Route, Routes, useParams } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  BadgeCheck,
  Calculator,
  Check,
  ChevronRight,
  CloudUpload,
  ClipboardList,
  Database,
  FileSpreadsheet,
  Menu,
  MessageCircle,
  Minus,
  PackageCheck,
  Plus,
  RotateCcw,
  Save,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import {
  brands,
  calculators,
  categories,
  serviceHighlights,
  type Category,
  type Product,
} from "./data/catalog";
import { getWhatsAppUrl } from "./config/business";
import { getStoredProducts, parseProductsCsv, resetStoredProducts, saveStoredProducts } from "./lib/catalogStorage";
import { loadCatalogProducts, publishProductsToSupabase } from "./lib/catalogRepository";
import {
  listQuoteRequests,
  saveQuoteRequest,
  updateQuoteStatus,
  type QuoteRecord,
  type QuoteStatus,
} from "./lib/quoteRepository";

gsap.registerPlugin(ScrollTrigger);

type QuoteItem = {
  product: Product;
  quantity: number;
};

const formatPrice = (price?: number) =>
  price
    ? new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
      }).format(price)
    : "Consultar precio";

const makeWhatsAppHref = (items: QuoteItem[], customer: QuoteFormState) => {
  const productLines = items.length
    ? items
        .map((item) => `- ${item.quantity} x ${item.product.name} (${item.product.unit})`)
        .join("\n")
    : "- Quiero asesoramiento para armar mi pedido";

  const message = [
    "Hola Prevedello, quiero solicitar una cotizacion:",
    productLines,
    "",
    `Nombre: ${customer.name || "A completar"}`,
    `Telefono: ${customer.phone || "A completar"}`,
    `Localidad: ${customer.location || "A completar"}`,
    `Entrega: ${customer.delivery}`,
    `Observaciones: ${customer.notes || "Sin observaciones"}`,
  ].join("\n");

  return getWhatsAppUrl(message);
};

type QuoteFormState = {
  name: string;
  phone: string;
  location: string;
  delivery: "Retiro en sucursal" | "Envio a domicilio";
  notes: string;
};

const defaultQuoteForm: QuoteFormState = {
  name: "",
  phone: "",
  location: "",
  delivery: "Envio a domicilio",
  notes: "",
};

function LogoMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <img
        src="/assets/prevedello-pap-3d.png"
        alt="Prevedello"
        className={`${compact ? "h-10 w-10" : "h-12 w-12"} rounded-full object-cover shadow-[0_10px_30px_rgba(9,59,145,0.28)]`}
      />
      <div className="leading-none">
        <p className="text-lg font-extrabold uppercase text-graphite">Prevedello</p>
        <p className="text-xs font-semibold uppercase text-zinc-500">Market</p>
      </div>
    </div>
  );
}

function HeaderMarketplace({
  query,
  onQueryChange,
  cartCount,
  onCartOpen,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  cartCount: number;
  onCartOpen: () => void;
}) {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 px-3 pt-3 sm:px-5">
      <div className="mx-auto flex max-w-7xl items-center gap-2 rounded-lg border border-white/50 bg-white/92 px-3 py-2 shadow-[0_12px_40px_rgba(9,59,145,0.12)] backdrop-blur-xl lg:gap-3">
        <a href="#inicio" className="shrink-0" aria-label="Ir al inicio">
          <LogoMark compact />
        </a>
        <div className="hidden min-w-0 flex-1 lg:block lg:max-w-sm xl:max-w-md">
          <SearchBar value={query} onChange={onQueryChange} compact />
        </div>
        <nav className="hidden items-center gap-4 text-sm font-semibold text-zinc-700 lg:flex xl:gap-6">
          <a className="transition hover:text-prevedello-red" href="#rubros">
            Rubros
          </a>
          <a className="transition hover:text-prevedello-red" href="#productos">
            Productos
          </a>
          <a className="transition hover:text-prevedello-red" href="#empresas">
            Empresas
          </a>
          <a className="transition hover:text-prevedello-red" href="#calculadoras">
            Calculadoras
          </a>
          <a className="transition hover:text-prevedello-red" href="#admin">
            Admin
          </a>
        </nav>
        <a
          href={makeWhatsAppHref([], defaultQuoteForm)}
          target="_blank"
          rel="noreferrer"
          className="hidden items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 md:flex"
        >
          <MessageCircle size={17} />
          WhatsApp
        </a>
        <button
          type="button"
          onClick={onCartOpen}
          className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-prevedello-blue text-white transition hover:scale-[1.03]"
          aria-label="Abrir pedido"
        >
          <ShoppingCart size={20} />
          {cartCount > 0 && (
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-prevedello-red px-1 text-xs font-bold">
              {cartCount}
            </span>
          )}
        </button>
        <button
          type="button"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-zinc-200 text-zinc-800 lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu size={21} />
        </button>
      </div>
      <div className="mx-auto mt-2 max-w-7xl lg:hidden">
        <SearchBar value={query} onChange={onQueryChange} compact />
      </div>
    </header>
  );
}

function SearchBar({
  value,
  onChange,
  compact = false,
}: {
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  return (
    <label
      className={`relative flex min-w-0 items-center gap-2 overflow-hidden rounded-full border border-zinc-200 bg-white px-4 shadow-sm transition focus-within:border-prevedello-red focus-within:shadow-[0_0_0_4px_rgba(220,31,38,0.08)] ${
        compact ? "h-11" : "h-16"
      }`}
    >
      <Search className="relative z-10 shrink-0 text-prevedello-red" size={compact ? 19 : 23} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Que necesitas para tu obra?"
        className="min-w-0 flex-1 bg-transparent text-base font-semibold text-graphite outline-none placeholder:text-zinc-400 sm:text-lg"
      />
      <span className="hidden shrink-0 rounded-full bg-cement px-3 py-1 text-xs font-bold uppercase text-zinc-600 sm:inline">
        Buscar
      </span>
    </label>
  );
}

function WhatsAppQuoteButton({
  items,
  customer,
  label = "Enviar por WhatsApp",
}: {
  items: QuoteItem[];
  customer: QuoteFormState;
  label?: string;
}) {
  return (
    <a
      href={makeWhatsAppHref(items, customer)}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-[0_16px_30px_rgba(22,163,74,0.22)] transition hover:bg-emerald-700"
    >
      <MessageCircle size={18} />
      {label}
    </a>
  );
}

function HeroSection({
  query,
  onQueryChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
}) {
  const heroRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!heroRef.current || !panelRef.current || !logoRef.current) return;

    const context = gsap.context(() => {
      gsap.fromTo(
        logoRef.current,
        { y: 18, scale: 0.94, opacity: 0 },
        { y: 0, scale: 1, opacity: 1, duration: 0.9, ease: "power3.out" },
      );

      gsap.fromTo(
        panelRef.current,
        { yPercent: 100 },
        {
          yPercent: 40,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "12% top",
            end: "bottom top",
            scrub: true,
          },
        },
      );

      gsap.to(logoRef.current, {
        y: -80,
        scale: 0.82,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }, heroRef);

    return () => context.revert();
  }, []);

  return (
    <section
      id="inicio"
      ref={heroRef}
      className="relative min-h-[132svh] overflow-hidden bg-prevedello-blue text-white"
    >
      <div className="absolute inset-0">
        <video
          src="/assets/prevedello-hero.mp4"
          className="h-full w-full scale-[1.04] object-cover opacity-72"
          muted
          playsInline
          autoPlay
          loop
          preload="metadata"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,59,145,0.92),rgba(9,59,145,0.48),rgba(9,59,145,0.78))]" />
        <div className="industrial-grid absolute inset-0 opacity-18 mix-blend-screen" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 pb-60 pt-32 sm:px-6 lg:px-8 xl:pb-72">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_0.88fr] xl:gap-16">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white/86 backdrop-blur-md">
              <Sparkles size={16} />
              Corralon, ferreteria y hogar en Catamarca
            </div>
            <h1 className="hero-heading max-w-4xl font-extrabold text-white">
              Todo para construir, refaccionar y equipar tu hogar.
            </h1>
            <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-white/76 sm:text-xl">
              Arma tu pedido en minutos, pedi asesoramiento y cotiza materiales con la confianza
              de una empresa familiar que conoce la obra desde adentro.
            </p>
            <div className="relative z-30 mt-6 max-w-xl">
              <SearchBar value={query} onChange={onQueryChange} />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#productos"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-extrabold text-graphite transition hover:scale-[1.03]"
              >
                Ver productos
                <ArrowRight size={17} />
              </a>
              <a
                href="#calculadoras"
                className="liquid-glass inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white transition hover:scale-[1.03]"
              >
                Calcular materiales
                <Calculator size={17} />
              </a>
            </div>
          </div>
          <div className="relative mx-auto hidden h-[min(39vw,520px)] w-full max-w-lg place-items-center lg:grid">
            <div className="absolute inset-10 rounded-full bg-prevedello-red/26 blur-3xl" />
            <img
              ref={logoRef}
              src="/assets/prevedello-pap-3d.png"
              alt="Logo 3D Prevedello"
              className="relative z-10 w-full max-w-[440px] rounded-full drop-shadow-[0_34px_70px_rgba(9,59,145,0.52)]"
            />
          </div>
        </div>
      </div>

      <div
        ref={panelRef}
        className="archive-panel absolute bottom-0 left-0 right-0 z-20 rounded-t-lg bg-prevedello-blue px-4 py-8 text-white shadow-[0_-30px_90px_rgba(9,59,145,0.35)] sm:px-6 lg:px-8"
      >
        <div className="mx-auto grid max-w-7xl gap-7 lg:grid-cols-[0.62fr_1.38fr] lg:items-center">
          <div className="flex flex-col justify-between gap-6">
            <div>
              <p className="text-sm font-bold uppercase text-prevedello-red">Prevedello en movimiento</p>
              <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">
                Un archivo vivo de productos, obra y entregas.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-white/62">
              Inspirado en una experiencia scroll-driven: el hero abre la marca y el panel baja al
              mundo comercial, donde cada rubro esta pensado para cotizar rapido.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 lg:gap-5">
            {[
              ["/assets/prevedello-todo.mp4", "Todo en un lugar"],
              ["/assets/prevedello-envios.mp4", "Envios cuidados"],
              ["/assets/prevedello-acopio.mp4", "Acopio para obra"],
            ].map(([src, label]) => (
              <div key={src} className="bp-card overflow-hidden rounded-lg bg-white/10">
                <video
                  src={src}
                  className="aspect-[4/5] w-full object-cover opacity-85"
                  muted
                  playsInline
                  autoPlay
                  loop
                  preload="metadata"
                />
                <p className="px-4 py-3 text-sm font-bold">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PromoBanner() {
  return (
    <section className="bg-prevedello-blue px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="blueprint-panel mx-auto flex max-w-7xl flex-col gap-6 rounded-lg border border-white/16 p-6 shadow-[0_24px_70px_rgba(9,59,145,0.28)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-prevedello-red shadow-[0_16px_35px_rgba(220,31,38,0.26)]">
            <BadgeCheck size={22} />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-white/60">Compra inteligente</p>
            <h2 className="text-2xl font-extrabold leading-tight">Arma tu pedido, agrega observaciones y envialo por WhatsApp.</h2>
          </div>
        </div>
        <a
          href="#productos"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-extrabold text-graphite shadow-[0_16px_35px_rgba(255,255,255,0.16)] transition hover:scale-[1.03]"
        >
          Empezar pedido
          <ChevronRight size={17} />
        </a>
      </div>
    </section>
  );
}

function CategoryCard({ category, onSelect }: { category: Category; onSelect: (name: string) => void }) {
  const Icon = category.icon;

  return (
    <button
      type="button"
      onClick={() => onSelect(category.name)}
      className="premium-card premium-card-hover group relative min-w-[250px] overflow-hidden rounded-lg p-6 text-left"
    >
      <span className="absolute inset-x-0 top-0 h-1 bg-prevedello-red" />
      <span className={`grid h-12 w-12 place-items-center rounded-lg text-white shadow-[0_14px_30px_rgba(9,59,145,0.16)] ${category.accent}`}>
        <Icon size={21} />
      </span>
      <h3 className="mt-6 text-xl font-extrabold text-graphite">{category.name}</h3>
      <p className="mt-2 min-h-12 text-sm leading-6 text-zinc-600">{category.description}</p>
      <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-prevedello-red">
        Ver rubro
        <ArrowRight size={16} className="transition group-hover:translate-x-1" />
      </span>
    </button>
  );
}

function Breadcrumbs({ current }: { current: string }) {
  return (
    <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-500">
      <a href="#inicio" className="hover:text-prevedello-red">
        Inicio
      </a>
      <ChevronRight size={15} />
      <span className="text-graphite">{current}</span>
    </div>
  );
}

function FilterSidebar({
  activeCategory,
  onCategoryChange,
  onlyAvailable,
  onOnlyAvailableChange,
}: {
  activeCategory: string;
  onCategoryChange: (value: string) => void;
  onlyAvailable: boolean;
  onOnlyAvailableChange: (value: boolean) => void;
}) {
  return (
    <aside className="premium-card rounded-lg p-5 lg:sticky lg:top-28">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="font-extrabold text-graphite">Filtros</h3>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-cement text-prevedello-blue">
          <SlidersHorizontal size={17} />
        </span>
      </div>
      <div className="space-y-2">
        {["Todos", ...categories.map((category) => category.name)].map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => onCategoryChange(category)}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-bold transition ${
              activeCategory === category
                ? "bg-prevedello-blue text-white shadow-[0_12px_28px_rgba(9,59,145,0.18)]"
                : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-cement/50"
            }`}
          >
            {category}
            {activeCategory === category && <Check size={15} />}
          </button>
        ))}
      </div>
      <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-lg bg-cement/70 p-4 text-sm font-bold text-graphite">
        <input
          type="checkbox"
          checked={onlyAvailable}
          onChange={(event) => onOnlyAvailableChange(event.target.checked)}
          className="h-4 w-4 accent-prevedello-red"
        />
        Mostrar solo disponibles
      </label>
    </aside>
  );
}

function ProductVisual({ product }: { product: Product }) {
  if (product.imageUrl) {
    return (
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-zinc-100">
        <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-prevedello-blue/80 to-transparent p-4">
          <p className="text-xs font-bold uppercase text-white/70">{product.brand}</p>
          <p className="text-lg font-extrabold leading-5 text-white">{product.category}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative aspect-[4/3] overflow-hidden rounded-lg bg-gradient-to-br ${product.imageTone}`}>
      <div className="absolute inset-x-6 bottom-5 top-8 rounded-lg bg-white/42 shadow-[0_24px_50px_rgba(9,59,145,0.18)] backdrop-blur-sm" />
      <div className="absolute left-8 top-7 h-16 w-24 rounded-lg bg-white/80 shadow-lg" />
      <div className="absolute bottom-8 right-7 h-28 w-24 rounded-lg bg-prevedello-blue/88 shadow-xl" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-lg bg-white/86 px-4 py-3 text-center shadow-xl">
          <p className="text-xs font-bold uppercase text-zinc-500">{product.brand}</p>
          <p className="mt-1 max-w-[11rem] text-lg font-extrabold leading-5 text-graphite">{product.category}</p>
        </div>
      </div>
    </div>
  );
}

function ProductCard({
  product,
  onAdd,
  onOpen,
}: {
  product: Product;
  onAdd: (product: Product) => void;
  onOpen: (product: Product) => void;
}) {
  return (
    <article className="premium-card premium-card-hover flex h-full flex-col rounded-lg p-4">
      <button type="button" onClick={() => onOpen(product)} className="block w-full text-left">
        <ProductVisual product={product} />
        <div className="px-1 pb-2 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase text-prevedello-red">{product.brand}</p>
              <h3 className="mt-1 text-xl font-extrabold leading-6 text-graphite">{product.name}</h3>
            </div>
            <span className="shrink-0 rounded-full bg-cement px-3 py-1 text-xs font-bold text-zinc-700">
              {product.unit}
            </span>
          </div>
          <p className="mt-3 min-h-12 text-sm leading-6 text-zinc-600">{product.description}</p>
          {(product.sku || product.stockNote) && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-zinc-500">
              {product.sku && <span className="rounded-full bg-zinc-100 px-2 py-1">SKU {product.sku}</span>}
              {product.stockNote && <span className="rounded-full bg-zinc-100 px-2 py-1">{product.stockNote}</span>}
            </div>
          )}
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-zinc-100 pt-4">
            <div>
              <p className="text-xl font-extrabold text-graphite">{formatPrice(product.price)}</p>
              <p className="mt-1 inline-flex rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                {product.availability}
              </p>
            </div>
          </div>
        </div>
      </button>
      <div className="mt-auto grid grid-cols-[1fr_auto] gap-3 pt-3">
        <button
          type="button"
          onClick={() => onAdd(product)}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-prevedello-blue px-4 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(9,59,145,0.2)] transition hover:bg-blue-800"
        >
          <Plus size={17} />
          Agregar
        </button>
        <a
          href={makeWhatsAppHref([{ product, quantity: 1 }], defaultQuoteForm)}
          target="_blank"
          rel="noreferrer"
          className="grid h-12 w-12 place-items-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
          aria-label={`Consultar ${product.name} por WhatsApp`}
        >
          <MessageCircle size={19} />
        </a>
      </div>
    </article>
  );
}

function ProductGrid({
  productsList,
  onAdd,
  onOpen,
}: {
  productsList: Product[];
  onAdd: (product: Product) => void;
  onOpen: (product: Product) => void;
}) {
  return (
    <div className="grid items-stretch gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {productsList.map((product) => (
        <ProductCard key={product.id} product={product} onAdd={onAdd} onOpen={onOpen} />
      ))}
    </div>
  );
}

function BrandStrip() {
  return (
    <section className="section-band overflow-hidden py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-kicker">Marcas y proveedores</p>
            <h2 className="mt-2 text-3xl font-extrabold text-graphite sm:text-4xl">Respaldo para cada rubro.</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-zinc-600">
            Una base comercial pensada para cargar proveedores reales y ordenar la oferta.
          </p>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
          {brands.map((brand) => (
            <div
              key={brand}
              className="premium-card grid min-w-[180px] place-items-center rounded-lg px-5 py-5 text-center text-sm font-extrabold text-graphite"
            >
              {brand}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MaterialCalculatorCard({ calculator }: { calculator: (typeof calculators)[number] }) {
  const Icon = calculator.icon;
  const [meters, setMeters] = useState(24);
  const result = Math.max(1, Math.ceil(meters / (calculator.id === "pintura" ? 10 : 3.6)));

  return (
    <article className="premium-card premium-card-hover rounded-lg p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-lg bg-prevedello-blue text-white shadow-[0_14px_30px_rgba(9,59,145,0.18)]">
          <Icon size={20} />
        </span>
        <div>
          <h3 className="text-lg font-extrabold text-graphite">{calculator.title}</h3>
          <p className="text-sm text-zinc-600">{calculator.description}</p>
        </div>
      </div>
      <label className="mt-5 block text-sm font-bold text-zinc-700">
        Superficie estimada
        <input
          type="number"
          min={1}
          value={meters}
          onChange={(event) => setMeters(Number(event.target.value))}
          className="mt-2 h-12 w-full rounded-lg border border-zinc-200 bg-white px-3 text-lg font-extrabold outline-none focus:border-prevedello-red"
        />
      </label>
      <div className="mt-5 rounded-lg bg-cement p-4">
        <p className="text-sm font-semibold text-zinc-600">Resultado orientativo</p>
        <p className="mt-1 text-2xl font-extrabold text-graphite">
          {result} {calculator.unit}
        </p>
      </div>
    </article>
  );
}

function ProfessionalCTA() {
  return (
    <section id="empresas" className="section-anchor bg-prevedello-blue px-4 py-20 text-white sm:px-6 lg:px-8">
      <div className="blueprint-panel mx-auto grid max-w-7xl gap-10 rounded-lg border border-white/14 p-6 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:p-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-prevedello-red">Empresas y obras</p>
          <h2 className="mt-3 max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl">
            Compras por volumen con seguimiento, entrega y asesoramiento tecnico.
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-white/65">
            Para constructoras, profesionales, municipios, comercios y proyectos que necesitan
            continuidad de materiales, previsibilidad y una respuesta humana.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <WhatsAppQuoteButton items={[]} customer={defaultQuoteForm} label="Cotizar obra" />
            <a
              href="#productos"
              className="inline-flex items-center justify-center rounded-full border border-white/18 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Ver catalogo
            </a>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {serviceHighlights.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-lg border border-white/12 bg-white/8 p-6 shadow-[0_18px_40px_rgba(9,59,145,0.18)]">
                <Icon className="text-prevedello-red" size={24} />
                <h3 className="mt-4 text-lg font-extrabold">{item.label}</h3>
                <p className="mt-2 text-sm leading-6 text-white/62">{item.detail}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function QuoteCart({
  open,
  items,
  customer,
  onCustomerChange,
  onClose,
  onIncrement,
  onDecrement,
  onRemove,
  onSendQuote,
}: {
  open: boolean;
  items: QuoteItem[];
  customer: QuoteFormState;
  onCustomerChange: (value: QuoteFormState) => void;
  onClose: () => void;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onRemove: (id: string) => void;
  onSendQuote: () => Promise<string>;
}) {
  const [sendStatus, setSendStatus] = useState("");
  const [sending, setSending] = useState(false);

  const handleSendQuote = async () => {
    setSending(true);
    const message = await onSendQuote();
    setSendStatus(message);
    setSending(false);
    window.open(makeWhatsAppHref(items, customer), "_blank", "noopener,noreferrer");
  };

  return (
    <div className={`fixed inset-0 z-[80] ${open ? "pointer-events-auto" : "pointer-events-none"}`}>
      <button
        type="button"
        className={`absolute inset-0 bg-prevedello-blue/35 transition ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
        aria-label="Cerrar pedido"
      />
      <aside
        className={`absolute bottom-0 right-0 top-0 flex w-full max-w-xl flex-col bg-white shadow-2xl transition duration-300 sm:rounded-l-lg ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 p-5">
          <div>
            <p className="text-sm font-bold uppercase text-prevedello-red">Carrito de cotizacion</p>
            <h2 className="text-2xl font-extrabold text-graphite">Tu pedido</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full bg-zinc-100 text-zinc-700"
            aria-label="Cerrar"
          >
            <X size={19} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="rounded-lg bg-cement p-5 text-center">
              <PackageCheck className="mx-auto text-prevedello-red" size={34} />
              <p className="mt-3 text-lg font-extrabold text-graphite">Todavia no agregaste productos.</p>
              <p className="mt-1 text-sm text-zinc-600">
                Podes enviar una consulta general o sumar productos desde el catalogo.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.product.id} className="rounded-lg border border-zinc-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-prevedello-red">{item.product.brand}</p>
                      <h3 className="font-extrabold text-graphite">{item.product.name}</h3>
                      <p className="text-sm text-zinc-500">{item.product.unit}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(item.product.id)}
                      className="text-zinc-400 hover:text-prevedello-red"
                      aria-label={`Quitar ${item.product.name}`}
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onDecrement(item.product.id)}
                      className="grid h-9 w-9 place-items-center rounded-full bg-zinc-100"
                      aria-label="Restar unidad"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="grid h-9 min-w-12 place-items-center rounded-full bg-prevedello-blue px-3 text-sm font-bold text-white">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onIncrement(item.product.id)}
                      className="grid h-9 w-9 place-items-center rounded-full bg-zinc-100"
                      aria-label="Sumar unidad"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 grid gap-3">
            <input
              value={customer.name}
              onChange={(event) => onCustomerChange({ ...customer, name: event.target.value })}
              placeholder="Nombre del cliente"
              className="h-12 rounded-lg border border-zinc-200 px-3 font-semibold outline-none focus:border-prevedello-red"
            />
            <input
              value={customer.phone}
              onChange={(event) => onCustomerChange({ ...customer, phone: event.target.value })}
              placeholder="Telefono"
              className="h-12 rounded-lg border border-zinc-200 px-3 font-semibold outline-none focus:border-prevedello-red"
            />
            <input
              value={customer.location}
              onChange={(event) => onCustomerChange({ ...customer, location: event.target.value })}
              placeholder="Localidad"
              className="h-12 rounded-lg border border-zinc-200 px-3 font-semibold outline-none focus:border-prevedello-red"
            />
            <select
              value={customer.delivery}
              onChange={(event) =>
                onCustomerChange({
                  ...customer,
                  delivery: event.target.value as QuoteFormState["delivery"],
                })
              }
              className="h-12 rounded-lg border border-zinc-200 px-3 font-semibold outline-none focus:border-prevedello-red"
            >
              <option>Envio a domicilio</option>
              <option>Retiro en sucursal</option>
            </select>
            <textarea
              value={customer.notes}
              onChange={(event) => onCustomerChange({ ...customer, notes: event.target.value })}
              placeholder="Observaciones: medidas, marcas preferidas, urgencia, direccion..."
              className="min-h-24 rounded-lg border border-zinc-200 p-3 font-semibold outline-none focus:border-prevedello-red"
            />
          </div>
        </div>
        <div className="border-t border-zinc-200 p-5">
          {sendStatus && <p className="mb-3 rounded-lg bg-cement p-3 text-sm font-semibold text-zinc-700">{sendStatus}</p>}
          <button
            type="button"
            onClick={handleSendQuote}
            disabled={sending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-[0_16px_30px_rgba(22,163,74,0.22)] transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-70"
          >
            <MessageCircle size={18} />
            {sending ? "Guardando cotizacion..." : "Guardar y enviar por WhatsApp"}
          </button>
        </div>
      </aside>
    </div>
  );
}

function ProductDetailModal({
  product,
  onClose,
  onAdd,
}: {
  product: Product | null;
  onClose: () => void;
  onAdd: (product: Product) => void;
}) {
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-[90] grid place-items-end bg-prevedello-blue/35 p-0 sm:place-items-center sm:p-4">
      <article className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-t-lg bg-white p-4 shadow-2xl sm:rounded-lg sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <Breadcrumbs current={product.name} />
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-zinc-100"
            aria-label="Cerrar ficha"
          >
            <X size={18} />
          </button>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <ProductVisual product={product} />
          <div>
            <p className="text-sm font-bold uppercase text-prevedello-red">{product.brand}</p>
            <h2 className="mt-2 text-4xl font-extrabold leading-tight text-graphite">{product.name}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-cement px-3 py-1 text-sm font-bold text-zinc-700">
                {product.category}
              </span>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-bold text-zinc-700">
                {product.unit}
              </span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">
                {product.availability}
              </span>
            </div>
            <p className="mt-5 text-3xl font-extrabold text-graphite">{formatPrice(product.price)}</p>
            <p className="mt-4 text-lg leading-8 text-zinc-600">{product.description}</p>
            {(product.sku || product.stockNote) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {product.sku && (
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-bold text-zinc-700">
                    SKU {product.sku}
                  </span>
                )}
                {product.stockNote && (
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-bold text-zinc-700">
                    {product.stockNote}
                  </span>
                )}
              </div>
            )}
            <div className="mt-5">
              <h3 className="font-extrabold text-graphite">Usos recomendados</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.uses.map((use) => (
                  <span key={use} className="rounded-full border border-zinc-200 px-3 py-1 text-sm font-semibold">
                    {use}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-5">
              <h3 className="font-extrabold text-graphite">Productos relacionados</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.related.map((item) => (
                  <span key={item} className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-semibold">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onAdd(product)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-prevedello-blue px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
              >
                <Plus size={17} />
                Agregar al pedido
              </button>
              <WhatsAppQuoteButton items={[{ product, quantity: 1 }]} customer={defaultQuoteForm} label="Consultar por WhatsApp" />
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

type AdminDraft = {
  name: string;
  brand: string;
  category: string;
  unit: string;
  price: string;
  availability: Product["availability"];
  description: string;
  imageUrl: string;
  sku: string;
  stockNote: string;
};

const emptyAdminDraft: AdminDraft = {
  name: "",
  brand: "",
  category: "Ferreteria",
  unit: "Unidad",
  price: "",
  availability: "Disponible",
  description: "",
  imageUrl: "",
  sku: "",
  stockNote: "",
};

function AdminCatalogPanel({
  productsList,
  onProductsChange,
  catalogStatus,
  catalogSource,
  onReloadCatalog,
  onPublishCatalog,
}: {
  productsList: Product[];
  onProductsChange: (products: Product[]) => void;
  catalogStatus: string;
  catalogSource: "local" | "supabase";
  onReloadCatalog: () => Promise<void>;
  onPublishCatalog: () => Promise<string>;
}) {
  const [draft, setDraft] = useState(emptyAdminDraft);
  const [csvText, setCsvText] = useState("");
  const [message, setMessage] = useState("Los cambios se guardan solo en este navegador.");

  const persist = (nextProducts: Product[], nextMessage: string) => {
    onProductsChange(nextProducts);
    saveStoredProducts(nextProducts);
    setMessage(nextMessage);
  };

  const handleManualSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.name.trim()) {
      setMessage("Completa al menos el nombre del producto.");
      return;
    }

    const nextProduct: Product = {
      id:
        draft.sku.trim() ||
        draft.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
      name: draft.name.trim(),
      brand: draft.brand.trim() || "Prevedello",
      category: draft.category,
      unit: draft.unit.trim() || "Unidad",
      price: draft.price ? Number(draft.price) : undefined,
      availability: draft.availability,
      description: draft.description.trim() || "Producto disponible para cotizar con asesoramiento.",
      uses: ["Obra", "Hogar"],
      related: [],
      imageTone: "from-zinc-200 via-neutral-100 to-stone-300",
      imageUrl: draft.imageUrl.trim() || undefined,
      sku: draft.sku.trim() || undefined,
      stockNote: draft.stockNote.trim() || undefined,
    };

    const withoutDuplicate = productsList.filter((product) => product.id !== nextProduct.id);
    persist([nextProduct, ...withoutDuplicate], `Producto agregado: ${nextProduct.name}`);
    setDraft(emptyAdminDraft);
  };

  const importCsv = (rawCsv: string) => {
    const importedProducts = parseProductsCsv(rawCsv);
    if (importedProducts.length === 0) {
      setMessage("No pude leer productos. Revisa encabezados y filas del CSV.");
      return;
    }

    const importedIds = new Set(importedProducts.map((product) => product.id));
    const merged = [...importedProducts, ...productsList.filter((product) => !importedIds.has(product.id))];
    persist(merged, `${importedProducts.length} productos importados desde CSV.`);
    setCsvText("");
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => importCsv(String(reader.result ?? ""));
    reader.readAsText(file);
    event.target.value = "";
  };

  const resetCatalog = () => {
    resetStoredProducts();
    const seedProducts = getStoredProducts();
    onProductsChange(seedProducts);
    setMessage("Catalogo restaurado a los productos iniciales.");
  };

  return (
    <section id="admin" className="section-anchor section-band px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-9 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="section-kicker">Admin local</p>
            <h2 className="mt-2 text-4xl font-extrabold text-graphite sm:text-5xl">
              Carga productos sin esperar al backend.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
              Importa CSV o da de alta productos manualmente. Queda guardado en localStorage para
              validar catalogo, fotos, filtros y cotizacion antes de conectar Supabase.
            </p>
          </div>
          <div className="premium-card rounded-lg px-6 py-5">
            <p className="text-sm font-bold text-zinc-600">Productos activos</p>
            <p className="text-3xl font-extrabold text-graphite">{productsList.length}</p>
          </div>
        </div>

        <div className="grid gap-7 lg:grid-cols-[1fr_0.9fr]">
          <form onSubmit={handleManualSubmit} className="premium-card rounded-lg p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-prevedello-blue text-white">
                <Save size={20} />
              </span>
              <div>
                <h3 className="text-xl font-extrabold text-graphite">Alta rapida</h3>
                <p className="text-sm text-zinc-600">Producto individual para probar el marketplace.</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                placeholder="Nombre del producto"
                className="h-12 rounded-lg border border-zinc-200 px-3 font-semibold outline-none focus:border-prevedello-red sm:col-span-2"
              />
              <input
                value={draft.brand}
                onChange={(event) => setDraft({ ...draft, brand: event.target.value })}
                placeholder="Marca"
                className="h-12 rounded-lg border border-zinc-200 px-3 font-semibold outline-none focus:border-prevedello-red"
              />
              <select
                value={draft.category}
                onChange={(event) => setDraft({ ...draft, category: event.target.value })}
                className="h-12 rounded-lg border border-zinc-200 px-3 font-semibold outline-none focus:border-prevedello-red"
              >
                {categories.map((category) => (
                  <option key={category.id}>{category.name}</option>
                ))}
              </select>
              <input
                value={draft.unit}
                onChange={(event) => setDraft({ ...draft, unit: event.target.value })}
                placeholder="Unidad"
                className="h-12 rounded-lg border border-zinc-200 px-3 font-semibold outline-none focus:border-prevedello-red"
              />
              <input
                value={draft.price}
                onChange={(event) => setDraft({ ...draft, price: event.target.value })}
                placeholder="Precio opcional"
                type="number"
                min={0}
                className="h-12 rounded-lg border border-zinc-200 px-3 font-semibold outline-none focus:border-prevedello-red"
              />
              <select
                value={draft.availability}
                onChange={(event) =>
                  setDraft({ ...draft, availability: event.target.value as Product["availability"] })
                }
                className="h-12 rounded-lg border border-zinc-200 px-3 font-semibold outline-none focus:border-prevedello-red"
              >
                <option>Disponible</option>
                <option>A confirmar</option>
                <option>Bajo pedido</option>
              </select>
              <input
                value={draft.sku}
                onChange={(event) => setDraft({ ...draft, sku: event.target.value })}
                placeholder="SKU opcional"
                className="h-12 rounded-lg border border-zinc-200 px-3 font-semibold outline-none focus:border-prevedello-red"
              />
              <input
                value={draft.stockNote}
                onChange={(event) => setDraft({ ...draft, stockNote: event.target.value })}
                placeholder="Nota de stock"
                className="h-12 rounded-lg border border-zinc-200 px-3 font-semibold outline-none focus:border-prevedello-red"
              />
              <input
                value={draft.imageUrl}
                onChange={(event) => setDraft({ ...draft, imageUrl: event.target.value })}
                placeholder="URL de imagen"
                className="h-12 rounded-lg border border-zinc-200 px-3 font-semibold outline-none focus:border-prevedello-red sm:col-span-2"
              />
              <textarea
                value={draft.description}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                placeholder="Descripcion breve"
                className="min-h-24 rounded-lg border border-zinc-200 p-3 font-semibold outline-none focus:border-prevedello-red sm:col-span-2"
              />
            </div>
            <button
              type="submit"
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-prevedello-blue px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
            >
              <Save size={17} />
              Guardar producto
            </button>
          </form>

          <div className="premium-card rounded-lg p-6">
            <div className="mb-5 rounded-lg border border-prevedello-blue/10 bg-cement/50 p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-prevedello-blue text-white">
                  <Database size={20} />
                </span>
                <div>
                  <p className="text-sm font-bold uppercase text-zinc-500">
                    Fuente activa: {catalogSource === "supabase" ? "Supabase" : "Local"}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-zinc-700">{catalogStatus}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void onReloadCatalog()}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-bold text-graphite transition hover:bg-zinc-100"
                >
                  <RotateCcw size={16} />
                  Recargar
                </button>
                <button
                  type="button"
                  onClick={async () => setMessage(await onPublishCatalog())}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-prevedello-blue px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-800"
                >
                  <CloudUpload size={16} />
                  Publicar en Supabase
                </button>
              </div>
            </div>

            <div className="mb-5 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-prevedello-red text-white">
                <FileSpreadsheet size={20} />
              </span>
              <div>
                <h3 className="text-xl font-extrabold text-graphite">Importador CSV</h3>
                <p className="text-sm text-zinc-600">Acepta encabezados en espanol o ingles.</p>
              </div>
            </div>
            <textarea
              value={csvText}
              onChange={(event) => setCsvText(event.target.value)}
              placeholder={"nombre,marca,categoria,unidad,precio,disponibilidad,descripcion,imagen,sku,stock\nCemento 50kg,Avellaneda,Obra gruesa,Bolsa 50 kg,,Disponible,Cemento portland,,CEM-50,Stock alto"}
              className="min-h-44 w-full rounded-lg border border-zinc-200 p-3 font-mono text-sm outline-none focus:border-prevedello-red"
            />
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => importCsv(csvText)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-prevedello-red px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700"
              >
                <Upload size={17} />
                Importar texto
              </button>
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-zinc-200 px-5 py-3 text-sm font-bold text-graphite transition hover:bg-zinc-50">
                <Upload size={17} />
                Subir CSV
                <input type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
              </label>
              <button
                type="button"
                onClick={resetCatalog}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-200 px-5 py-3 text-sm font-bold text-graphite transition hover:bg-zinc-50"
              >
                <RotateCcw size={17} />
                Restaurar seed
              </button>
            </div>
            <p className="mt-4 rounded-lg bg-cement p-3 text-sm font-semibold text-zinc-700">{message}</p>
            <div className="mt-5 rounded-lg bg-cement/50 p-4">
              <p className="text-sm font-extrabold text-graphite">Columnas sugeridas</p>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                nombre, marca, categoria, unidad, precio, disponibilidad, descripcion, usos,
                relacionados, imagen, sku, stock
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const quoteStatusLabels: Record<QuoteStatus, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  cotizacion_enviada: "Cotizacion enviada",
  en_negociacion: "En negociacion",
  ganado: "Ganado",
  perdido: "Perdido",
  sin_respuesta: "Sin respuesta",
};

function AdminCrmPanel({
  quotes,
  statusMessage,
  onReload,
  onStatusChange,
}: {
  quotes: QuoteRecord[];
  statusMessage: string;
  onReload: () => Promise<void>;
  onStatusChange: (quoteId: string, status: QuoteStatus) => Promise<void>;
}) {
  const stats = {
    newQuotes: quotes.filter((quote) => quote.status === "nuevo").length,
    pending: quotes.filter((quote) => !["ganado", "perdido"].includes(quote.status)).length,
    won: quotes.filter((quote) => quote.status === "ganado").length,
    lost: quotes.filter((quote) => quote.status === "perdido").length,
  };

  return (
    <section className="section-band px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-9 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-kicker">CRM comercial</p>
            <h2 className="mt-2 text-4xl font-extrabold text-graphite sm:text-5xl">
              Seguimiento de consultas y cotizaciones.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
              Primer tablero operativo: cada pedido enviado por WhatsApp queda como cotizacion para
              contacto, negociacion y cierre.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void onReload()}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-prevedello-blue px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
          >
            <RotateCcw size={17} />
            Recargar CRM
          </button>
        </div>

        <div className="mb-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Nuevas", stats.newQuotes],
            ["Pendientes", stats.pending],
            ["Ganadas", stats.won],
            ["Perdidas", stats.lost],
          ].map(([label, value]) => (
            <div key={label} className="premium-card rounded-lg p-6">
              <p className="text-sm font-bold uppercase text-zinc-500">{label}</p>
              <p className="mt-2 text-4xl font-extrabold text-graphite">{value}</p>
            </div>
          ))}
        </div>

        <p className="mb-5 rounded-lg bg-white p-4 text-sm font-semibold text-zinc-700 shadow-sm">{statusMessage}</p>

        <div className="premium-card overflow-hidden rounded-lg">
          {quotes.length === 0 ? (
            <div className="p-8 text-center">
              <ClipboardList className="mx-auto text-prevedello-red" size={38} />
              <h3 className="mt-3 text-2xl font-extrabold text-graphite">Todavia no hay cotizaciones.</h3>
              <p className="mt-2 text-zinc-600">Cuando un cliente guarde y envie su pedido, va a aparecer aca.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-200">
              {quotes.map((quote) => (
                <article key={quote.id} className="grid gap-4 p-4 lg:grid-cols-[1fr_220px] lg:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-extrabold text-graphite">{quote.customerName}</h3>
                      <span className="rounded-full bg-cement px-3 py-1 text-xs font-bold text-zinc-700">
                        {quoteStatusLabels[quote.status]}
                      </span>
                      <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-500">
                        {new Date(quote.createdAt).toLocaleDateString("es-AR")}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-zinc-600">
                      {quote.customerPhone} · {quote.customerLocation} · {quote.deliveryType}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {quote.items.map((item) => (
                        <span key={`${quote.id}-${item.productId}-${item.productName}`} className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-semibold text-zinc-700">
                          {item.quantity} x {item.productName}
                        </span>
                      ))}
                    </div>
                    {quote.notes && <p className="mt-3 text-sm leading-6 text-zinc-600">Notas: {quote.notes}</p>}
                  </div>
                  <div className="grid gap-2">
                    <select
                      value={quote.status}
                      onChange={(event) => void onStatusChange(quote.id, event.target.value as QuoteStatus)}
                      className="h-11 rounded-lg border border-zinc-200 px-3 text-sm font-bold outline-none focus:border-prevedello-red"
                    >
                      {Object.entries(quoteStatusLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <a
                      href={getWhatsAppUrl(
                        `Hola ${quote.customerName}, te escribimos de Prevedello por tu cotizacion del ${new Date(
                          quote.createdAt,
                        ).toLocaleDateString("es-AR")}.`,
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
                    >
                      <MessageCircle size={17} />
                      Responder
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function MobileBottomNav({ cartCount, onCartOpen }: { cartCount: number; onCartOpen: () => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-prevedello-blue/10 bg-white/95 px-2 py-2 shadow-[0_-14px_40px_rgba(9,59,145,0.16)] backdrop-blur-xl lg:hidden">
      <div className="grid grid-cols-5 text-xs font-bold text-zinc-600">
        {[
          ["#inicio", "Inicio", HomeIcon],
          ["#rubros", "Rubros", PackageCheck],
          ["#productos", "Buscar", Search],
          ["#pedido", "Pedido", ShoppingCart],
          [makeWhatsAppHref([], defaultQuoteForm), "WhatsApp", MessageCircle],
        ].map(([href, label, Icon]) => {
          const IconComponent = Icon as typeof Search;
          if (label === "Pedido") {
            return (
              <button
                key={label as string}
                type="button"
                onClick={onCartOpen}
                className="relative flex flex-col items-center gap-1 rounded-lg px-2 py-1 text-graphite transition hover:bg-cement/60"
              >
                <IconComponent size={19} />
                <span>{label as string}</span>
                {cartCount > 0 && (
                  <span className="absolute right-4 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-prevedello-red px-1 text-[10px] text-white">
                    {cartCount}
                  </span>
                )}
              </button>
            );
          }

          return (
            <a
              key={label as string}
              href={href as string}
              target={(label as string) === "WhatsApp" ? "_blank" : undefined}
              rel={(label as string) === "WhatsApp" ? "noreferrer" : undefined}
              className="flex flex-col items-center gap-1 rounded-lg px-2 py-1 transition hover:bg-cement/60 hover:text-graphite"
            >
              <IconComponent size={19} />
              <span>{label as string}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon({ size = 19 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function RouteHeader({ title, eyebrow, children }: { title: string; eyebrow: string; children?: ReactNode }) {
  return (
    <div className="bg-prevedello-blue px-4 pb-14 pt-28 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link to="/" className="mb-8 inline-block rounded-lg bg-white px-4 py-3">
          <LogoMark compact />
        </Link>
        <p className="text-sm font-bold uppercase tracking-wide text-prevedello-red">{eyebrow}</p>
        <h1 className="mt-2 max-w-4xl text-5xl font-extrabold leading-tight sm:text-6xl">{title}</h1>
        {children && <div className="mt-5 max-w-2xl text-lg leading-8 text-white/72">{children}</div>}
      </div>
    </div>
  );
}

function useCatalogProducts() {
  const [productsList, setProductsList] = useState<Product[]>(() => getStoredProducts());
  const [status, setStatus] = useState("Catalogo local activo.");

  useEffect(() => {
    void loadCatalogProducts().then((result) => {
      setProductsList(result.products);
      setStatus(result.message);
    });
  }, []);

  return { productsList, status };
}

function ProductsRoutePage() {
  const { productsList, status } = useCatalogProducts();
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const filtered = productsList.filter((product) =>
    [product.name, product.brand, product.category].join(" ").toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#f7f3eb]">
      <RouteHeader title="Catalogo de productos" eyebrow="Productos">
        Busca por producto, marca o rubro. Esta ruta queda lista para convertirse en catalogo completo.
      </RouteHeader>
      <main className="section-band px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
        <div className="premium-card mb-7 rounded-lg p-5">
          <SearchBar value={query} onChange={setQuery} />
          <p className="mt-3 text-sm font-semibold text-zinc-600">{status}</p>
        </div>
        <ProductGrid
          productsList={filtered}
          onAdd={(product) => setSelectedProduct(product)}
          onOpen={setSelectedProduct}
        />
        </div>
      </main>
      <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onAdd={() => undefined} />
    </div>
  );
}

function ProductRoutePage() {
  const { slug } = useParams();
  const { productsList } = useCatalogProducts();
  const product = productsList.find((item) => item.id === slug || slugify(item.name) === slug);

  if (!product) {
    return (
      <div className="min-h-screen bg-[#f7f3eb]">
        <RouteHeader title="Producto no encontrado" eyebrow="Productos">
          Volve al catalogo para buscar otra alternativa.
        </RouteHeader>
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <Link to="/productos" className="rounded-full bg-prevedello-blue px-5 py-3 text-sm font-bold text-white">
            Ver productos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f3eb]">
      <RouteHeader title={product.name} eyebrow={product.category}>
        {product.description}
      </RouteHeader>
      <main className="section-band px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-7 lg:grid-cols-[1fr_0.9fr]">
        <ProductVisual product={product} />
        <div className="premium-card rounded-lg p-7">
          <p className="text-sm font-bold uppercase text-prevedello-red">{product.brand}</p>
          <p className="mt-3 text-4xl font-extrabold text-graphite">{formatPrice(product.price)}</p>
          <p className="mt-2 text-sm font-bold text-emerald-700">{product.availability}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {product.uses.map((use) => (
              <span key={use} className="rounded-full bg-cement px-3 py-1 text-sm font-semibold text-zinc-700">
                {use}
              </span>
            ))}
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <WhatsAppQuoteButton items={[{ product, quantity: 1 }]} customer={defaultQuoteForm} label="Consultar por WhatsApp" />
            <Link to="/productos" className="rounded-full border border-zinc-200 px-5 py-3 text-sm font-bold text-graphite">
              Volver al catalogo
            </Link>
          </div>
        </div>
      </div>
      </main>
    </div>
  );
}

function CategoriesRoutePage() {
  return (
    <div className="min-h-screen bg-[#f7f3eb]">
      <RouteHeader title="Rubros de Prevedello" eyebrow="Rubros">
        Accesos directos para comprar por necesidad de obra, refaccion o equipamiento.
      </RouteHeader>
      <main className="section-band px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
          <Link
            key={category.id}
            to={`/rubros/${slugify(category.name)}`}
            className="premium-card premium-card-hover group rounded-lg p-6 text-left"
          >
            <span className={`grid h-11 w-11 place-items-center rounded-lg text-white ${category.accent}`}>
              <Icon size={21} />
            </span>
            <h3 className="mt-5 text-xl font-extrabold text-graphite">{category.name}</h3>
            <p className="mt-2 min-h-12 text-sm leading-6 text-zinc-600">{category.description}</p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-prevedello-red">
              Ver rubro
              <ArrowRight size={16} className="transition group-hover:translate-x-1" />
            </span>
          </Link>
          );
        })}
      </div>
      </main>
    </div>
  );
}

function CategoryRoutePage() {
  const { slug } = useParams();
  const { productsList } = useCatalogProducts();
  const category = categories.find((item) => slugify(item.name) === slug);
  const categoryProducts = productsList.filter((product) => category && product.category === category.name);

  if (!category) return <Navigate to="/rubros" replace />;

  return (
    <div className="min-h-screen bg-[#f7f3eb]">
      <RouteHeader title={category.name} eyebrow="Rubro">
        {category.description}
      </RouteHeader>
      <main className="section-band px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <ProductGrid productsList={categoryProducts} onAdd={() => undefined} onOpen={() => undefined} />
      </div>
      </main>
    </div>
  );
}

function QuoteRoutePage() {
  return (
    <div className="min-h-screen bg-[#f7f3eb]">
      <RouteHeader title="Cotizacion online" eyebrow="Pedido">
        El flujo principal sigue integrado en la home. Desde cualquier producto podes armar tu pedido y enviarlo por WhatsApp.
      </RouteHeader>
      <main className="section-band px-4 py-12 sm:px-6 lg:px-8">
        <div className="premium-card mx-auto max-w-7xl rounded-lg p-7">
          <h2 className="text-2xl font-extrabold text-graphite">Paso siguiente</h2>
          <p className="mt-2 text-zinc-600">Volver a la home para agregar productos al carrito de cotizacion.</p>
          <Link to="/#productos" className="mt-5 inline-flex rounded-full bg-prevedello-blue px-5 py-3 text-sm font-bold text-white">
            Ir a productos
          </Link>
        </div>
      </main>
    </div>
  );
}

function AdminRoutePage() {
  const [productsList, setProductsList] = useState<Product[]>(() => getStoredProducts());
  const [catalogStatus, setCatalogStatus] = useState("Catalogo local activo.");
  const [catalogSource, setCatalogSource] = useState<"local" | "supabase">("local");
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [crmStatus, setCrmStatus] = useState("CRM local activo.");

  const reloadCatalog = async () => {
    const result = await loadCatalogProducts();
    setProductsList(result.products);
    setCatalogSource(result.source);
    setCatalogStatus(result.message);
  };

  const reloadQuotes = async () => {
    const result = await listQuoteRequests();
    setQuotes(result.quotes);
    setCrmStatus(result.message);
  };

  useEffect(() => {
    void reloadCatalog();
    void reloadQuotes();
  }, []);

  const publishCatalog = async () => {
    const result = await publishProductsToSupabase(productsList);
    setCatalogStatus(result.message);
    return result.message;
  };

  const handleQuoteStatusChange = async (quoteId: string, status: QuoteStatus) => {
    const message = await updateQuoteStatus(quoteId, status);
    setCrmStatus(message);
    await reloadQuotes();
  };

  return (
    <div className="min-h-screen bg-[#f7f3eb]">
      <RouteHeader title="Admin y CRM" eyebrow="Prevedello Market">
        Catalogo, importador CSV y seguimiento comercial inicial.
      </RouteHeader>
      <AdminCatalogPanel
        productsList={productsList}
        onProductsChange={setProductsList}
        catalogStatus={catalogStatus}
        catalogSource={catalogSource}
        onReloadCatalog={reloadCatalog}
        onPublishCatalog={publishCatalog}
      />
      <AdminCrmPanel
        quotes={quotes}
        statusMessage={crmStatus}
        onReload={reloadQuotes}
        onStatusChange={handleQuoteStatusChange}
      />
    </div>
  );
}

function MarketplacePage() {
  const [productsList, setProductsList] = useState<Product[]>(() => getStoredProducts());
  const [catalogStatus, setCatalogStatus] = useState("Catalogo local activo.");
  const [catalogSource, setCatalogSource] = useState<"local" | "supabase">("local");
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [crmStatus, setCrmStatus] = useState("CRM local activo.");
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<QuoteItem[]>([]);
  const [customer, setCustomer] = useState(defaultQuoteForm);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const reloadCatalog = async () => {
    const result = await loadCatalogProducts();
    setProductsList(result.products);
    setCatalogSource(result.source);
    setCatalogStatus(result.message);
  };

  const reloadQuotes = async () => {
    const result = await listQuoteRequests();
    setQuotes(result.quotes);
    setCrmStatus(result.message);
  };

  useEffect(() => {
    void reloadCatalog();
    void reloadQuotes();
  }, []);

  const publishCatalog = async () => {
    const result = await publishProductsToSupabase(productsList);
    setCatalogStatus(result.message);
    return result.message;
  };

  const handleSendQuote = async () => {
    const result = await saveQuoteRequest(customer, cart);
    await reloadQuotes();
    return result.message;
  };

  const handleQuoteStatusChange = async (quoteId: string, status: QuoteStatus) => {
    const message = await updateQuoteStatus(quoteId, status);
    setCrmStatus(message);
    await reloadQuotes();
  };

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return productsList.filter((product) => {
      const matchesQuery =
        !normalizedQuery ||
        [product.name, product.brand, product.category, product.description]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesCategory = activeCategory === "Todos" || product.category === activeCategory;
      const matchesAvailability = !onlyAvailable || product.availability === "Disponible";
      return matchesQuery && matchesCategory && matchesAvailability;
    });
  }, [activeCategory, onlyAvailable, productsList, query]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = (product: Product) => {
    setCart((current) => {
      const exists = current.find((item) => item.product.id === product.id);
      if (exists) {
        return current.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...current, { product, quantity: 1 }];
    });
    setCartOpen(true);
  };

  const increment = (id: string) =>
    setCart((current) =>
      current.map((item) => (item.product.id === id ? { ...item, quantity: item.quantity + 1 } : item)),
    );

  const decrement = (id: string) =>
    setCart((current) =>
      current
        .map((item) => (item.product.id === id ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item))
        .filter((item) => item.quantity > 0),
    );

  const remove = (id: string) => setCart((current) => current.filter((item) => item.product.id !== id));

  const handleCategorySelect = (name: string) => {
    setActiveCategory(name);
    document.getElementById("productos")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen overflow-x-hidden pb-20 font-body text-graphite lg:pb-0">
      <HeaderMarketplace
        query={query}
        onQueryChange={setQuery}
        cartCount={cartCount}
        onCartOpen={() => setCartOpen(true)}
      />
      <HeroSection query={query} onQueryChange={setQuery} />
      <PromoBanner />

      <main>
        <section id="rubros" className="section-anchor section-band px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="section-kicker">Rubros principales</p>
                <h2 className="mt-2 text-4xl font-extrabold text-graphite sm:text-5xl">Compra por necesidad de obra.</h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-zinc-600">
                Accesos pensados para que una persona comun encuentre rapido lo que necesita y pueda pedir ayuda sin friccion.
              </p>
            </div>
            <div className="flex gap-5 overflow-x-auto pb-3 scrollbar-none lg:grid lg:grid-cols-4 lg:overflow-visible">
              {categories.map((category) => (
                <CategoryCard key={category.id} category={category} onSelect={handleCategorySelect} />
              ))}
            </div>
          </div>
        </section>

        <section id="pedido" className="section-anchor bg-white px-4 py-18 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-3">
            {[
              ["1", "Busca o elegi un rubro", "Pisos, ferreteria, pintura, obra gruesa, instalaciones o hogar."],
              ["2", "Agrega productos al pedido", "No hay checkout: es una cotizacion rapida con cantidades y notas."],
              ["3", "Envia por WhatsApp", "El mensaje sale armado para que Prevedello responda con precio y entrega."],
            ].map(([step, title, detail]) => (
              <div key={step} className="premium-card premium-card-hover rounded-lg p-6">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-prevedello-red text-lg font-extrabold text-white shadow-[0_14px_30px_rgba(220,31,38,0.18)]">
                  {step}
                </span>
                <h3 className="mt-4 text-xl font-extrabold text-graphite">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600">{detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="productos" className="section-anchor bg-white px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Breadcrumbs current="Productos destacados" />
            <div className="mb-9 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="section-kicker">Catalogo inicial</p>
                <h2 className="mt-2 text-4xl font-extrabold text-graphite sm:text-5xl">Productos para cotizar hoy.</h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-zinc-600">
                Esta etapa ya permite editar catalogo local e importar CSV. La estructura queda
                lista para conectar categorias, productos, marcas y pedidos a Supabase cuando lo definamos.
              </p>
            </div>
            <div className="grid gap-7 lg:grid-cols-[300px_1fr]">
              <FilterSidebar
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
                onlyAvailable={onlyAvailable}
                onOnlyAvailableChange={setOnlyAvailable}
              />
              <div>
                {filteredProducts.length > 0 ? (
                  <ProductGrid productsList={filteredProducts} onAdd={addToCart} onOpen={setSelectedProduct} />
                ) : (
                  <div className="premium-card rounded-lg border-dashed p-10 text-center">
                    <ClipboardList className="mx-auto text-prevedello-red" size={38} />
                    <h3 className="mt-3 text-2xl font-extrabold text-graphite">No encontramos productos.</h3>
                    <p className="mt-2 text-zinc-600">Proba con otro rubro o envia una consulta general.</p>
                    <div className="mt-5">
                      <WhatsAppQuoteButton items={[]} customer={customer} label="Consultar disponibilidad" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <BrandStrip />

        <ProfessionalCTA />

        <section id="calculadoras" className="section-anchor section-band px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="section-kicker">Calculadoras</p>
                <h2 className="mt-2 text-4xl font-extrabold text-graphite sm:text-5xl">Estimaciones para comprar mejor.</h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-zinc-600">
                Resultados orientativos para iniciar la cotizacion. El equipo puede ajustar cantidades segun medidas y uso real.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {calculators.map((calculator) => (
                <MaterialCalculatorCard key={calculator.id} calculator={calculator} />
              ))}
            </div>
          </div>
        </section>

        <section className="bg-prevedello-blue px-4 py-20 text-white sm:px-6 lg:px-8">
          <div className="blueprint-panel mx-auto grid max-w-7xl gap-7 rounded-lg border border-white/14 p-6 lg:grid-cols-[1fr_auto] lg:items-center lg:p-8">
            <div>
              <p className="text-sm font-bold uppercase text-white/65">Siguiente paso</p>
              <h2 className="mt-2 max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl">
                Prevedello Market ya tiene cotizacion, CSV y admin local para validar operacion.
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-white/72">
                El proximo salto es conectar Supabase con productos reales, pedidos persistentes,
                usuarios internos y fotos definitivas por rubro.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-extrabold text-prevedello-blue transition hover:scale-[1.03]"
              >
                Abrir pedido
                <ShoppingCart size={17} />
              </button>
              <WhatsAppQuoteButton items={cart} customer={customer} />
            </div>
          </div>
        </section>

        <AdminCatalogPanel
          productsList={productsList}
          onProductsChange={setProductsList}
          catalogStatus={catalogStatus}
          catalogSource={catalogSource}
          onReloadCatalog={reloadCatalog}
          onPublishCatalog={publishCatalog}
        />
        <AdminCrmPanel
          quotes={quotes}
          statusMessage={crmStatus}
          onReload={reloadQuotes}
          onStatusChange={handleQuoteStatusChange}
        />
      </main>

      <QuoteCart
        open={cartOpen}
        items={cart}
        customer={customer}
        onCustomerChange={setCustomer}
        onClose={() => setCartOpen(false)}
        onIncrement={increment}
        onDecrement={decrement}
        onRemove={remove}
        onSendQuote={handleSendQuote}
      />
      <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onAdd={addToCart} />
      <MobileBottomNav cartCount={cartCount} onCartOpen={() => setCartOpen(true)} />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MarketplacePage />} />
      <Route path="/productos" element={<ProductsRoutePage />} />
      <Route path="/productos/:slug" element={<ProductRoutePage />} />
      <Route path="/rubros" element={<CategoriesRoutePage />} />
      <Route path="/rubros/:slug" element={<CategoryRoutePage />} />
      <Route path="/cotizacion" element={<QuoteRoutePage />} />
      <Route path="/admin" element={<AdminRoutePage />} />
      <Route path="/admin/*" element={<AdminRoutePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
