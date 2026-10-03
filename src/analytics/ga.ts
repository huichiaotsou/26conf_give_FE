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
        gtag?: (...args: unknown[]) => void;
    }
}

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
    typeof window.gtag === "function";

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
