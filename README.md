# Prevedello Market

Plataforma marketplace para Prevedello: catalogo, buscador, rubros, carrito de cotizacion, WhatsApp y app interna CRM con login.

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
VITE_CRM_ALLOWED_EMAILS=
```

No usar `service_role` en el frontend.

### App interna CRM

El backoffice vive separado del sitio publico:

- `/app`: login y CRM interno.
- `/admin`: redirige a `/app`.

Requiere Supabase Auth configurado con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

`VITE_CRM_ALLOWED_EMAILS` es opcional y acepta emails separados por coma para limitar el acceso del frontend. Esto no reemplaza RLS: antes de usar datos reales, proteger tablas con politicas en Supabase.

## Supabase

El esquema propuesto esta en `docs/supabase-schema.sql`. Revisarlo antes de ejecutar migraciones o cambios de RLS.

## Deploy

Incluye `vercel.json` para que React Router funcione al refrescar rutas como `/productos`, `/rubros` o `/cotizacion`.

Checklist previo a produccion:

- Completar `VITE_PREVEDELLO_WHATSAPP`.
- Configurar solo `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` si se usa Supabase.
- Crear usuarios internos en Supabase Auth.
- Completar `VITE_CRM_ALLOWED_EMAILS` si se quiere limitar emails autorizados.
- Revisar `docs/supabase-schema.sql`, RLS y permisos antes de migrar.
- Cargar productos, fotos y precios reales.
- Definir dominio final para sitemap/SEO avanzado.
