type PaymentType = "credit_card" | "apple_pay" | "google_pay";

type EventParameters = Record<string, string | number | readonly PurchaseItem[]>;

interface PurchaseItem {
    item_id: string;
    item_name: string;
    item_category: "Donation";
    price: number;
    quantity: 1;
}

declare global {
    interface Window {
        dataLayer?: unknown[][];
        gtag?: (...args: unknown[]) => void;
        __givingGaInitialized?: boolean;
    }
}

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();
const isProduction = import.meta.env.PROD && `${import.meta.env.VITE_APP_ENV ?? "production"}`.toLowerCase() === "production";
const purchaseStoragePrefix = "giving-ga-purchase:";
const emittedPurchases = new Set<string>();

const donationItems = (amount: number): readonly PurchaseItem[] => [{
    item_id: "giving",
    item_name: "Giving",
    item_category: "Donation",
    price: amount,
    quantity: 1,
}];

const canTrack = () =>
    typeof window !== "undefined" &&
    isProduction &&
    Boolean(measurementId) &&
    typeof window.gtag === "function";

/** Loads the official Google tag once. This is intentionally a browser-only no-op otherwise. */
export const initializeGA = () => {
    if (typeof window === "undefined" || !isProduction || !measurementId || window.__givingGaInitialized) {
        return;
    }

    try {
        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || ((...args: unknown[]) => window.dataLayer?.push(args));
        window.gtag("js", new Date());
        window.gtag("config", measurementId);
        window.__givingGaInitialized = true;

        const scriptId = "giving-ga4-script";
        if (!document.getElementById(scriptId)) {
            const script = document.createElement("script");
            script.id = scriptId;
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
            document.head.appendChild(script);
        }
    } catch {
        // Analytics must never affect the donation flow (including when blocked).
    }
};

export const trackEvent = (name: string, parameters: EventParameters = {}) => {
    if (!canTrack()) return;

    try {
        window.gtag?.("event", name, parameters);
    } catch {
        // Analytics is non-critical.
    }
};

export const trackGiveStart = (amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0) return;

    const parameters = { currency: "TWD", value: amount, items: donationItems(amount) };
    trackEvent("give_start", parameters);
    trackEvent("begin_checkout", parameters);
};

export const trackAmountSelect = (amount: number, amountType: "preset" | "custom") => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    trackEvent("give_amount_select", { value: amount, currency: "TWD", amount_type: amountType });
};

export const trackPaymentInfo = (amount: number, paymentType: PaymentType) => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    trackEvent("add_payment_info", {
        currency: "TWD",
        value: amount,
        payment_type: paymentType,
        items: donationItems(amount),
    });
};

export const trackGiveSubmit = (amount: number, paymentType: PaymentType) => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    trackEvent("give_submit", { value: amount, currency: "TWD", payment_type: paymentType });
};

export const trackGiveFailure = (amount: number, paymentType: PaymentType, errorType: "payment_declined" | "gateway_error" | "network_error" | "validation_error" | "unknown") => {
    if (Number.isFinite(amount) && amount > 0) {
        trackEvent("give_failed", { value: amount, currency: "TWD", payment_type: paymentType, error_type: errorType });
        return;
    }

    trackEvent("give_failed", { payment_type: paymentType, error_type: errorType });
};

const hasTrackedPurchase = (transactionId: string) => {
    if (emittedPurchases.has(transactionId)) return true;

    try {
        return window.sessionStorage.getItem(`${purchaseStoragePrefix}${transactionId}`) === "1";
    } catch {
        return false;
    }
};

const rememberPurchase = (transactionId: string) => {
    emittedPurchases.add(transactionId);
    try {
        window.sessionStorage.setItem(`${purchaseStoragePrefix}${transactionId}`, "1");
    } catch {
        // The in-memory set still prevents duplicates during this page lifetime.
    }
};

/** Emits GA4's canonical donation conversion only after an API-confirmed success. */
export const trackGiveSuccess = (transactionId: string, amount: number) => {
    if (!transactionId || !Number.isFinite(amount) || amount <= 0 || hasTrackedPurchase(transactionId)) return;

    rememberPurchase(transactionId);
    trackEvent("purchase", {
        transaction_id: transactionId,
        value: amount,
        currency: "TWD",
        items: donationItems(amount),
    });
};

export type { PaymentType };
