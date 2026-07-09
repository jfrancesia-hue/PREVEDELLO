import type { Product } from "../data/catalog";
import { getStoredProducts, saveStoredProducts } from "./catalogStorage";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

type ProductRow = {
  id: string;
  sku: string | null;
  name: string;
  brand: string | null;
  category: string | null;
  unit: string | null;
  price: number | null;
  availability: Product["availability"] | null;
  description: string | null;
  uses: string[] | null;
  related: string[] | null;
  image_url: string | null;
  image_tone: string | null;
  stock_note: string | null;
};

const productFromRow = (row: ProductRow): Product => ({
  id: row.id,
  name: row.name,
  brand: row.brand || "Prevedello",
  category: row.category || "Ferreteria",
  unit: row.unit || "Unidad",
  price: row.price || undefined,
  availability: row.availability || "Disponible",
  description: row.description || "Producto disponible para cotizar con asesoramiento.",
  uses: row.uses || ["Obra", "Hogar"],
  related: row.related || [],
  imageTone: row.image_tone || "from-zinc-200 via-neutral-100 to-stone-300",
  imageUrl: row.image_url || undefined,
  sku: row.sku || undefined,
  stockNote: row.stock_note || undefined,
});

const rowFromProduct = (product: Product) => ({
  id: product.id,
  sku: product.sku ?? null,
  name: product.name,
  brand: product.brand,
  category: product.category,
  unit: product.unit,
  price: product.price ?? null,
  availability: product.availability,
  description: product.description,
  uses: product.uses,
  related: product.related,
  image_url: product.imageUrl ?? null,
  image_tone: product.imageTone,
  stock_note: product.stockNote ?? null,
  is_active: true,
});

export const loadCatalogProducts = async () => {
  const localProducts = getStoredProducts();

  if (!isSupabaseConfigured || !supabase) {
    return {
      products: localProducts,
      source: "local" as const,
      message: "Catalogo local activo. Configura Supabase para cargar productos reales.",
    };
  }

  const { data, error } = await supabase
    .from("products")
    .select(
      "id, sku, name, brand, category, unit, price, availability, description, uses, related, image_url, image_tone, stock_note",
    )
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error || !data || data.length === 0) {
    return {
      products: localProducts,
      source: "local" as const,
      message: error
        ? `Supabase configurado, pero no pude leer products: ${error.message}`
        : "Supabase no devolvio productos activos. Uso catalogo local.",
    };
  }

  const products = (data as ProductRow[]).map(productFromRow);
  saveStoredProducts(products);

  return {
    products,
    source: "supabase" as const,
    message: `${products.length} productos cargados desde Supabase.`,
  };
};

export const publishProductsToSupabase = async (products: Product[]) => {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      message: "Supabase no esta configurado. Completa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.",
    };
  }

  const { error } = await supabase.from("products").upsert(products.map(rowFromProduct), { onConflict: "id" });

  if (error) {
    return {
      ok: false,
      message: `No se pudo publicar en Supabase: ${error.message}`,
    };
  }

  return {
    ok: true,
    message: `${products.length} productos publicados en Supabase.`,
  };
};
