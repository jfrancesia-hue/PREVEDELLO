import { products as seedProducts, type Product } from "../data/catalog";

const STORAGE_KEY = "prevedello-market-products";

export const getStoredProducts = (): Product[] => {
  if (typeof window === "undefined") return seedProducts;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return seedProducts;
    const parsed = JSON.parse(stored) as Product[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : seedProducts;
  } catch {
    return seedProducts;
  }
};

export const saveStoredProducts = (products: Product[]) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
};

export const resetStoredProducts = () => {
  window.localStorage.removeItem(STORAGE_KEY);
};

const splitCsvLine = (line: string) => {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
};

const normalizeAvailability = (value: string): Product["availability"] => {
  const normalized = value.toLowerCase();
  if (normalized.includes("bajo")) return "Bajo pedido";
  if (normalized.includes("confirmar")) return "A confirmar";
  return "Disponible";
};

const pickTone = (index: number) =>
  [
    "from-zinc-200 via-neutral-100 to-stone-300",
    "from-blue-200 via-white to-red-100",
    "from-sky-300 via-blue-700 to-zinc-950",
    "from-neutral-300 via-stone-200 to-zinc-500",
    "from-zinc-100 via-sky-100 to-zinc-400",
    "from-red-100 via-white to-rose-300",
  ][index % 6];

export const parseProductsCsv = (csv: string): Product[] => {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]).map((header) => header.toLowerCase());

  return lines.slice(1).flatMap((line, index) => {
    const values = splitCsvLine(line);
    const row = headers.reduce<Record<string, string>>((acc, header, valueIndex) => {
      acc[header] = values[valueIndex] ?? "";
      return acc;
    }, {});

    const name = row.nombre || row.name;
    if (!name) return [];

    const product: Product = {
      id:
        row.id ||
        name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
      name,
      brand: row.marca || row.brand || "Prevedello",
      category: row.rubro || row.categoria || row.category || "Ferreteria",
      unit: row.unidad || row.unit || "Unidad",
      price: row.precio || row.price ? Number(String(row.precio || row.price).replace(/[^\d.]/g, "")) : undefined,
      availability: normalizeAvailability(row.disponibilidad || row.availability || ""),
      description: row.descripcion || row.description || "Producto disponible para cotizar con asesoramiento.",
      uses: (row.usos || row.uses || "Obra; Hogar")
        .split(";")
        .map((use) => use.trim())
        .filter(Boolean),
      related: (row.relacionados || row.related || "")
        .split(";")
        .map((item) => item.trim())
        .filter(Boolean),
      imageTone: pickTone(index),
      imageUrl: row.imagen || row.image || row.imageurl || undefined,
      sku: row.sku || undefined,
      stockNote: row.stock || undefined,
    };

    return [product];
  });
};
