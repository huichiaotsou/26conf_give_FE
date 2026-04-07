/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_APP_ENV?: string;
    readonly VITE_GIVING_START_AT?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
