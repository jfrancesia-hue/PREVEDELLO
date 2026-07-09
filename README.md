# Prevedello Market

Plataforma marketplace para Prevedello: catalogo, buscador, rubros, carrito de cotizacion, WhatsApp, admin local, importador CSV y CRM comercial inicial.

## Stack

- Vite
- React
- TypeScript
- Tailwind CSS v4
- Supabase-ready
- React Router
- GSAP

## Scripts

```bash
npm install
npm run dev
npm run check
npm run build
npm run preview
```

## Variables de entorno

Copiar `.env.example` como `.env` y completar:

```bash
VITE_PREVEDELLO_WHATSAPP=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_ENABLE_ADMIN=false
```

No usar `service_role` en el frontend.

### Admin

El admin/CRM queda oculto por defecto en builds de produccion. Para una demo interna se puede activar con:

```bash
VITE_ENABLE_ADMIN=true
```

Esto no reemplaza autenticacion real. Antes de exponer backoffice en produccion, conectar Supabase Auth, permisos y RLS.

## Supabase

El esquema propuesto esta en `docs/supabase-schema.sql`. Revisarlo antes de ejecutar migraciones o cambios de RLS.

## Deploy

Incluye `vercel.json` para que React Router funcione al refrescar rutas como `/productos`, `/rubros` o `/cotizacion`.

Checklist previo a produccion:

- Completar `VITE_PREVEDELLO_WHATSAPP`.
- Configurar solo `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` si se usa Supabase.
- Mantener `VITE_ENABLE_ADMIN=false` en sitio publico.
- Revisar `docs/supabase-schema.sql`, RLS y permisos antes de migrar.
- Cargar productos, fotos y precios reales.
- Definir dominio final para sitemap/SEO avanzado.
