import { Button } from "@mui/material";

interface PayButtonProps {
    paymentType: string;
    isApplePayReady: boolean;
    isGooglePayReady: boolean;
    setupGooglePay: () => void;
    setupApplePay: () => void;
    disabled?: boolean;
    disabledMessage?: string;
}

const PayButton: React.FC<PayButtonProps> = (props) => {
    const { paymentType, isApplePayReady, isGooglePayReady, setupGooglePay, setupApplePay, disabled = false, disabledMessage = "" } = props;

    return (
        <>
            {paymentType === "credit-card" && (
                <>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={disabled}
                        className="continue-button glass-button glass-button-accent width100">
                        <span className="text-en">CONTINUE</span>
                        <span className="text-zh"> 下一步</span>
                    </Button>
                    {disabledMessage && (
                        <p className="payment-disabled-message text-zh">{disabledMessage}</p>
                    )}
                </>
            )}
            {paymentType === "apple-pay" && (
                <>
                    {!disabled && isApplePayReady ? (
                        <div id="apple-pay-button-container" onClick={setupApplePay}></div>
                    ) : (
                        <>
                            <button type="button" disabled className="fake-pay-button apple-pay-button"></button>
                            {disabledMessage && (
                                <p className="payment-disabled-message text-zh">{disabledMessage}</p>
                            )}
                        </>
                    )}
                </>

            )}
            {paymentType === "google-pay" && (
                <>
                    {!disabled && isGooglePayReady ? (
                        <button
                            type="button"
                            className="fake-pay-button google-pay-button"
                            onClick={setupGooglePay}
                        ></button>
                    ) : (
                        <>
                            <button
                                type="button"
                                disabled
                                className="fake-pay-button google-pay-button"
                            ></button>
                            {disabledMessage && (
                                <p className="payment-disabled-message text-zh">{disabledMessage}</p>
                            )}
                        </>
                    )}
                </>
            )}
        </>
    )
}

export default PayButton
