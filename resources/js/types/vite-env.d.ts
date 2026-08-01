/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_APP_NAME?: string;
    readonly VITE_WHATSAPP_NUMBER?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
