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
npm run build
```

## Variables de entorno

Copiar `.env.example` como `.env` y completar:

```bash
VITE_PREVEDELLO_WHATSAPP=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

No usar `service_role` en el frontend.

## Supabase

El esquema propuesto esta en `docs/supabase-schema.sql`. Revisarlo antes de ejecutar migraciones o cambios de RLS.
