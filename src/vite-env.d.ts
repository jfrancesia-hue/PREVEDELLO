/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PREVEDELLO_WHATSAPP?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_ENABLE_ADMIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
