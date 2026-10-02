/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_APP_ENV?: string;
    readonly VITE_GIVING_START_AT?: string;
    readonly VITE_GIVING_END_AT?: string;
    readonly VITE_GIVING_LOCK_PASSWORD?: string;
    readonly VITE_GA_MEASUREMENT_ID?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
