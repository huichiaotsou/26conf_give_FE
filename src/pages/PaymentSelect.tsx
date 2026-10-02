import { Select, MenuItem, Box } from "@mui/material";
import { UseFormRegister } from "react-hook-form";

interface PaymentSelectProps {
    register: UseFormRegister<any>;
    selectedPayment: string;
    showGooglePay: boolean;
    onPaymentSelect: (paymentType: string) => void;
}


const PaymentSelect: React.FC<PaymentSelectProps> = (props) => {
    const { register, selectedPayment, showGooglePay, onPaymentSelect } = props;
    const paymentTypeRegistration = register("paymentType");
    const paymentOptions = [
        { label: "Apple Pay", value: "apple-pay" },
    ];

    if (showGooglePay) {
        paymentOptions.push({ label: "Google Pay", value: "google-pay" });
    }

    return (
        <Select
            displayEmpty
            {...paymentTypeRegistration}
            onChange={(event) => {
                paymentTypeRegistration.onChange(event);
                onPaymentSelect(event.target.value);
            }}
            defaultValue={selectedPayment}
            className="payment-method width100 basic-formControl"
            renderValue={(selected) => {
                let text = "";

                // 動態選擇對應的圖標和文字
                switch (selected) {
                    case "apple-pay":
                        text = "Apple Pay";
                        break;
                    case "google-pay":
                        text = "Google Pay";
                        break;
                    case "credit-card":
                        text = "Credit Card 信用卡";
                        break;
                }

                return (
                    <Box className="payment-method-icon-text">
                        {text}
                    </Box>
                );
            }}
        >
            {paymentOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                    {option.label}
                </MenuItem>
            ))}
            <MenuItem value="credit-card">
                Credit Card 信用卡
            </MenuItem>
        </Select>
    )
}

export default PaymentSelect
