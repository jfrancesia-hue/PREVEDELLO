import type { Product } from "../data/catalog";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

export type QuoteStatus =
  | "nuevo"
  | "contactado"
  | "cotizacion_enviada"
  | "en_negociacion"
  | "ganado"
  | "perdido"
  | "sin_respuesta";

export type QuoteCustomer = {
  name: string;
  phone: string;
  location: string;
  delivery: "Retiro en sucursal" | "Envio a domicilio";
  notes: string;
};

export type QuoteLine = {
  product: Product;
  quantity: number;
};

export type QuoteRecord = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerLocation: string;
  deliveryType: QuoteCustomer["delivery"];
  notes: string;
  status: QuoteStatus;
  source: "web" | "local";
  createdAt: string;
  items: {
    productId: string;
    productName: string;
    unit: string;
    quantity: number;
  }[];
};

const STORAGE_KEY = "prevedello-market-quotes";

const readLocalQuotes = (): QuoteRecord[] => {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as QuoteRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeLocalQuotes = (quotes: QuoteRecord[]) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
};

const createLocalQuote = (customer: QuoteCustomer, items: QuoteLine[]): QuoteRecord => ({
  id: crypto.randomUUID(),
  customerName: customer.name || "A completar",
  customerPhone: customer.phone || "A completar",
  customerLocation: customer.location || "A completar",
  deliveryType: customer.delivery,
  notes: customer.notes || "",
  status: "nuevo",
  source: "web",
  createdAt: new Date().toISOString(),
  items: items.map((item) => ({
    productId: item.product.id,
    productName: item.product.name,
    unit: item.product.unit,
    quantity: item.quantity,
  })),
});

const saveLocalQuote = (quote: QuoteRecord) => {
  const quotes = readLocalQuotes();
  writeLocalQuotes([quote, ...quotes.filter((item) => item.id !== quote.id)]);
};

export const saveQuoteRequest = async (customer: QuoteCustomer, items: QuoteLine[]) => {
  const quote = createLocalQuote(customer, items);
  saveLocalQuote(quote);

  if (!isSupabaseConfigured || !supabase) {
    return {
      quote,
      source: "local" as const,
      message: "Cotizacion guardada localmente. Supabase no esta configurado.",
    };
  }

  const { data: customerRow, error: customerError } = await supabase
    .from("customers")
    .insert({
      name: quote.customerName,
      phone: quote.customerPhone,
      location: quote.customerLocation,
    })
    .select("id")
    .single();

  if (customerError) {
    return {
      quote,
      source: "local" as const,
      message: `Cotizacion guardada localmente. Supabase rechazo customers: ${customerError.message}`,
    };
  }

  const { data: quoteRow, error: quoteError } = await supabase
    .from("quote_requests")
    .insert({
      customer_id: customerRow.id,
      customer_name: quote.customerName,
      customer_phone: quote.customerPhone,
      customer_location: quote.customerLocation,
      delivery_type: quote.deliveryType,
      notes: quote.notes,
      status: quote.status,
      source: "web",
    })
    .select("id")
    .single();

  if (quoteError) {
    return {
      quote,
      source: "local" as const,
      message: `Cotizacion guardada localmente. Supabase rechazo quote_requests: ${quoteError.message}`,
    };
  }

  const { error: itemsError } = await supabase.from("quote_items").insert(
    quote.items.map((item) => ({
      quote_request_id: quoteRow.id,
      product_id: item.productId,
      product_name: item.productName,
      unit: item.unit,
      quantity: item.quantity,
    })),
  );

  if (itemsError) {
    return {
      quote,
      source: "local" as const,
      message: `Cotizacion creada, pero Supabase rechazo quote_items: ${itemsError.message}`,
    };
  }

  return {
    quote: { ...quote, id: quoteRow.id },
    source: "supabase" as const,
    message: "Cotizacion guardada en Supabase y lista para seguimiento comercial.",
  };
};

export const listQuoteRequests = async () => {
  const localQuotes = readLocalQuotes();

  if (!isSupabaseConfigured || !supabase) {
    return {
      quotes: localQuotes,
      source: "local" as const,
      message: "CRM leyendo cotizaciones locales.",
    };
  }

  const { data, error } = await supabase
    .from("quote_requests")
    .select("id, customer_name, customer_phone, customer_location, delivery_type, notes, status, source, created_at, quote_items(product_id, product_name, unit, quantity)")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return {
      quotes: localQuotes,
      source: "local" as const,
      message: error ? `CRM con fallback local: ${error.message}` : "CRM con fallback local.",
    };
  }

  return {
    quotes: data.map((row) => ({
      id: row.id,
      customerName: row.customer_name || "A completar",
      customerPhone: row.customer_phone || "A completar",
      customerLocation: row.customer_location || "A completar",
      deliveryType: row.delivery_type || "Envio a domicilio",
      notes: row.notes || "",
      status: (row.status || "nuevo") as QuoteStatus,
      source: row.source || "web",
      createdAt: row.created_at,
      items: (row.quote_items || []).map((item) => ({
        productId: item.product_id || "",
        productName: item.product_name,
        unit: item.unit || "Unidad",
        quantity: item.quantity || 1,
      })),
    })),
    source: "supabase" as const,
    message: "CRM leyendo cotizaciones desde Supabase.",
  };
};

export const updateQuoteStatus = async (quoteId: string, status: QuoteStatus) => {
  const localQuotes = readLocalQuotes();
  writeLocalQuotes(localQuotes.map((quote) => (quote.id === quoteId ? { ...quote, status } : quote)));

  if (!isSupabaseConfigured || !supabase) {
    return "Estado actualizado localmente.";
  }

  const { error } = await supabase.from("quote_requests").update({ status }).eq("id", quoteId);
  return error ? `Estado local actualizado. Supabase rechazo update: ${error.message}` : "Estado actualizado en Supabase.";
};
