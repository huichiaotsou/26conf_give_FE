import { lazy, Suspense, useEffect, useState, useRef, ReactNode, FormEvent } from "react";
import { TextField, InputAdornment, Box, Checkbox, FormControlLabel, FormControl, FormHelperText, Dialog, DialogActions, DialogContent, Button } from "@mui/material";
import CreditCard from "./CreditCard";
import ExchangeRate from "./ExchangeRate";
import { useForm, SubmitHandler } from "react-hook-form";
import "./Congive.scss";
import Header from "./Header";
import { COLLAPSED_HEIGHT_RATIO, TITLE_MAX_HEIGHT, getResponsiveTitleMetrics, useIsMobileViewport } from "./bannerMetrics";
import PaymentSelect from "./PaymentSelect";
import Receipt from "./Receipt";
import Upload from "./Upload";
import PayButton from "./PayButton";
import WireTransfer from "./WireTransfer";
import CircularProgress from "@mui/material/CircularProgress";
import ConfGiveProps from "../interface/confGiveProps.model";
import { PaymentType, trackAmountSelect, trackGiveFailure, trackGiveStart, trackGiveSubmit, trackGiveSuccess, trackPaymentInfo } from "../analytics/ga";

declare global {
    let TPDirect: any;
}

const GiveSucessOrFail = lazy(() => import("./GiveSucessOrFail"));
const ConfAlertDialog = lazy(() => import("./ConfAlertDialog"));
const ConfNoteDialog = lazy(() => import("./ConfNoteDialog"));
const ConfPrivacyPolicyDialog = lazy(() => import("./ConfPrivacyPolicyDialog"));
const googlePayScriptId = "google-pay-sdk";

const loadGooglePaySdk = () => new Promise<void>((resolve, reject) => {
    if (document.getElementById(googlePayScriptId)) {
        resolve();
        return;
    }

    const script = document.createElement("script");
    script.id = googlePayScriptId;
    script.src = "https://pay.google.com/gp/p/js/pay.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Google Pay SDK"));
    document.head.appendChild(script);
});

const PAYMENT_TYPES = {
    APPLE_PAY: "apple-pay",
    GOOGLE_PAY: "google-pay",
    CREDIT_CARD: "credit-card",
};

const RECEIPT_TYPES = {
    PERSONAL: "personal",
    COMPANY: "company",
};

const parseGivingAt = (value: string | undefined) => {
    if (!value) return null;

    const normalizedValue = value.trim();
    if (!normalizedValue) return null;

    const parsedDate = new Date(normalizedValue);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const formatMonthDay = (date: Date) => {
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${month}/${day}`;
};

const toAnalyticsPaymentType = (paymentType: string | undefined): PaymentType => {
    switch (paymentType) {
        case PAYMENT_TYPES.APPLE_PAY:
            return "apple_pay";
        case PAYMENT_TYPES.GOOGLE_PAY:
            return "google_pay";
        default:
            return "credit_card";
    }
};

const getConfirmedTransactionId = (response: unknown): string | null => {
    if (!response || typeof response !== "object") return null;

    const result = response as Record<string, unknown>;
    const candidate = result.transaction_id ?? result.transactionId ?? result.order_id ?? result.orderId ?? result.donation_id ?? result.donationId;
    if ((typeof candidate !== "string" && typeof candidate !== "number")) return null;

    const transactionId = String(candidate).trim();
    // Only allow an opaque backend identifier; this also rejects email addresses.
    return /^\S{1,128}$/.test(transactionId) && !transactionId.includes("@") ? transactionId : null;
};

const normalizePaymentError = (error: unknown): "gateway_error" | "network_error" =>
    error instanceof TypeError ? "network_error" : "gateway_error";

const campusFromApproximateLocation = (location: {
    country_code?: string;
    city?: string;
    region?: string;
}) => {
    const cityAndRegion = `${location.city || ""} ${location.region || ""}`.toLowerCase();
    const isTaipeiMetroArea = location.country_code === "TW" && (
        cityAndRegion.includes("taipei") ||
        cityAndRegion.includes("台北") ||
        cityAndRegion.includes("新北")
    );

    return isTaipeiMetroArea ? "台北分部" : "線上分部";
};

const givingClosedAlertTitle = (
    <>
        <span className="text-zh">尚未開放</span>
        <span className="text-en"> Not Open Yet</span>
    </>
);

const CONFGive = () => {
    const { register, handleSubmit, getValues, watch, setValue, clearErrors, formState: { errors, isValid } } = useForm<ConfGiveProps>(
        {
            mode: "onChange", // 這裡設定為 onChange
            defaultValues: {
                amount: 1000,
                note: '',
                upload: false,
                countryCode: '886',
                campus: '台北分部'
            },
        }
    );
    const [alertOpen, setAlertOpen] = useState(false);
    const [addNoteDialogOpen, setAddNoteDialogOpen] = useState(false);
    const [titleHeight, setTitleHeight] = useState(TITLE_MAX_HEIGHT);
    const [message, setMessage] = useState("");
    const [enMessage, setEnMessage] = useState("");
    const [alertTitle, setAlertTitle] = useState<ReactNode>();
    const [giveStatus, setGiveStatus] = useState("form");
    const [isApplePayReady, setIsApplePayReady] = useState(false);
    const [isGooglePayReady, setIsGooglePayReady] = useState(false);
    const [loading, setLoading] = useState(false);
    const [receiptType, setReceiptType] = useState<string>(RECEIPT_TYPES.PERSONAL);
    const [isFocused, setIsFocused] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState("");
    const [givingMethod, setGivingMethod] = useState<"online" | "wire">("online");
    const [creditCardStatus, setCreditCardStatus] = useState({
        number: '',
        expiry: '',
        ccv: ''
    });
    const [outputNote, setOutputNote] = useState('');
    const [privacyPolicyDialogOpen, setPrivacyPolicyDialogOpen] = useState(false);
    const [isGivingLockBypassed, setIsGivingLockBypassed] = useState(false);
    const [givingLockPasswordDialogOpen, setGivingLockPasswordDialogOpen] = useState(false);
    const [givingLockPasswordInput, setGivingLockPasswordInput] = useState("");
    const [givingLockPasswordError, setGivingLockPasswordError] = useState("");
    const hasTrackedGiveStart = useRef(false);
    const amountAtFocus = useRef<number | null>(null);
    const lastTrackedAmount = useRef<number | null>(null);
    const lastTrackedPaymentInfo = useRef<string | null>(null);
    const paymentSubmissionInProgress = useRef(false);
    const failureTrackedForAttempt = useRef(false);
    const campusSelectedManually = useRef(false);
    const appleMerchantIdRef = useRef<string>(import.meta.env.VITE_APPLE_MERCHANT_ID || '');
    const googleMerchantIdRef = useRef<string>(import.meta.env.VITE_GOOGLE_MERCHANT_ID || '');
    const googlePayFeatureEnabled = `${import.meta.env.VITE_ENABLE_GOOGLE_PAY ?? 'true'}`.toLowerCase() !== 'false';
    const [isGooglePayAvailable, setIsGooglePayAvailable] = useState(false);
    const givingLockPassword = `${import.meta.env.VITE_GIVING_LOCK_PASSWORD ?? ''}`.trim();
    const appEnv = `${import.meta.env.VITE_APP_ENV ?? 'production'}`.toLowerCase();
    const isProductionEnvironment = appEnv === 'production';
    const givingStartAt = parseGivingAt(import.meta.env.VITE_GIVING_START_AT);
    const givingEndAt = parseGivingAt(import.meta.env.VITE_GIVING_END_AT);
    const now = new Date();
    const isBeforeGivingStart = isProductionEnvironment && !!givingStartAt && now < givingStartAt;
    const isAfterGivingEnd = isProductionEnvironment && !!givingEndAt && now > givingEndAt;
    const isGivingOpen = !isBeforeGivingStart && !isAfterGivingEnd;
    const givingClosedMessage = isBeforeGivingStart && givingStartAt
        ? `奉獻將於 ${formatMonthDay(givingStartAt)} 開放`
        : isAfterGivingEnd
            ? '目前未開放奉獻'
            : '';
    const canGive = isGivingOpen || isGivingLockBypassed;
    const isGivingLocked = !canGive && !!givingClosedMessage;

    const handleFocus = () => {
        setIsFocused(true);
        amountAtFocus.current = Number(getValues("amount"));
    };

    const trackGiveStartOnce = () => {
        if (hasTrackedGiveStart.current) return;

        const amount = Number(getValues("amount"));
        if (!Number.isFinite(amount) || amount <= 0) return;

        hasTrackedGiveStart.current = true;
        trackGiveStart(amount);
    };

    const handleBlur = () => {
        setIsFocused(false);
    };

    const trackCommittedAmount = () => {
        const amount = Number(getValues("amount"));
        const didChangeAmount = amountAtFocus.current !== amount;
        amountAtFocus.current = null;
        if (!didChangeAmount || !Number.isFinite(amount) || amount <= 0 || lastTrackedAmount.current === amount) return;

        lastTrackedAmount.current = amount;
        trackAmountSelect(amount, "custom");
    };

    const trackPaymentInfoOnce = (amount: number, paymentType: string | undefined) => {
        const normalizedPaymentType = toAnalyticsPaymentType(paymentType);
        const selection = `${amount}:${normalizedPaymentType}`;
        if (lastTrackedPaymentInfo.current === selection) return;

        lastTrackedPaymentInfo.current = selection;
        trackPaymentInfo(amount, normalizedPaymentType);
    };

    const trackFailureOnce = (errorType: "payment_declined" | "gateway_error" | "network_error" | "validation_error" | "unknown") => {
        if (failureTrackedForAttempt.current) return;

        const formValues = getValues();
        const amount = Number(formValues.amount);
        failureTrackedForAttempt.current = true;
        trackGiveFailure(amount, toAnalyticsPaymentType(formValues.paymentType), errorType);
    };

    const handleOpenGivingLockPassword = () => {
        setGivingLockPasswordInput("");
        setGivingLockPasswordError("");
        setGivingLockPasswordDialogOpen(true);
    };

    const handleCloseGivingLockPassword = () => {
        setGivingLockPasswordDialogOpen(false);
        setGivingLockPasswordError("");
    };

    const handleSubmitGivingLockPassword = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!givingLockPassword) {
            setGivingLockPasswordError("解除密碼尚未設定");
            return;
        }

        if (givingLockPasswordInput.trim() !== givingLockPassword) {
            setGivingLockPasswordError("密碼錯誤");
            return;
        }

        setIsGivingLockBypassed(true);
        setGivingLockPasswordDialogOpen(false);
        setGivingLockPasswordInput("");
        setGivingLockPasswordError("");
    };

    // **初始化設定 **
    useEffect(() => {

        const tappayAppId = Number(import.meta.env.VITE_TAPPAY_APP_ID) || 0;
        const tappayAppKey = import.meta.env.VITE_TAPPAY_APP_KEY || '';
        const appleMerchantId = appleMerchantIdRef.current;
        const googleMerchantId = googleMerchantIdRef.current;
        const isApplePayConfigured = Boolean(appleMerchantId);
        const isGooglePayConfigured = Boolean(googleMerchantId) && googlePayFeatureEnabled;
        const rawTapPayEnv = (import.meta.env.VITE_TAPPAY_ENV || '').toLowerCase();
        const tappayEnv: 'production' | 'sandbox' = rawTapPayEnv === 'sandbox' ? 'sandbox' : 'production';
        const paymentApiUrl = import.meta.env.VITE_PAYMENT_API_URL || 'http://localhost:3000/api/payment';

        if (!tappayAppId || !tappayAppKey) {
            // Error handling
            console.error("Missing TapPay configuration in environment variables.");
        }

        if (!import.meta.env.VITE_PAYMENT_API_URL) {
            console.warn(`VITE_PAYMENT_API_URL missing; falling back to ${paymentApiUrl}`);
        }

        TPDirect.setupSDK(
            tappayAppId,
            tappayAppKey,
            tappayEnv,
        );

        TPDirect.paymentRequestApi.checkAvailability();

        if (isApplePayConfigured) {
            TPDirect.paymentRequestApi.setupApplePay({
                merchantIdentifier: appleMerchantId,
                countryCode: 'TW',
            });
        } else {
            console.warn("Apple Pay merchant identifier is missing. Apple Pay will be disabled until it is configured.");
        }

        if (isGooglePayConfigured) {
            const googlePaySetting = {
                googleMerchantId: googleMerchantId,
                allowedCardAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
                merchantName: "The Hope",
            }
            loadGooglePaySdk()
                .then(() => {
                    TPDirect.googlePay.setupGooglePay(googlePaySetting);
                    setIsGooglePayAvailable(true);
                })
                .catch(() => {
                    console.warn("Google Pay SDK failed to load. Google Pay will be unavailable.");
                });
        } else {
            if (!googlePayFeatureEnabled && googleMerchantId) {
                console.warn("Google Pay is disabled via VITE_ENABLE_GOOGLE_PAY.");
            } else {
                console.warn("Google Pay merchant identifier is missing. Google Pay will be disabled until it is configured.");
            }
        }
        const ua = navigator.userAgent.toLowerCase();
        const android = ua.includes("android");
        const iOS = /iphone|ipad|ipod/.test(ua);

        let defaultPayment = PAYMENT_TYPES.CREDIT_CARD;

        if (iOS && isApplePayConfigured) {
            defaultPayment = PAYMENT_TYPES.APPLE_PAY;
        } else if (android && isGooglePayConfigured) {
            defaultPayment = PAYMENT_TYPES.GOOGLE_PAY;
        }

        setSelectedPayment(defaultPayment);
        setValue('paymentType', defaultPayment, { shouldValidate: true });
    }, []);

    useEffect(() => {
        TPDirectCardOnUpdate();
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        fetch("https://ipwho.is/?fields=success,country_code,region,city", {
            signal: controller.signal,
            cache: "no-store",
            referrerPolicy: "no-referrer",
        })
            .then((response) => response.ok ? response.json() : null)
            .then((result) => {
                const campus = result?.success ? campusFromApproximateLocation(result) : null;
                if (
                    !campusSelectedManually.current &&
                    campus &&
                    ["台北分部", "台中分部", "線上分部"].includes(campus)
                ) {
                    setValue("campus", campus, { shouldValidate: true });
                }
            })
            .catch(() => {
                // Campus selection remains on the default if location lookup is unavailable.
            });

        return () => controller.abort();
    }, [setValue]);


    useEffect(() => {
        if (receiptType === RECEIPT_TYPES.COMPANY) {
            setValue("upload", false);
            setValue("nationalid", "");
        }
    }, [receiptType, watch('upload')]);

    // 設置 Credit Card 信用卡 欄位狀態
    const TPDirectCardOnUpdate = () => {
        TPDirect.card.onUpdate((update: any) => {
            // 檢查欄位是否無效
            const isInvalid = (status: number) => status === 3 || status === 2;
            const isRequired = (status: number) => status === 1;

            setCreditCardStatus({
                number: isRequired(update.status.number) ? "Required 必填" : isInvalid(update.status.number) ? "Invalid Card Number\n卡號無效" : "",
                expiry: isRequired(update.status.expiry) ? "Required 必填" : isInvalid(update.status.expiry) ? "Invalid Expiration Date\n到期日無效" : "",
                ccv: isRequired(update.status.ccv) ? "Required 必填" : isInvalid(update.status.ccv) ? "Invalid Security Code\n安全碼無效" : "",
            });
        });
    };

    useEffect(() => {
        if (!isValid) {
            setIsGooglePayReady(false);
            setIsApplePayReady(false);
            return;
        }

        switch (watch('paymentType')) {
            case PAYMENT_TYPES.APPLE_PAY:
                setupApplePay();
                break;
            case PAYMENT_TYPES.GOOGLE_PAY:
                setIsGooglePayReady(true);
                break;
            default:
                // 沒有 default 好像怪怪的，但想不到可以放什麼 lol
                break;
        };

        // eslint-disable-next-line
    }, [errors, isValid, watch('paymentType'), watch('amount')]);


    // **提交**
    const onSubmit: SubmitHandler<ConfGiveProps> = (data) => {
        if (!canGive) {
            handleOpenAlert(givingClosedMessage, isBeforeGivingStart && givingStartAt ? `The Hope Giving will open on ${formatMonthDay(givingStartAt)}` : "Giving is currently unavailable.", givingClosedAlertTitle);
            return;
        }

        if (data.paymentType === "credit-card") {
            setupCreditCard();
        };
    };


    // **設置 Apple Pay**
    const setupApplePay = async () => {
        if (!canGive) {
            setIsApplePayReady(false);
            handleOpenAlert(givingClosedMessage, isBeforeGivingStart && givingStartAt ? `The Hope Giving will open on ${formatMonthDay(givingStartAt)}` : "Giving is currently unavailable.", givingClosedAlertTitle);
            return;
        }

        if (!appleMerchantIdRef.current) {
            setIsApplePayReady(false);
            handleOpenAlert("Apple Pay 尚未設定，請改用其他付款方式", "Apple Pay is not configured for this environment. Please choose another payment method.");
            return;
        }

        setIsApplePayReady(true);

        const paymentRequest = {
            supportedNetworks: ["AMEX", "JCB", "MASTERCARD", "VISA"],
            supportedMethods: ["apple_pay"],
            displayItems: [{ label: "TapPay", amount: { currency: "TWD", value: getValues("amount").toString() } }],
            total: { label: "付給 TapPay", amount: { currency: "TWD", value: getValues("amount").toString() } },
        };

        // TEMP. LOG
        console.log("Apple Pay merchant ID:", appleMerchantIdRef.current);
        console.log("TapPay env:", import.meta.env.VITE_TAPPAY_ENV);
        console.log("Payment request:", paymentRequest);



        const result: {
            browserSupportPaymentRequest: boolean,
            canMakePaymentWithActiveCard: boolean
        } = await new Promise((resolve) => {
            TPDirect.paymentRequestApi.setupPaymentRequest(paymentRequest, resolve);
        });

        if (!result.browserSupportPaymentRequest) {
            setIsApplePayReady(false);
            handleOpenAlert("此裝置不支援 Apple Pay", "This device does not support Apple Pay");
            return;
        };

        if (!result.canMakePaymentWithActiveCard) {
            setIsApplePayReady(false);
            handleOpenAlert("此裝置沒有支援的卡片可以付款", "This device does not have a supported card for payment");
            return;
        };

        setTimeout(() => {
            const button = document.querySelector("#apple-pay-button-container");

            if (button) {
                button.innerHTML = "";
                TPDirect.paymentRequestApi.setupTappayPaymentButton("#apple-pay-button-container", (getPrimeResult: any) => {
                    postPay(getPrimeResult.prime);
                });
            };
        }, 100);
    };


    const setupGooglePay = () => {
        if (!canGive) {
            setIsGooglePayReady(false);
            handleOpenAlert(givingClosedMessage, isBeforeGivingStart && givingStartAt ? `The Hope Giving will open on ${formatMonthDay(givingStartAt)}` : "Giving is currently unavailable.", givingClosedAlertTitle);
            return;
        }

        if (!googlePayFeatureEnabled || !googleMerchantIdRef.current) {
            setIsGooglePayReady(false);
            handleOpenAlert("Google Pay 暫時無法使用，請改用其他付款方式", "Google Pay is temporarily unavailable. Please choose another payment method.");
            return;
        }

        setIsGooglePayReady(true);

        const paymentRequest = {
            allowedNetworks: ["AMEX", "JCB", "MASTERCARD", "VISA"],
            price: getValues("amount").toString(), // optional
            currency: "TWD", // optional
        }
        TPDirect.googlePay.setupPaymentRequest(paymentRequest, function (err: any, result: any) {
            console.log(err);
            if (result.canUseGooglePay) {
                TPDirect.googlePay.getPrime(function (err: any, prime: any) {
                    console.log(err);

                    if (err) {
                        trackFailureOnce("gateway_error");
                        handleOpenAlert("此裝置不支援 Google Pay", "This device does not support Google Pay");
                        return;
                    };
                    postPay(prime);
                });
            }
        });
    }



    // **設置 Credit Card 信用卡**
    const setupCreditCard = () => {
        // 檢查各個欄位的狀態
        const tappayStatus = TPDirect.card.getTappayFieldsStatus();

        // 檢查欄位是否無效
        const isInvalid = (status: number) => status === 3 || status === 2;
        const isRequired = (status: number) => status === 1;
        const valid = tappayStatus.status.number === 0 && tappayStatus.status.expiry === 0 && tappayStatus.status.ccv === 0;


        setCreditCardStatus({
            number: isRequired(tappayStatus.status.number) ? "Required 必填" : isInvalid(tappayStatus.status.number) ? "Invalid Card Number\n卡號無效" : "",
            expiry: isRequired(tappayStatus.status.expiry) ? "Required 必填" : isInvalid(tappayStatus.status.expiry) ? "Invalid Expiration Date\n到期日無效" : "",
            ccv: isRequired(tappayStatus.status.ccv) ? "Required 必填" : isInvalid(tappayStatus.status.ccv) ? "Invalid security code\n安全碼無效" : "",
        });



        if (valid) {
            TPDirect.card.getPrime((result: any) => {

                if (result.status !== 0) {
                    trackFailureOnce("payment_declined");
                    document.body.style.backgroundColor = "#EDE6DA";
                    document.querySelector(".wrapper")?.classList.add("successAndFailWrapper");
                    setGiveStatus("fail");
                    return;
                };
                // 傳送至後端 API
                postPay(result.card.prime);
            });
        };
    }

    // **傳送至後端 API**
    const postPay = (prime: string) => {
        if (paymentSubmissionInProgress.current) return;
        paymentSubmissionInProgress.current = true;
        failureTrackedForAttempt.current = false;
        setLoading(true);
        console.log("✅ 付款中");
        const paymentApiUrl = import.meta.env.VITE_PAYMENT_API_URL;
        const formValues = getValues();
        const amount = Number(formValues.amount ?? watch("amount"));
        const analyticsPaymentType = toAnalyticsPaymentType(formValues.paymentType);
        trackPaymentInfoOnce(amount, formValues.paymentType);
        trackGiveSubmit(amount, analyticsPaymentType);

        if (!paymentApiUrl) {
            console.error("❌ 錯誤：未設定 VITE_PAYMENT_API_URL，無法傳送付款請求。");
            setError();
            return;
        }

        const sanitizedCountryCode = (formValues.countryCode || '').toString().replace(/^[+ ]+/, '');
        const phoneCode = sanitizedCountryCode ? `+${sanitizedCountryCode}` : '+886';
        const normalizedPaymentType = (formValues.paymentType || PAYMENT_TYPES.CREDIT_CARD).replace(/-/g, '_');

        const requiresReceipt = receiptType === RECEIPT_TYPES.PERSONAL || receiptType === RECEIPT_TYPES.COMPANY;

        const payload = {
            prime: prime,
            amount,
            cardholder: {
                name: formValues.name ? formValues.name : "未填寫",
                email: formValues.email,
                phoneCode,
                phone_number: formValues.phone_number,
                receipt: requiresReceipt,
                paymentType: normalizedPaymentType,
                upload: Boolean(formValues.upload),
                campus: formValues.campus || '',
                receiptName: formValues.receiptName || '',
                nationalid: formValues.nationalid || '',
                company: formValues.company || '',
                taxid: formValues.taxid || '',
                note: formValues.note || '',
            }
        };

        console.log("📤 傳送至後端的資料：", payload);

        fetch(paymentApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
            .then(async (response) => {
                const contentType = response.headers.get('content-type') ?? '';
                const responseText = await response.text();

                if (!response.ok) {
                    throw new Error(`Payment API responded with status ${response.status}`);
                }

                if (!contentType.includes('application/json')) {
                    throw new Error(`Unexpected response format: ${responseText.slice(0, 100)}`);
                }

                try {
                    return JSON.parse(responseText);
                } catch {
                    throw new Error('Payment API returned invalid JSON.');
                }
            })
            .then((res) => {
                console.log("✅ 付款成功");
                if (res.status === 0) {
                    const transactionId = getConfirmedTransactionId(res);
                    if (transactionId) {
                        trackGiveSuccess(transactionId, amount);
                    }
                    document.body.style.backgroundColor = "#EDE6DA";
                    document.querySelector(".wrapper")?.classList.add("successAndFailWrapper");
                    setGiveStatus("success");
                    setLoading(false);
                    paymentSubmissionInProgress.current = false;
                    // 滑動到頂端
                    window.scrollTo({
                        top: 0,
                        behavior: "smooth",
                    });
                    // 3 秒後跳轉至 Prayer Map
                    setTimeout(() => {
                        window.location.href = "https://prayermap.thehope.co/";
                    }, 3000);
                } else {
                    setError("gateway_error");
                };
            })
            .catch((error) => {
                console.log("❌ 錯誤：", error);
                setError(normalizePaymentError(error));
            });
    }

    // **設置 錯誤訊息**
    const setError = (errorType: "payment_declined" | "gateway_error" | "network_error" | "validation_error" | "unknown" = "unknown") => {
        trackFailureOnce(errorType);
        document.querySelector(".wrapper")?.classList.add("successAndFailWrapper");
        setGiveStatus("fail");
        setLoading(false);
        paymentSubmissionInProgress.current = false;
        // 滑動到頂端
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }

    // **輸入框內禁止輸入 0 開頭**
    const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // 如果輸入的值是 0 開頭，去掉 0
        if (value.startsWith('0')) {
            e.target.value = value.slice(1);
        };
    };

    // **設置 alert dialog **
    const handleOpenAlert = (message: string, enMessage: string, title?: ReactNode) => {
        setMessage(message);
        setEnMessage(enMessage);
        setAlertTitle(title);
        setAlertOpen(true);
    };

    // **關閉 alert dialog **
    const handleCloseAlert = () => {
        setAlertOpen(false);
        setAlertTitle(undefined);
    };

    // **關閉 add note dialog **
    const handleCloseAddNote = () => {

        clearErrors("note");

        if (outputNote) {
            setValue('note', outputNote);
        } else {
            setValue('note', "");
        };
        setAddNoteDialogOpen(false);
    }

    // ** add note dialog confrim**
    const handleConfirmAddNote = () => {
        // note 有沒有過驗證
        if (watch('note').length <= 200) {
            setOutputNote(watch('note'));
            setAddNoteDialogOpen(false);
        } else {
            return;
        };
    }

    // **關閉 privacy policy **
    const handleClosePrivacyPolicy = () => {
        setPrivacyPolicyDialogOpen(false);
    }

    const isFormView = giveStatus === "form";
    const isMobileViewport = useIsMobileViewport();
    const {
        titleMinHeight,
        titleCollapseThreshold,
        collapsedMinHeight,
        collapsedTopOffset,
    } = getResponsiveTitleMetrics(isMobileViewport);
    const showFullBanner = isFormView && titleHeight > titleCollapseThreshold;
    const collapsedHeight = Math.max(collapsedMinHeight, titleMinHeight * COLLAPSED_HEIGHT_RATIO, titleHeight * COLLAPSED_HEIGHT_RATIO);
    const effectiveTitleHeight = isFormView ? (showFullBanner ? titleHeight : collapsedHeight) : 124;
    const titleTopOffset = isFormView && !showFullBanner ? collapsedTopOffset : 0;
    const collapsedWrapperMarginBase = isMobileViewport ? 436.75 * 0.5 : 436.75;

    const safeAreaTopInset = "env(safe-area-inset-top, 0px)";
    const wrapperMarginBase = giveStatus !== "form"
        ? 0
        : (effectiveTitleHeight > 124
            ? (effectiveTitleHeight + scrollY + titleTopOffset)
            : collapsedWrapperMarginBase);
    const wrapperMarginTop = giveStatus !== "form"
        ? 0
        : `calc(${wrapperMarginBase}px + ${safeAreaTopInset})`;

    return (
        <div>
            {giveStatus !== "success" && (
                <Header titleHeight={titleHeight} setTitleHeight={setTitleHeight} giveStatus={giveStatus} />
            )}
            <div className={`wrapper ${giveStatus === "success" ? "successWrapper" : ""}`}
                style={{ marginTop: wrapperMarginTop }}>
                {(giveStatus === "success" || giveStatus === "fail") && (
                    <Suspense fallback={null}>
                        <GiveSucessOrFail giveStatus={giveStatus} />
                    </Suspense>
                )}
                {giveStatus === "form" && (
                    <Box className="form">
                        <Box className="form-block">
                            <Box className="giving-method-toggle">
                                <Button
                                    type="button"
                                    className={givingMethod === "online" ? "giving-method-button active" : "giving-method-button"}
                                    onClick={() => setGivingMethod("online")}
                                >
                                    信用卡 / 行動支付
                                </Button>
                                <Button
                                    type="button"
                                    className={givingMethod === "wire" ? "giving-method-button active" : "giving-method-button"}
                                    onClick={() => setGivingMethod("wire")}
                                >
                                    國內外銀行匯款
                                </Button>
                            </Box>
                            {givingMethod === "wire" ? <WireTransfer /> : (
                            <form
                                autoComplete="off"
                                onFocusCapture={trackGiveStartOnce}
                                onSubmit={handleSubmit(onSubmit, () => trackFailureOnce("validation_error"))}
                            >
                                <TextField
                                    {...register("amount", {
                                        valueAsNumber: true,
                                        required: "Required 必填",
                                        validate: (value) => value > 0 || "Amount must be greater than zero.\n金額必須大於 0",
                                    })}
                                    slotProps={{
                                        input: {
                                            startAdornment: (
                                                <InputAdornment
                                                    position="start"
                                                    sx={{
                                                        color: isFocused ? "rgb(223, 88, 59)" : "#000007"
                                                    }}
                                                >
                                                    {isFocused}NT$
                                                </InputAdornment>
                                            ),
                                        },
                                    }}
                                    className="amount basic-formControl"
                                    type="tel"
                                    error={!!errors.amount}
                                    onFocus={handleFocus}
                                    onBlur={() => {
                                        handleBlur();
                                        trackCommittedAmount();
                                    }}
                                    helperText={errors.amount?.message}
                                />
                                {!isNaN(watch("amount")) && watch("amount") !== null &&
                                    <ExchangeRate value={watch("amount")} />
                                }
                                <TextField
                                    {...register("email", {
                                        required: "Required 必填",
                                        validate: (value) => {
                                            const emailPattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;
                                            // 斷行
                                            return emailPattern.test(value) || "Email invalid\n無效的電子信箱";
                                        }
                                    })}
                                    placeholder="Email"
                                    className="email basic-formControl"
                                    name="email"
                                    error={!!errors.email}
                                    helperText={errors.email?.message}
                                />
                                <Box className="phone-block">
                                    <TextField
                                        {...register("countryCode", {
                                            required: "Required 必填",
                                            // 只能輸入數字
                                            validate: (value) => {
                                                const countryCodePattern = /^[0-9]{1,3}$/; // 最多3碼數字
                                                return countryCodePattern.test(value) || "IDP invalid\n無效的國碼";
                                            }
                                        })}
                                        defaultValue="886"
                                        slotProps={{
                                            input: {
                                                readOnly: false,
                                                startAdornment: <InputAdornment position="start">+</InputAdornment>,
                                                inputProps: {
                                                    autoComplete: "off",
                                                    inputMode: "numeric",
                                                    pattern: "[0-9]*",
                                                },
                                            },
                                        }}
                                        type="text"
                                        error={!!errors.countryCode}
                                        helperText={errors.countryCode?.message}
                                        className="phone-code basic-formControl"
                                    />
                                    <TextField
                                        {...register("phone_number", {
                                            required: "Required 必填",
                                            validate: (value) => {
                                                const phonePattern = /^[0-9]{8,15}$/;
                                                return phonePattern.test(value) || "Mobile Number invalid\n無效的手機號碼";
                                            }
                                        })}
                                        slotProps={{
                                            input: {
                                                inputProps: {
                                                    autoComplete: "tel",
                                                    inputMode: "numeric",
                                                    pattern: "[0-9]*",
                                                },
                                            },
                                        }}
                                        placeholder="Mobile Number"
                                        className="phone-number basic-formControl"
                                        type="tel"
                                        error={!!errors.phone_number}
                                        helperText={errors.phone_number?.message}
                                        onInput={handlePhoneInputChange}
                                    />
                                </Box>
                                <Box className="contact-information">
                                <p className="contact-information-note text-zh">如要與教會奉獻數據整併，請填寫相同的聯絡資料</p>
                                    <Receipt setReceiptType={setReceiptType}
                                        receiptType={receiptType}
                                        register={register}
                                        errors={errors}
                                        onCampusChange={() => {
                                            campusSelectedManually.current = true;
                                        }}></Receipt>
                                    <Upload receiptType={receiptType}
                                        upload={watch("upload")}
                                        register={register}
                                        errors={errors}></Upload>
                                    {selectedPayment && (
                                        <PaymentSelect register={register}
                                            selectedPayment={selectedPayment}
                                            showGooglePay={isGooglePayAvailable}
                                            onPaymentSelect={(paymentType) => {
                                                trackPaymentInfoOnce(Number(getValues("amount")), paymentType);
                                            }}></PaymentSelect>
                                    )}
                                    <CreditCard paymentType={watch("paymentType")}
                                        register={register}
                                        errors={errors}
                                        creditCardStatus={creditCardStatus}></CreditCard>

                                    <div className="note-block" onClick={() => setAddNoteDialogOpen(true)}>

                                        {!outputNote ? (
                                            <>
                                                <img loading="lazy" className="add-icon" src="/images/add-icon.webp" alt="新增" />
                                                <p className="add-note-label">
                                                    <span className="text-en font-gotham-light">Add Note</span>
                                                    <span className="text-zh"> 新增備註</span>
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <img loading="lazy" className="edit-icon" src="/images/edit-icon.webp" alt="編輯" />
                                                <p className="edit-note-label">
                                                    <span className="text-en font-gotham-light">Note</span>
                                                    <span className="text-zh"> 備註</span>
                                                    : {outputNote}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                    <div>
                                        <FormControl error={!!errors.privacyPolicy} className="privacy-policy-block">
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        {...register("privacyPolicy", { required: "Required 必填" })}
                                                        className="checkbox-custom"
                                                    />
                                                }
                                                label={
                                                    <p className="privacy-policy-note text-zh">
                                                        點擊送出後即代表你已閱讀並同意「
                                                        <a
                                                            href="#"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                setPrivacyPolicyDialogOpen(true);
                                                            }}
                                                        >
                                                            個資搜集
                                                        </a>
                                                        」於本機構使用
                                                    </p>
                                                }
                                            />
                                            {errors.privacyPolicy && (
                                                <FormHelperText >{errors.privacyPolicy.message}</FormHelperText>
                                            )}
                                        </FormControl>
                                    </div>

                                    <PayButton paymentType={watch('paymentType')}
                                        setupGooglePay={setupGooglePay}
                                        setupApplePay={setupApplePay}
                                        isApplePayReady={isApplePayReady}
                                        isGooglePayReady={isGooglePayReady}
                                        disabled={!canGive}
                                        disabledMessage={!canGive ? givingClosedMessage : ''}></PayButton>
                                </Box>
                            </form>
                            )}
                        </Box>
                    </Box>
                )}
                {alertOpen && (
                    <Suspense fallback={null}>
                        <ConfAlertDialog
                            open
                            title={alertTitle}
                            message={message}
                            enMessage={enMessage}
                            onClose={handleCloseAlert}
                            cancelText="CLOSE" />
                    </Suspense>
                )}
                {addNoteDialogOpen && (
                    <Suspense fallback={null}>
                        <ConfNoteDialog
                            open
                            register={register}
                            errors={errors}
                            onClose={handleCloseAddNote}
                            onConfirm={handleConfirmAddNote}
                            noteLength={watch('note').length}
                        />
                    </Suspense>
                )}
                {privacyPolicyDialogOpen && (
                    <Suspense fallback={null}>
                        <ConfPrivacyPolicyDialog
                            open
                            title={<><span className="text-en">The Hope </span><span className="text-zh">教會個人資料使用與隱私政策同意條款</span></>}
                            cancelText="CLOSE"
                            onClose={handleClosePrivacyPolicy}
                        />
                    </Suspense>
                )}
                {loading && (
                    <Box className="loading">
                        <CircularProgress className="loading-icon" />
                    </Box>
                )}
                {isGivingLocked && (
                    <Box className="giving-lock-overlay">
                        <button
                            type="button"
                            className="giving-lock-close"
                            aria-label="解除奉獻時間限制"
                            onClick={handleOpenGivingLockPassword}
                        >
                            X
                        </button>
                        <p className="giving-lock-message text-zh">{givingClosedMessage}</p>
                    </Box>
                )}
                <Dialog
                    open={givingLockPasswordDialogOpen}
                    onClose={handleCloseGivingLockPassword}
                    className="giving-lock-dialog"
                >
                    <form onSubmit={handleSubmitGivingLockPassword}>
                        <DialogContent>
                            <TextField
                                className="width100 m-t-8"
                                type="password"
                                placeholder="admin code"
                                value={givingLockPasswordInput}
                                onChange={(event) => {
                                    setGivingLockPasswordInput(event.target.value);
                                    setGivingLockPasswordError("");
                                }}
                                error={!!givingLockPasswordError}
                                helperText={givingLockPasswordError}
                                autoFocus
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button
                                type="button"
                                onClick={handleCloseGivingLockPassword}
                                className="dialog-button glass-button font-gotham-light"
                            >
                                CANCEL
                            </Button>
                            <Button
                                type="submit"
                                className="dialog-button glass-button glass-button-accent font-gotham-light"
                            >
                                CONFIRM
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>
            </div>
        </div>
    );
};

export default CONFGive;
