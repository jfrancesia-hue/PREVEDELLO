import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { Link, Navigate, Route, Routes, useParams } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  BarChart3,
  BadgeCheck,
  Boxes,
  Calculator,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronRight,
  CloudUpload,
  ClipboardList,
  ContactRound,
  Database,
  FileSpreadsheet,
  LogIn,
  ListTodo,
  MessageCircle,
  Minus,
  PackageCheck,
  Plus,
  RotateCcw,
  Save,
  Search,
  Settings,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Tags,
  Upload,
  Users,
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
import { businessConfig, getWhatsAppUrl } from "./config/business";
import { getStoredProducts, parseProductsCsv, resetStoredProducts, saveStoredProducts } from "./lib/catalogStorage";
import { loadCatalogProducts, publishProductsToSupabase } from "./lib/catalogRepository";
import { isSupabaseConfigured, supabase } from "./lib/supabaseClient";
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

type InternalAuthMode = "supabase" | "demo";

const DEMO_CRM_ACCESS_CODE = "prevedello-demo";
const DEMO_CRM_EMAIL = "demo@prevedello.com";
const DEMO_CRM_STORAGE_KEY = "prevedello-crm-demo-session";

const formatPrice = (price?: number) =>
  price
    ? new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
      }).format(price)
    : "Consultar precio";

const getAvailabilityClass = (availability: string) => {
  const normalized = availability.toLowerCase();
  if (normalized.includes("disponible")) return "availability-badge--disponible";
  if (normalized.includes("pedido")) return "availability-badge--pedido";
  return "availability-badge--confirmar";
};

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

const heroMetrics = [
  ["+8", "rubros"],
  ["24/7", "pedido listo"],
  ["1970", "Catamarca"],
] as const;

const quickNeeds = ["Cemento", "Pintura", "Ferretería", "Sanitarios", "Pisos"] as const;

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
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("inicio");

  useEffect(() => {
    const sectionIds = ["inicio", "rubros", "productos", "empresas", "calculadoras", "pedido"];

    const updateHeader = () => {
      setIsScrolled(window.scrollY > 28);

      let current = "inicio";
      for (const id of sectionIds) {
        const element = document.getElementById(id);
        if (element && element.getBoundingClientRect().top <= 150) current = id;
      }

      setActiveSection(current);
    };

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  const navItems = [
    ["rubros", "Rubros"],
    ["productos", "Productos"],
    ["empresas", "Empresas"],
    ["calculadoras", "Calculadoras"],
  ];

  return (
    <header className={`pv-site-header sticky top-0 z-50 px-3 pt-3 sm:px-5 ${isScrolled ? "is-scrolled" : ""}`}>
      <div className="ds-header mx-auto flex h-14 max-w-7xl items-center gap-2 px-2 py-1 lg:h-16 lg:gap-3 lg:px-3">
        <a href="#inicio" className="shrink-0" aria-label="Ir al inicio">
          <LogoMark compact />
        </a>
        <div className="hidden min-w-0 flex-1 lg:block lg:max-w-sm xl:max-w-md">
          <SearchBar value={query} onChange={onQueryChange} compact />
        </div>
        <nav className="hidden items-center gap-4 text-sm font-semibold text-white/75 lg:flex xl:gap-6">
          {navItems.map(([id, label]) => (
            <a key={id} className={`nav-link ${activeSection === id ? "is-active" : ""}`} href={`#${id}`}>
              {label}
            </a>
          ))}
          <Link
            className="nav-link nav-link-app inline-flex items-center gap-1.5 px-3 py-1.5"
            to="/app"
          >
            <LogIn size={15} />
            Equipo
          </Link>
        </nav>
        <a
          href={makeWhatsAppHref([], defaultQuoteForm)}
          target="_blank"
          rel="noreferrer"
          className="ds-button-whatsapp hidden items-center gap-2 px-4 py-2 text-sm md:flex"
        >
          <MessageCircle size={17} />
          WhatsApp
        </a>
        <button
          type="button"
          onClick={onCartOpen}
          className="relative grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-btn)] bg-prevedello-red text-white shadow-[0_14px_30px_rgba(220,31,38,0.24)] transition active:scale-[0.97]"
          aria-label="Abrir pedido"
        >
          <ShoppingCart size={20} />
          {cartCount > 0 && (
            <span className="cart-badge absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-[var(--radius-badge)] bg-prevedello-red px-1 text-xs font-bold">
              {cartCount}
            </span>
          )}
        </button>
        <Link
          to="/app"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-btn)] border border-white/20 text-white transition hover:border-prevedello-red/60 hover:text-white lg:hidden"
          aria-label="Abrir app interna"
          title="App interna"
        >
          <LogIn size={20} />
        </Link>
      </div>
      <div className="mobile-search-row mx-auto mt-2 max-w-7xl lg:hidden">
        <SearchBar value={query} onChange={onQueryChange} compact />
      </div>
      <div className="header-motion-line mx-auto mt-2 max-w-7xl" />
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
      className={`ds-input relative flex min-w-0 items-center gap-2 overflow-hidden px-4 transition ${
        compact ? "h-11" : "h-16"
      }`}
    >
      <Search className="relative z-10 shrink-0 text-prevedello-red" size={compact ? 19 : 23} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="¿Qué necesitás para tu obra?"
        className="min-w-0 flex-1 bg-transparent text-base font-bold text-graphite outline-none placeholder:text-zinc-400 sm:text-lg"
      />
      <span className="hidden shrink-0 rounded-[var(--radius-badge)] bg-prevedello-red px-3 py-1 text-xs font-bold uppercase text-white sm:inline">
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
      className="ds-button-whatsapp inline-flex items-center justify-center gap-2 px-5 py-3 text-sm"
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
    if (window.innerWidth <= 768) return;

    const context = gsap.context(() => {
      gsap.fromTo(
        logoRef.current,
        { y: 18, scale: 0.94, opacity: 0 },
        { y: 0, scale: 1, opacity: 1, duration: 0.9, ease: "power3.out" },
      );

      gsap.fromTo(
        panelRef.current,
        { y: 36, opacity: 0.86 },
        {
          y: 0,
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: panelRef.current,
            start: "top 92%",
            end: "top 55%",
            scrub: true,
          },
        },
      );

      gsap.to(logoRef.current, {
        y: -18,
        scale: 0.97,
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
      className="blueprint-dense blueprint-parallax relative overflow-hidden text-white"
    >
      <div className="absolute inset-0">
        <video
          src="/assets/prevedello-hero.mp4"
          className="h-full w-full scale-[1.04] object-cover opacity-38"
          muted
          playsInline
          autoPlay
          loop
          preload="metadata"
        />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(5,13,31,0.96),rgba(9,59,145,0.66),rgba(5,13,31,0.9))]" />
        <div className="industrial-grid absolute inset-0 opacity-22 mix-blend-screen" />
        <div className="hero-signature-orbit absolute right-[-18vw] top-[-18vw] hidden h-[54vw] w-[54vw] rounded-full border border-white/10 lg:block" />
        <div className="hero-red-scan absolute left-0 top-24 h-px w-full opacity-70" />
        <div className="blueprint-ruler absolute inset-x-0 bottom-0 h-28 opacity-55" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col justify-center px-4 pb-28 pt-8 sm:px-6 sm:pt-10 lg:min-h-[calc(100svh-24px)] lg:px-8 lg:pb-16 lg:pt-12 xl:pt-14">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_0.88fr] xl:gap-16">
          <div className="hero-copy premium-reveal">
            <div className="mb-6 overflow-hidden rounded-[var(--radius-modal)] border border-white/16 bg-white/8 shadow-[0_28px_80px_rgba(0,0,0,0.42)] lg:hidden">
              <picture>
                <source media="(max-width: 767px)" srcSet="/hero-mobile.png" />
                <img
                  src="/hero-desktop.png"
                  alt="Prevedello Market — mostrador digital de construcción"
                  className="aspect-[4/3] w-full object-cover object-center"
                  loading="eager"
                  fetchPriority="high"
                />
              </picture>
            </div>
            <div className="hero-kicker mb-5 inline-flex items-center gap-2 rounded-[var(--radius-badge)] border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white/86 backdrop-blur-md">
              <Sparkles size={16} />
              Corralón, ferretería y hogar en Catamarca
            </div>
            <h1 className="hero-heading max-w-4xl font-extrabold text-white">
              Tu mostrador digital para resolver la obra.
            </h1>
            <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-white/78 sm:text-xl">
              Buscá materiales, armá tu pedido y cotizá en minutos.
              Atención local en Catamarca, respuesta humana garantizada.
            </p>
            <div className="mt-6 grid max-w-2xl grid-cols-3 gap-2 sm:gap-3">
              {heroMetrics.map(([value, label]) => (
                <div key={value} className="metric-tile rounded-[var(--radius-card)] border border-white/14 bg-white/10 p-3 backdrop-blur-md">
                  <p className="text-lg font-extrabold text-white sm:text-2xl">{value}</p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-white/55">{label}</p>
                </div>
              ))}
            </div>
            <div className="hero-search-console relative z-30 mt-6 max-w-xl rounded-[var(--radius-card)] border border-white/16 bg-white/10 p-2 backdrop-blur-md">
              <SearchBar value={query} onChange={onQueryChange} />
              <div className="mt-3 flex flex-wrap gap-2 px-1 pb-1">
                {quickNeeds.map((need) => (
                  <button
                    key={need}
                    type="button"
                    onClick={() => onQueryChange(need)}
                    className="search-chip rounded-[var(--radius-badge)] border border-white/14 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/78 transition hover:border-white/35 hover:bg-white/16"
                  >
                    {need}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#pedido"
                className="ds-button-red inline-flex items-center gap-2 px-6 py-3 text-sm"
              >
                Armar cotización
                <ArrowRight size={17} />
              </a>
              <a
                href="#productos"
                className="ds-button-outline inline-flex items-center gap-2 px-6 py-3 text-sm"
              >
                Ver catálogo
                <ArrowRight size={17} />
              </a>
            </div>
          </div>
          <div className="hero-visual-stage premium-reveal relative mx-auto hidden h-[min(42vw,560px)] w-full max-w-xl place-items-center lg:grid">
            <div className="absolute inset-4 bg-prevedello-red/24 blur-3xl" />
            <div className="hero-visual-card relative z-10 overflow-hidden rounded-[var(--radius-modal)] border border-white/18 bg-white/8 shadow-[0_34px_90px_rgba(0,0,0,0.52)]">
              <picture>
                <source media="(max-width: 767px)" srcSet="/hero-mobile.png" />
                <img
                  ref={logoRef}
                  src="/hero-desktop.png"
                  alt="Prevedello Market — mostrador digital de construcción"
                  className="h-full min-h-[480px] w-full object-cover object-center"
                  loading="eager"
                  fetchPriority="high"
                />
              </picture>
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(5,13,31,.28))]" />
              <div className="hero-technical-label absolute bottom-4 left-4 right-4 border-l-2 border-prevedello-red bg-black/38 p-4 backdrop-blur-md">
                <p className="font-heading text-xl font-bold uppercase text-white">Mostrador técnico activo</p>
                <p className="mt-1 text-sm text-[var(--pv-text-secondary)]">Obra, hogar y cotización en una sola ficha.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        ref={panelRef}
        className="archive-panel premium-reveal relative z-20 scroll-mt-44 border-y border-white/10 bg-[var(--pv-surface-2)] px-4 py-14 pt-40 text-white shadow-[0_-18px_70px_rgba(9,59,145,0.28)] sm:px-6 sm:pt-36 lg:scroll-mt-32 lg:px-8 lg:py-10 lg:pt-10"
      >
        <div className="mx-auto grid max-w-7xl gap-7 lg:grid-cols-[0.62fr_1.38fr] lg:items-center">
          <div className="flex flex-col justify-between gap-6">
            <div>
              <p className="text-sm font-bold uppercase text-prevedello-red">Mostrador vivo</p>
              <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">
                Productos, acopio y entregas en una experiencia de compra.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-white/62">
              El hero abre la marca y el panel baja al mundo comercial: cada rubro está pensado
              para buscar, sumar al pedido y cotizar sin perder tiempo.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 lg:gap-5">
            {[
              { src: "/assets/prevedello-todo.mp4", label: "Stock ordenado", position: "55% 32%" },
              { src: "/assets/prevedello-envios.mp4", label: "Entregas cuidadas", position: "50% 50%" },
              { src: "/assets/prevedello-acopio.mp4", label: "Acopio para obra", position: "52% 28%" },
            ].map(({ src, label, position }) => (
              <div key={src} className="operation-clip bp-card overflow-hidden rounded-lg border border-white/10 bg-white/8">
                <video
                  src={src}
                  className="aspect-[9/16] max-h-[480px] w-full bg-[var(--pv-surface-0)] object-cover opacity-100"
                  style={{ objectPosition: position }}
                  muted
                  playsInline
                  autoPlay
                  loop
                  preload="auto"
                  poster="/hero-mobile.png"
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
      <div className="blueprint-panel mx-auto flex max-w-7xl flex-col gap-6 rounded-[1.5rem] border border-white/16 p-6 shadow-[0_24px_70px_rgba(9,59,145,0.28)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-prevedello-red shadow-[0_16px_35px_rgba(220,31,38,0.26)]">
            <BadgeCheck size={22} />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-white/60">Compra inteligente</p>
            <h2 className="text-2xl font-extrabold leading-tight">Armá el pedido como una lista de obra y mandalo listo por WhatsApp.</h2>
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

function OperationsDeck() {
  const metrics = [
    ["1970", "compromiso comercial"],
    ["24/7", "pedido listo para responder"],
    ["8", "rubros operativos"],
  ];

  const media = [
    { src: "/assets/prevedello-todo.mp4", label: "Salon y mostrador", position: "55% 32%" },
    { src: "/assets/prevedello-envios.mp4", label: "Logistica de entrega", position: "50% 50%" },
    { src: "/assets/prevedello-acopio.mp4", label: "Acopio de obra", position: "52% 28%" },
  ];

  return (
    <section className="operations-band premium-reveal scroll-mt-44 px-4 py-20 pt-40 text-white sm:px-6 sm:pt-36 lg:scroll-mt-32 lg:px-8 lg:pt-20">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
        <div className="relative">
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-white/66">Sistema Prevedello</p>
          <h2 className="mt-4 max-w-3xl text-4xl font-extrabold leading-tight text-white sm:text-5xl">
            El movimiento real del negocio también se ve.
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-8 text-white/82">
            Videos de mostrador, logística y acopio visibles: la web tiene que mostrar que Prevedello
            no es solo catálogo, es operación real detrás de cada cotización.
          </p>
          <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
            {metrics.map(([value, label]) => (
              <div key={label} className="border-l-2 border-prevedello-red bg-white/8 px-4 py-4">
                <p className="text-3xl font-extrabold">{value}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-white/55">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative grid gap-5 sm:grid-cols-3 lg:items-start">
          <div className="hidden text-xs font-extrabold uppercase tracking-[0.32em] text-white/45 lg:absolute lg:-left-8 lg:top-0 lg:block lg:h-full">
            <span className="rail-label">obra / hogar / industria</span>
          </div>
          {media.map(({ src, label, position }) => (
            <div
              key={src}
              className="overflow-hidden rounded-[var(--radius-card)] border border-white/18 bg-white/8 shadow-[0_28px_80px_rgba(0,0,0,0.38)]"
            >
              <video
                src={src}
                className="aspect-[9/16] max-h-[520px] w-full bg-[var(--pv-surface-0)] object-cover opacity-100"
                style={{ objectPosition: position }}
                muted
                playsInline
                autoPlay
                loop
                preload="auto"
                poster="/hero-mobile.png"
              />
              <div className="flex items-center justify-between border-t border-white/10 bg-[var(--pv-surface-2)] px-5 py-3">
                <p className="text-sm font-extrabold">{label}</p>
                <span className="text-xs font-bold uppercase text-white/50">PaP</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryCard({
  category,
  index,
  onSelect,
}: {
  category: Category;
  index: number;
  onSelect: (name: string) => void;
}) {
  const Icon = category.icon;

  return (
    <button
      type="button"
      onClick={() => onSelect(category.name)}
      className="rubro-card blueprint-card group relative min-w-[250px] overflow-hidden p-6 text-left"
    >
      <span className="absolute inset-x-0 top-0 h-1 bg-prevedello-red" />
      <span className="absolute right-5 top-5 text-5xl font-extrabold leading-none text-prevedello-blue/8">
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className={`grid h-12 w-12 place-items-center rounded-[var(--radius-btn)] text-white shadow-[0_14px_30px_rgba(9,59,145,0.16)] ${category.accent}`}>
        <Icon size={21} />
      </span>
      <h3 className="relative mt-6 font-heading text-xl font-bold uppercase text-white">{category.name}</h3>
      <p className="mt-2 min-h-12 text-sm leading-6 text-[var(--pv-text-secondary)]">{category.description}</p>
      <span className="relative mt-5 inline-flex items-center gap-2 text-sm font-bold text-[var(--pv-text-secondary)] transition group-hover:text-white">
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
    <aside className="filter-panel rounded-lg p-5 lg:sticky lg:top-28">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="font-extrabold text-white">Filtros</h3>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-prevedello-red">
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
                : "bg-white/6 text-[var(--pv-text-secondary)] ring-1 ring-white/10 hover:bg-white/10 hover:text-white"
            }`}
          >
            {category}
            {activeCategory === category && <Check size={15} />}
          </button>
        ))}
      </div>
      <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-lg bg-white/6 p-4 text-sm font-bold text-white/78">
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
  const categoryMeta = categories.find((category) => category.name === product.category);
  const CategoryIcon = categoryMeta?.icon;

  if (product.imageUrl) {
    return (
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-[var(--pv-surface-0)]">
        <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover brightness-[1.04] saturate-[0.95] transition duration-500 group-hover:scale-[1.03]" loading="lazy" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,13,31,0.02),rgba(5,13,31,0.54))]" />
        {CategoryIcon && (
          <span className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-[var(--radius-btn)] border border-white/35 bg-white/90 text-prevedello-red shadow-[0_14px_30px_rgba(0,0,0,0.24)] backdrop-blur-md">
            <CategoryIcon size={20} />
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="text-lg font-extrabold leading-5 text-white drop-shadow">{product.category}</p>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-white/72">Foto referencial para cotización</p>
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
    <article className="product-card blueprint-card flex h-full flex-col p-4">
      <button type="button" onClick={() => onOpen(product)} className="group block w-full text-left">
        <ProductVisual product={product} />
        <div className="px-1 pb-2 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase text-prevedello-red">{product.brand}</p>
              <h3 className="mt-1 text-xl font-extrabold leading-6 text-white">{product.name}</h3>
            </div>
            <span className="shrink-0 rounded-[var(--radius-badge)] border border-white/10 bg-white/8 px-3 py-1 text-xs font-bold text-[var(--pv-text-secondary)]">
              {product.unit}
            </span>
          </div>
          <p className="mt-3 min-h-12 text-sm leading-6 text-white/78">{product.description}</p>
          {(product.sku || product.stockNote) && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-zinc-500">
              {product.sku && <span className="rounded-[var(--radius-badge)] bg-white/8 px-2 py-1 text-[var(--pv-text-secondary)]">SKU {product.sku}</span>}
              {product.stockNote && <span className="rounded-[var(--radius-badge)] bg-white/8 px-2 py-1 text-[var(--pv-text-secondary)]">{product.stockNote}</span>}
            </div>
          )}
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
            <div>
              <p className="font-mono text-xl font-medium text-white">{formatPrice(product.price)}</p>
              <p className={`availability-badge mt-1 ${getAvailabilityClass(product.availability)}`}>
                <span className="dot" />
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
          className="ds-button btn-agregar inline-flex items-center justify-center gap-2 px-4 py-3 text-sm"
        >
          <Plus size={17} />
          Agregar
        </button>
        <a
          href={makeWhatsAppHref([{ product, quantity: 1 }], defaultQuoteForm)}
          target="_blank"
          rel="noreferrer"
          className="grid h-12 w-12 place-items-center rounded-[var(--radius-btn)] border border-[rgba(37,211,102,0.4)] bg-transparent text-[var(--pv-whatsapp)] transition hover:bg-[rgba(37,211,102,0.1)]"
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
    <section className="premium-reveal supplier-strip overflow-hidden py-14">
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
              className="supplier-chip grid min-w-[180px] place-items-center rounded-lg px-5 py-5 text-center text-sm font-extrabold text-white"
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
    <article className="calculator-card rounded-lg p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-lg bg-prevedello-red text-white shadow-[0_14px_30px_rgba(220,31,38,0.18)]">
          <Icon size={20} />
        </span>
        <div>
          <h3 className="text-lg font-extrabold text-white">{calculator.title}</h3>
          <p className="text-sm text-[var(--pv-text-secondary)]">{calculator.description}</p>
        </div>
      </div>
      <label className="mt-5 block text-sm font-bold text-white/78">
        Superficie estimada
        <input
          type="number"
          min={1}
          value={meters}
          onChange={(event) => setMeters(Number(event.target.value))}
          className="mt-2 h-12 w-full rounded-[var(--radius-input)] border border-white/14 bg-white/8 px-3 text-lg font-extrabold text-white outline-none focus:border-prevedello-red"
        />
      </label>
      <div className="mt-5 rounded-lg border border-white/10 bg-white/8 p-4">
        <p className="text-sm font-semibold text-[var(--pv-text-secondary)]">Resultado orientativo</p>
        <p className="mt-1 text-2xl font-extrabold text-white">
          {result} {calculator.unit}
        </p>
      </div>
    </article>
  );
}

function ProfessionalCTA() {
  return (
    <section id="empresas" className="premium-reveal section-anchor enterprise-band px-4 py-20 text-white sm:px-6 lg:px-8">
      <div className="enterprise-panel blueprint-panel mx-auto grid max-w-7xl gap-10 rounded-lg border border-white/14 p-6 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:p-8">
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
              <div key={item.label} className="service-tile rounded-lg border border-white/12 bg-white/8 p-6 shadow-[0_18px_40px_rgba(9,59,145,0.18)]">
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

type InternalModule =
  | "dashboard"
  | "productos"
  | "cotizaciones"
  | "clientes"
  | "crm"
  | "tareas"
  | "rubros"
  | "marcas"
  | "configuracion";

const internalModules: { id: InternalModule; label: string; icon: ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <BarChart3 size={18} /> },
  { id: "productos", label: "Productos", icon: <Boxes size={18} /> },
  { id: "cotizaciones", label: "Cotizaciones", icon: <ClipboardList size={18} /> },
  { id: "clientes", label: "Clientes", icon: <Users size={18} /> },
  { id: "crm", label: "CRM", icon: <ContactRound size={18} /> },
  { id: "tareas", label: "Tareas", icon: <ListTodo size={18} /> },
  { id: "rubros", label: "Rubros", icon: <Tags size={18} /> },
  { id: "marcas", label: "Marcas", icon: <BadgeCheck size={18} /> },
  { id: "configuracion", label: "Config", icon: <Settings size={18} /> },
];

const openQuoteStatuses: QuoteStatus[] = ["nuevo", "contactado", "cotizacion_enviada", "en_negociacion", "sin_respuesta"];

const estimateQuoteValue = (quote: QuoteRecord, productsList: Product[]) =>
  quote.items.reduce((total, item) => {
    const product = productsList.find((candidate) => candidate.id === item.productId || candidate.name === item.productName);
    return total + (product?.price ?? 0) * item.quantity;
  }, 0);

const getTopCategory = (quotes: QuoteRecord[], productsList: Product[]) => {
  const counts = new Map<string, number>();
  quotes.forEach((quote) => {
    quote.items.forEach((item) => {
      const category = productsList.find((product) => product.id === item.productId || product.name === item.productName)?.category;
      if (category) counts.set(category, (counts.get(category) ?? 0) + item.quantity);
    });
  });

  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Sin datos";
};

function InternalDashboard({
  productsList,
  quotes,
  onModuleChange,
}: {
  productsList: Product[];
  quotes: QuoteRecord[];
  onModuleChange: (module: InternalModule) => void;
}) {
  const newQuotes = quotes.filter((quote) => quote.status === "nuevo").length;
  const pendingQuotes = quotes.filter((quote) => openQuoteStatuses.includes(quote.status)).length;
  const wonQuotes = quotes.filter((quote) => quote.status === "ganado").length;
  const quotedValue = quotes.reduce((total, quote) => total + estimateQuoteValue(quote, productsList), 0);
  const topCategory = getTopCategory(quotes, productsList);
  const productsToReview = productsList.filter((product) => product.availability !== "Disponible").length;

  const cards = [
    { label: "Consultas nuevas", value: newQuotes, detail: "Ingresos sin primer contacto", icon: <MessageCircle size={20} /> },
    { label: "Pendientes", value: pendingQuotes, detail: "Cotizaciones en proceso", icon: <CalendarCheck size={20} /> },
    { label: "Ganadas", value: wonQuotes, detail: "Ventas marcadas como cierre", icon: <CheckCircle2 size={20} /> },
    { label: "Valor estimado", value: quotedValue ? formatPrice(quotedValue) : "A cotizar", detail: "Solo productos con precio", icon: <BarChart3 size={20} /> },
  ];

  return (
    <section className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <article key={card.label} className="premium-card rounded-lg p-5">
              <div className="flex items-start justify-between gap-4">
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-prevedello-blue text-white">{card.icon}</span>
                <span className="rounded-full bg-cement px-3 py-1 text-xs font-extrabold uppercase text-zinc-600">Hoy</span>
              </div>
              <p className="mt-5 text-sm font-bold uppercase text-zinc-500">{card.label}</p>
              <p className="mt-2 text-3xl font-extrabold text-graphite">{card.value}</p>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{card.detail}</p>
            </article>
          ))}
        </div>

        <div className="mt-7 grid gap-7 xl:grid-cols-[1.1fr_0.9fr]">
          <article className="premium-card rounded-lg p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="section-kicker">Operacion comercial</p>
                <h2 className="mt-2 text-3xl font-extrabold text-graphite">Pipeline de cotizaciones</h2>
              </div>
              <button
                type="button"
                onClick={() => onModuleChange("cotizaciones")}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-prevedello-blue px-4 py-2 text-sm font-bold text-white"
              >
                Ver cotizaciones
                <ArrowRight size={16} />
              </button>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {Object.entries(quoteStatusLabels).map(([status, label]) => {
                const count = quotes.filter((quote) => quote.status === status).length;
                return (
                  <div key={status} className="rounded-lg border border-prevedello-blue/10 bg-cement/35 p-4">
                    <p className="text-sm font-extrabold text-graphite">{label}</p>
                    <div className="mt-3 h-2 rounded-full bg-white">
                      <div
                        className="h-2 rounded-full bg-prevedello-red"
                        style={{ width: `${quotes.length ? Math.max(12, (count / quotes.length) * 100) : 0}%` }}
                      />
                    </div>
                    <p className="mt-2 text-2xl font-extrabold text-prevedello-blue">{count}</p>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="premium-card rounded-lg p-6">
            <p className="section-kicker">Prioridades</p>
            <h2 className="mt-2 text-3xl font-extrabold text-graphite">Para resolver esta semana</h2>
            <div className="mt-6 space-y-3">
              {[
                { title: "Responder consultas nuevas", detail: `${newQuotes} leads esperan primer contacto`, module: "crm" as InternalModule },
                { title: "Confirmar stock", detail: `${productsToReview} productos estan a confirmar o bajo pedido`, module: "productos" as InternalModule },
                { title: "Rubro mas consultado", detail: topCategory, module: "rubros" as InternalModule },
              ].map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => onModuleChange(item.module)}
                  className="flex w-full items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-white p-4 text-left transition hover:border-prevedello-red/35"
                >
                  <span>
                    <span className="block text-sm font-extrabold text-graphite">{item.title}</span>
                    <span className="mt-1 block text-sm text-zinc-600">{item.detail}</span>
                  </span>
                  <ChevronRight className="text-prevedello-red" size={18} />
                </button>
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function InternalClientsPanel({ quotes }: { quotes: QuoteRecord[] }) {
  const customers = quotes.length
    ? quotes.map((quote) => ({
        id: quote.id,
        name: quote.customerName,
        phone: quote.customerPhone,
        location: quote.customerLocation,
        status: quoteStatusLabels[quote.status],
        lastContact: quote.createdAt,
        quotes: 1,
      }))
    : [
        {
          id: "cliente-demo-obra",
          name: "Constructora del Valle",
          phone: "383 400-0000",
          location: "San Fernando del Valle",
          status: "Cotizacion enviada",
          lastContact: new Date().toISOString(),
          quotes: 3,
        },
        {
          id: "cliente-demo-hogar",
          name: "Refaccion hogar norte",
          phone: "383 401-0000",
          location: "Valle Viejo",
          status: "Nuevo",
          lastContact: new Date().toISOString(),
          quotes: 1,
        },
      ];

  return (
    <section className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="section-kicker">Clientes</p>
          <h2 className="mt-2 text-4xl font-extrabold text-graphite">Base comercial y seguimiento.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
            Vista preparada para historial, notas internas, vendedor asignado y proxima accion.
          </p>
        </div>
        <div className="premium-card overflow-hidden rounded-lg">
          <div className="grid gap-0 divide-y divide-zinc-200">
            {customers.map((customer) => (
              <article key={customer.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_180px_180px] lg:items-center">
                <div>
                  <h3 className="text-xl font-extrabold text-graphite">{customer.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-zinc-600">
                    {customer.phone} · {customer.location}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-zinc-500">Estado</p>
                  <p className="mt-1 font-extrabold text-prevedello-blue">{customer.status}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-zinc-500">Cotizaciones</p>
                  <p className="mt-1 font-extrabold text-graphite">{customer.quotes}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function InternalCrmBoard({ quotes }: { quotes: QuoteRecord[] }) {
  return (
    <section className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="section-kicker">CRM</p>
          <h2 className="mt-2 text-4xl font-extrabold text-graphite">Pipeline visual por estado.</h2>
        </div>
        <div className="grid gap-4 overflow-x-auto pb-3 lg:grid-cols-4">
          {openQuoteStatuses.map((status) => {
            const columnQuotes = quotes.filter((quote) => quote.status === status);
            return (
              <article key={status} className="min-w-[260px] rounded-lg border border-prevedello-blue/10 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-extrabold text-graphite">{quoteStatusLabels[status]}</h3>
                  <span className="rounded-full bg-cement px-3 py-1 text-xs font-extrabold text-zinc-600">{columnQuotes.length}</span>
                </div>
                <div className="mt-4 space-y-3">
                  {(columnQuotes.length ? columnQuotes : [{ id: `${status}-empty`, customerName: "Sin leads", customerLocation: "Esperando cotizaciones", customerPhone: "", items: [] } as Partial<QuoteRecord>]).map((quote) => (
                    <div key={quote.id} className="rounded-lg border border-zinc-200 bg-[#f7f3eb] p-4">
                      <p className="font-extrabold text-graphite">{quote.customerName}</p>
                      <p className="mt-1 text-sm text-zinc-600">{quote.customerLocation}</p>
                      <p className="mt-3 text-xs font-bold uppercase text-zinc-500">
                        {(quote.items ?? []).length ? `${quote.items?.length} items` : "Sin actividad"}
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function InternalTasksPanel({ quotes, productsList }: { quotes: QuoteRecord[]; productsList: Product[] }) {
  const tasks = [
    ...quotes.slice(0, 4).map((quote) => ({
      title: `Llamar a ${quote.customerName}`,
      detail: `${quote.customerPhone} · ${quote.customerLocation}`,
      type: "Recontactar",
      due: "Hoy",
    })),
    ...productsList
      .filter((product) => product.availability !== "Disponible")
      .slice(0, 3)
      .map((product) => ({
        title: `Confirmar stock de ${product.name}`,
        detail: `${product.brand} · ${product.category}`,
        type: "Stock",
        due: "24 hs",
      })),
    {
      title: "Cargar fotos reales de productos destacados",
      detail: "Mejora conversion del marketplace publico",
      type: "Catalogo",
      due: "Semana",
    },
  ];

  return (
    <section className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="section-kicker">Tareas</p>
          <h2 className="mt-2 text-4xl font-extrabold text-graphite">Agenda comercial del equipo.</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {tasks.map((task) => (
            <article key={`${task.title}-${task.due}`} className="premium-card grid gap-4 rounded-lg p-5 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="text-xs font-extrabold uppercase text-prevedello-red">{task.type}</p>
                <h3 className="mt-2 text-xl font-extrabold text-graphite">{task.title}</h3>
                <p className="mt-1 text-sm text-zinc-600">{task.detail}</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-cement px-4 py-2 text-sm font-extrabold text-prevedello-blue">
                <CalendarCheck size={16} />
                {task.due}
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function InternalTaxonomyPanel({ productsList, view }: { productsList: Product[]; view: "rubros" | "marcas" }) {
  const rows =
    view === "rubros"
      ? categories.map((category) => ({
          name: category.name,
          description: category.description,
          count: productsList.filter((product) => product.category === category.name).length,
        }))
      : brands.map((brand) => ({
          name: brand,
          description: "Marca preparada para logo, descripcion y visibilidad.",
          count: productsList.filter((product) => product.brand === brand).length,
        }));

  return (
    <section className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="section-kicker">{view === "rubros" ? "Rubros" : "Marcas"}</p>
          <h2 className="mt-2 text-4xl font-extrabold text-graphite">
            {view === "rubros" ? "Orden visual del catalogo." : "Marcas visibles del marketplace."}
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <article key={row.name} className="premium-card rounded-lg p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-extrabold text-graphite">{row.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">{row.description}</p>
                </div>
                <span className="rounded-full bg-prevedello-blue px-3 py-1 text-sm font-extrabold text-white">{row.count}</span>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase text-emerald-700">Visible</span>
                <span className="rounded-full bg-cement px-3 py-1 text-xs font-bold uppercase text-zinc-600">Orden editable</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function InternalSettingsPanel({ authMode, userEmail }: { authMode: InternalAuthMode; userEmail: string }) {
  return (
    <section className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="section-kicker">Configuracion</p>
          <h2 className="mt-2 text-4xl font-extrabold text-graphite">Estado de produccion.</h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {[
            { label: "Sesion", value: userEmail, detail: authMode === "demo" ? "Modo demo local" : "Supabase Auth activo" },
            { label: "Supabase", value: isSupabaseConfigured ? "Configurado" : "Pendiente", detail: "URL y anon key para datos reales" },
            { label: "Seguridad", value: "RLS requerido", detail: "Aplicar politicas antes de produccion real" },
          ].map((item) => (
            <article key={item.label} className="premium-card rounded-lg p-6">
              <p className="text-sm font-bold uppercase text-zinc-500">{item.label}</p>
              <p className="mt-2 text-2xl font-extrabold text-graphite">{item.value}</p>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{item.detail}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

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

function PublicFooter() {
  return (
    <footer className="pv-footer premium-reveal px-4 py-12 text-[var(--pv-text-secondary)] sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <LogoMark compact />
          <p className="mt-4 max-w-xs text-sm leading-6">
            Corralón, ferretería y hogar. Catamarca desde 1970.
          </p>
        </div>
        <div>
          <h3 className="font-heading text-sm font-bold uppercase tracking-[0.12em] text-white">Rubros</h3>
          <div className="mt-4 grid gap-2 text-sm">
            {categories.slice(0, 6).map((category) => (
              <a key={category.id} href="#rubros" className="transition hover:text-white">
                {category.name}
              </a>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-heading text-sm font-bold uppercase tracking-[0.12em] text-white">Contacto</h3>
          <div className="mt-4 grid gap-2 text-sm">
            <a href={makeWhatsAppHref([], defaultQuoteForm)} target="_blank" rel="noreferrer" className="transition hover:text-white">
              WhatsApp de atención
            </a>
            <span>Catamarca, Argentina</span>
            <span>Atención humana local</span>
          </div>
        </div>
        <div>
          <h3 className="font-heading text-sm font-bold uppercase tracking-[0.12em] text-white">Horarios</h3>
          <p className="mt-4 text-sm leading-6">
            Consultas y cotizaciones por WhatsApp. El precio final lo confirma Prevedello.
          </p>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-7xl border-t border-white/10 pt-5 text-xs text-[var(--pv-text-muted)]">
        © 2026 Prevedello Market. Plataforma de cotización comercial.
      </div>
    </footer>
  );
}

function WhatsAppFab() {
  return (
    <a
      href={makeWhatsAppHref([], defaultQuoteForm)}
      target="_blank"
      rel="noreferrer"
      className="whatsapp-fab grid place-items-center text-white lg:hidden"
      aria-label="Consultar por WhatsApp"
    >
      <MessageCircle size={26} />
    </a>
  );
}

function MobileBottomNav({ cartCount, onCartOpen }: { cartCount: number; onCartOpen: () => void }) {
  return (
    <nav className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-[100] h-14 border-t border-[rgba(160,190,255,0.1)] bg-[var(--pv-surface-0)] px-2 py-1 shadow-[0_-16px_45px_rgba(0,0,0,0.35)] lg:hidden">
      <div className="grid grid-cols-5 text-xs font-bold text-[var(--pv-text-muted)]">
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
                className="relative flex flex-col items-center gap-1 rounded-[var(--radius-btn)] px-2 py-1 text-[var(--pv-text-secondary)] transition hover:text-white"
              >
                <IconComponent size={19} />
                <span>{label as string}</span>
                {cartCount > 0 && (
                  <span className="cart-badge absolute right-4 top-0 grid h-4 min-w-4 place-items-center rounded-[var(--radius-badge)] bg-prevedello-red px-1 text-[10px] text-white">
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
              className={`flex flex-col items-center gap-1 rounded-[var(--radius-btn)] px-2 py-1 transition hover:text-white ${(label as string) === "WhatsApp" ? "text-[var(--pv-whatsapp)]" : ""}`}
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

const isAllowedInternalUser = (session: Session | null) => {
  const allowlist = businessConfig.allowedAdminEmails;
  if (allowlist.length === 0) return true;
  const email = session?.user.email?.toLowerCase();
  return Boolean(email && allowlist.includes(email));
};

function useInternalSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { session, loading };
}

function InternalLoginPage({
  authMode,
  onDemoLogin,
}: {
  authMode: InternalAuthMode;
  onDemoLogin: (email: string) => void;
}) {
  const [email, setEmail] = useState(authMode === "demo" ? DEMO_CRM_EMAIL : "");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const signInWithPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (authMode === "demo" || !supabase) {
      if (password.trim() !== DEMO_CRM_ACCESS_CODE) {
        setMessage(`Codigo demo incorrecto. Usa ${DEMO_CRM_ACCESS_CODE}.`);
        return;
      }

      onDemoLogin(email.trim() || DEMO_CRM_EMAIL);
      return;
    }

    setSending(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSending(false);
    if (error) setMessage(`No pudimos iniciar sesion: ${error.message}`);
  };

  const sendMagicLink = async () => {
    if (authMode === "demo") {
      setMessage("El magic link se activa cuando configures Supabase Auth.");
      return;
    }

    if (!supabase || !email.trim()) {
      setMessage("Escribi tu email para enviarte el enlace de acceso.");
      return;
    }

    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: window.location.origin + "/app",
      },
    });
    setSending(false);
    setMessage(error ? `No pudimos enviar el enlace: ${error.message}` : "Enlace enviado. Revisa tu email.");
  };

  return (
    <div className="min-h-screen bg-prevedello-blue text-white">
      <main className="mx-auto grid min-h-screen max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:px-8">
        <section>
          <Link to="/" className="mb-10 inline-block rounded-lg bg-white px-4 py-3">
            <LogoMark compact />
          </Link>
          <p className="text-sm font-extrabold uppercase tracking-[0.24em] text-white/55">App interna</p>
          <h1 className="mt-4 max-w-3xl text-5xl font-extrabold leading-[0.95] sm:text-6xl">
            CRM Prevedello para ventas, catalogo y seguimiento.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-white/70">
            Acceso privado para el equipo. El sitio publico queda separado y el backoffice queda
            listo para operar cotizaciones, catalogo e importacion CSV.
          </p>
          {authMode === "demo" && (
            <div className="mt-6 max-w-xl rounded-lg border border-white/15 bg-white/10 p-4 text-sm font-semibold leading-6 text-white/75">
              Modo demo local activo. Codigo de acceso:{" "}
              <span className="font-extrabold text-white">{DEMO_CRM_ACCESS_CODE}</span>
            </div>
          )}
        </section>

        <form onSubmit={signInWithPassword} className="rounded-lg bg-white p-6 text-graphite shadow-[0_30px_90px_rgba(0,35,95,0.25)]">
          <p className="text-sm font-bold uppercase text-prevedello-red">
            {authMode === "demo" ? "Ingreso demo" : "Ingreso seguro"}
          </p>
          <h2 className="mt-2 text-3xl font-extrabold">Entrar al CRM</h2>
          <label className="mt-6 block text-sm font-bold text-zinc-700">
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoComplete="email"
              className="mt-2 h-12 w-full rounded-lg border border-zinc-200 px-3 font-semibold outline-none focus:border-prevedello-red"
              placeholder="ventas@prevedello.com"
            />
          </label>
          <label className="mt-4 block text-sm font-bold text-zinc-700">
            {authMode === "demo" ? "Codigo demo" : "Password"}
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="current-password"
              className="mt-2 h-12 w-full rounded-lg border border-zinc-200 px-3 font-semibold outline-none focus:border-prevedello-red"
              placeholder={authMode === "demo" ? DEMO_CRM_ACCESS_CODE : "Tu password"}
            />
          </label>
          {message && <p className="mt-4 rounded-lg bg-cement p-3 text-sm font-bold text-zinc-700">{message}</p>}
          <button
            type="submit"
            disabled={sending}
            className="mt-5 w-full rounded-full bg-prevedello-blue px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-wait disabled:opacity-70"
          >
            {sending ? "Validando..." : "Entrar"}
          </button>
          {authMode === "supabase" ? (
            <button
              type="button"
              onClick={() => void sendMagicLink()}
              disabled={sending}
              className="mt-3 w-full rounded-full border border-zinc-200 px-5 py-3 text-sm font-bold text-graphite transition hover:bg-cement/50 disabled:cursor-wait disabled:opacity-70"
            >
              Enviar magic link
            </button>
          ) : null}
          <p className="mt-5 text-sm leading-6 text-zinc-500">
            {authMode === "demo"
              ? "Este acceso es solo para demo local. Para produccion, configura Supabase Auth y usuarios internos."
              : "Los usuarios se crean y administran desde Supabase Auth. Para restringir emails, usa VITE_CRM_ALLOWED_EMAILS."}
          </p>
        </form>
      </main>
    </div>
  );
}

function InternalAccessDeniedPage({ email }: { email: string }) {
  const signOut = async () => {
    await supabase?.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-[#f7f3eb]">
      <RouteHeader title="Acceso no autorizado" eyebrow="App interna">
        Tu usuario inicio sesion, pero no esta incluido en la lista permitida para este CRM.
      </RouteHeader>
      <main className="section-band px-4 py-12 sm:px-6 lg:px-8">
        <div className="premium-card mx-auto max-w-3xl rounded-lg p-7">
          <p className="text-sm font-bold uppercase text-prevedello-red">Usuario</p>
          <h2 className="mt-2 text-2xl font-extrabold text-graphite">{email}</h2>
          <p className="mt-3 leading-7 text-zinc-600">
            Agrega este email en VITE_CRM_ALLOWED_EMAILS o usa una cuenta autorizada.
          </p>
          <button onClick={() => void signOut()} className="mt-6 rounded-full bg-prevedello-blue px-5 py-3 text-sm font-bold text-white">
            Salir
          </button>
        </div>
      </main>
    </div>
  );
}

function InternalWorkspacePage({
  authMode,
  userEmail,
  onSignOut,
}: {
  authMode: InternalAuthMode;
  userEmail: string;
  onSignOut: () => void;
}) {
  const [activeModule, setActiveModule] = useState<InternalModule>("dashboard");
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

  const renderActiveModule = () => {
    if (activeModule === "dashboard") {
      return <InternalDashboard productsList={productsList} quotes={quotes} onModuleChange={setActiveModule} />;
    }

    if (activeModule === "productos") {
      return (
        <AdminCatalogPanel
          productsList={productsList}
          onProductsChange={setProductsList}
          catalogStatus={catalogStatus}
          catalogSource={catalogSource}
          onReloadCatalog={reloadCatalog}
          onPublishCatalog={publishCatalog}
        />
      );
    }

    if (activeModule === "cotizaciones") {
      return (
        <AdminCrmPanel
          quotes={quotes}
          statusMessage={crmStatus}
          onReload={reloadQuotes}
          onStatusChange={handleQuoteStatusChange}
        />
      );
    }

    if (activeModule === "clientes") return <InternalClientsPanel quotes={quotes} />;
    if (activeModule === "crm") return <InternalCrmBoard quotes={quotes} />;
    if (activeModule === "tareas") return <InternalTasksPanel quotes={quotes} productsList={productsList} />;
    if (activeModule === "rubros") return <InternalTaxonomyPanel productsList={productsList} view="rubros" />;
    if (activeModule === "marcas") return <InternalTaxonomyPanel productsList={productsList} view="marcas" />;

    return <InternalSettingsPanel authMode={authMode} userEmail={userEmail} />;
  };

  return (
    <div className="min-h-screen bg-[#f7f3eb]">
      <header className="sticky top-0 z-50 border-b border-prevedello-blue/10 bg-white/94 px-4 py-3 shadow-[0_12px_35px_rgba(9,59,145,0.08)] backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="shrink-0" aria-label="Volver al sitio publico">
              <LogoMark compact />
            </Link>
            <div className="hidden min-w-0 text-right sm:block">
              <p className="truncate text-sm font-extrabold text-graphite">{userEmail}</p>
              <p className="text-xs font-bold uppercase text-zinc-500">
                {authMode === "demo" ? "CRM interno demo" : "CRM interno"}
              </p>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              className="rounded-full bg-prevedello-blue px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-800"
            >
              Salir
            </button>
          </div>
          <nav className="flex gap-2 overflow-x-auto pb-1">
            {internalModules.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveModule(item.id)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold transition ${
                  activeModule === item.id
                    ? "bg-prevedello-blue text-white shadow-[0_12px_30px_rgba(9,59,145,0.18)]"
                    : "border border-zinc-200 bg-white text-zinc-600 hover:border-prevedello-red/35 hover:text-prevedello-red"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <RouteHeader title="Prevedello CRM" eyebrow="App interna">
        Dashboard, catalogo, cotizaciones, clientes, tareas y configuracion comercial.
      </RouteHeader>
      {renderActiveModule()}
    </div>
  );
}

function InternalAppPage() {
  const { session, loading } = useInternalSession();
  const [demoEmail, setDemoEmail] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(DEMO_CRM_STORAGE_KEY);
  });

  const startDemoSession = (email: string) => {
    const normalizedEmail = email.trim() || DEMO_CRM_EMAIL;
    window.localStorage.setItem(DEMO_CRM_STORAGE_KEY, normalizedEmail);
    setDemoEmail(normalizedEmail);
  };

  const endDemoSession = () => {
    window.localStorage.removeItem(DEMO_CRM_STORAGE_KEY);
    setDemoEmail(null);
  };

  if (isSupabaseConfigured && loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-prevedello-blue px-4 text-white">
        <div className="text-center">
          <div className="inline-flex rounded-lg bg-white px-4 py-3 shadow-[0_18px_55px_rgba(9,59,145,0.22)]">
            <LogoMark />
          </div>
          <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.24em] text-white/55">Validando sesion</p>
        </div>
      </div>
    );
  }

  if (isSupabaseConfigured) {
    if (!session) return <InternalLoginPage authMode="supabase" onDemoLogin={startDemoSession} />;
    if (!isAllowedInternalUser(session)) return <InternalAccessDeniedPage email={session.user.email || "Usuario sin email"} />;

    return (
      <InternalWorkspacePage
        authMode="supabase"
        userEmail={session.user.email || "Usuario interno"}
        onSignOut={() => {
          void supabase?.auth.signOut();
        }}
      />
    );
  }

  if (!demoEmail) return <InternalLoginPage authMode="demo" onDemoLogin={startDemoSession} />;

  return <InternalWorkspacePage authMode="demo" userEmail={demoEmail} onSignOut={endDemoSession} />;
}

function MarketplacePage() {
  const [productsList, setProductsList] = useState<Product[]>(() => getStoredProducts());
  const [catalogStatus, setCatalogStatus] = useState("Catalogo local activo.");
  const [catalogSource, setCatalogSource] = useState<"local" | "supabase">("local");
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

  useEffect(() => {
    void reloadCatalog();
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".premium-reveal, .product-card, .rubro-card, .ds-card").forEach((element) => {
        gsap.fromTo(
          element,
          { y: 28, opacity: 0.001 },
          {
            y: 0,
            opacity: 1,
            duration: 0.72,
            ease: "power3.out",
            scrollTrigger: {
              trigger: element,
              start: "top 88%",
              once: true,
            },
          },
        );
      });
    });

    return () => context.revert();
  }, []);

  const handleSendQuote = async () => {
    const result = await saveQuoteRequest(customer, cart);
    return result.message;
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
    <div className="min-h-screen pb-20 font-body text-graphite lg:pb-0">
      <HeaderMarketplace
        query={query}
        onQueryChange={setQuery}
        cartCount={cartCount}
        onCartOpen={() => setCartOpen(true)}
      />
      <HeroSection query={query} onQueryChange={setQuery} />
      <PromoBanner />
      <OperationsDeck />

      <main className="pb-24 lg:pb-0">
        <section id="rubros" className="premium-reveal section-anchor blueprint-bg px-4 py-20 text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="section-kicker">Rubros principales</p>
                <h2 className="mt-2 font-heading text-4xl font-extrabold uppercase text-white sm:text-5xl">Compra por necesidad de obra.</h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-[var(--pv-text-secondary)]">
                Accesos pensados para que una persona común encuentre rápido lo que necesita y pueda pedir ayuda sin fricción.
              </p>
            </div>
            <div className="flex gap-5 overflow-x-auto pb-3 scrollbar-none lg:grid lg:grid-cols-4 lg:overflow-visible">
              {categories.map((category, index) => (
                <CategoryCard key={category.id} category={category} index={index} onSelect={handleCategorySelect} />
              ))}
            </div>
          </div>
        </section>

        <section id="pedido" className="premium-reveal section-anchor premium-dark-band px-4 py-18 text-white sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-3">
            {[
              ["1", "Buscá o elegí un rubro", "Pisos, ferretería, pintura, obra gruesa, instalaciones o hogar."],
              ["2", "Agregá productos al pedido", "No hay checkout: es una cotización rápida con cantidades y notas."],
              ["3", "Enviá por WhatsApp", "El mensaje sale armado para que Prevedello responda con precio y entrega."],
            ].map(([step, title, detail]) => (
              <div key={step} className="ds-card p-6">
                <span className="grid h-11 w-11 place-items-center rounded-[var(--radius-btn)] bg-prevedello-red text-lg font-extrabold text-white shadow-[0_14px_30px_rgba(220,31,38,0.18)]">
                  {step}
                </span>
                <h3 className="mt-4 font-heading text-xl font-extrabold uppercase text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--pv-text-secondary)]">{detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="productos" className="premium-reveal section-anchor catalog-premium-band px-4 py-20 text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Breadcrumbs current="Productos destacados" />
            <div className="mb-9 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="section-kicker">Catálogo inicial</p>
                <h2 className="mt-2 font-heading text-4xl font-extrabold uppercase text-white sm:text-5xl">Productos para cotizar hoy.</h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-[var(--pv-text-secondary)]">
                Esta etapa ya permite editar catálogo local e importar CSV. La estructura queda
                lista para conectar categorías, productos, marcas y pedidos a Supabase cuando lo definamos.
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
                  <div className="filter-panel rounded-lg border-dashed p-10 text-center">
                    <ClipboardList className="mx-auto text-prevedello-red" size={38} />
                    <h3 className="mt-3 text-2xl font-extrabold text-white">No encontramos productos.</h3>
                    <p className="mt-2 text-[var(--pv-text-secondary)]">Proba con otro rubro o envia una consulta general.</p>
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

        <section id="calculadoras" className="premium-reveal section-anchor blueprint-bg px-4 py-20 text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="section-kicker">Calculadoras</p>
                <h2 className="mt-2 font-heading text-4xl font-extrabold uppercase text-white sm:text-5xl">Estimaciones para comprar mejor.</h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-[var(--pv-text-secondary)]">
                Resultados orientativos para iniciar la cotización. El equipo puede ajustar cantidades según medidas y uso real.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {calculators.map((calculator) => (
                <MaterialCalculatorCard key={calculator.id} calculator={calculator} />
              ))}
            </div>
          </div>
        </section>

        <section className="premium-reveal blueprint-bg px-4 py-20 text-white sm:px-6 lg:px-8">
          <div className="blueprint-panel mx-auto grid max-w-7xl gap-7 rounded-[var(--radius-card)] border border-white/14 p-6 lg:grid-cols-[1fr_auto] lg:items-center lg:p-8">
            <div>
              <p className="text-sm font-bold uppercase text-white/65">Siguiente paso</p>
              <h2 className="mt-2 max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl">
                Prevedello Market ya tiene cotizacion, catalogo y base operativa para validar ventas.
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-white/72">
                El proximo salto productivo es cargar fotos y productos reales, conectar pedidos
                persistentes y operar el CRM interno con usuarios autorizados.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="ds-button-red inline-flex items-center justify-center gap-2 px-6 py-3 text-sm"
              >
                Abrir pedido
                <ShoppingCart size={17} />
              </button>
              <WhatsAppQuoteButton items={cart} customer={customer} />
            </div>
          </div>
        </section>

        <PublicFooter />
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
      <Route path="/app" element={<InternalAppPage />} />
      <Route path="/app/*" element={<InternalAppPage />} />
      <Route path="/admin" element={<Navigate to="/app" replace />} />
      <Route path="/admin/*" element={<Navigate to="/app" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
