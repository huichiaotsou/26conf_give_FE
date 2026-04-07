import { useEffect } from "react";
import { TextField } from "@mui/material";
import { FieldErrors, UseFormRegister } from "react-hook-form";


interface CreditCardProps {
    paymentType: string;
    register: UseFormRegister<any>;
    errors: FieldErrors<any>;
    creditCardStatus: {
        number: string,
        expiry: string,
        ccv: string
    }
}

const CreditCard: React.FC<CreditCardProps> = (props) => {
    const { paymentType, register, errors, creditCardStatus } = props;
    useEffect(() => {
        // 只在選擇 credit-card 時執行設置
        if (paymentType === "credit-card") {
            // 設置 TPDirect
            TPDirect.card.setup({
                fields: {
                    number: {
                        element: '#card-number',
                        placeholder: '**** **** **** ****'
                    },
                    expirationDate: {
                        element: document.getElementById('card-expiration-date'),
                        placeholder: 'MM / YY'
                    },
                    ccv: {
                        element: '#card-ccv',
                        placeholder: 'ccv'
                    }
                },
                styles: {
                    'input': {
                        'font-size': '16px',
                        'color': '#000007',
                        'font-family': "'Gotham-Light', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
                    }
                }
            });
        }
    }, [paymentType]); // 依賴於 paymentType.value 變更來執行

    if (paymentType === "credit-card") {
        return (
            <div className="credit-card-block">
                <div>
                    <p className="label-chinese">持卡人姓名</p>
                    <p className="label-english font-gotham-light">Card Holder Name</p>
                    <TextField
                        {...register("name", {
                            required: paymentType === "credit-card" ? "Required 必填" : false,
                        })}
                        sx={{ marginTop: "8px" }}
                        id="outlined-required"
                        className="phone-number width100 basic-formControl"
                        name="name"
                        type="text"
                        error={!!errors.name}
                        helperText={typeof errors.name?.message === 'string' ? errors.name?.message : undefined}
                    />
                </div>
                <div>
                    <p className="label-chinese">Credit Card 信用卡卡號</p>
                    <p className="label-english font-gotham-light">Card Number</p>
                    <div className="tpfield width100" style={!creditCardStatus.number ? { border: "none" } : { border: "1px solid red" }} id="card-number"></div>
                    <p className="valid-text">{creditCardStatus.number}</p>
                </div>
                <div className="credit-card-date-ccv-block">
                    <div>
                        <p className="label-chinese">有效日期</p>
                        <p className="label-english font-gotham-light">Expiration Date</p>
                        <div className="tpfield width100" style={!creditCardStatus.expiry ? { border: "none" } : { border: "1px solid red" }} id="card-expiration-date"></div>
                        <p className="valid-text">{creditCardStatus.expiry}</p>
                    </div>
                    <div>
                        <p className="label-chinese">末三碼</p>
                        <p className="label-english font-gotham-light">CCV</p>
                        <div className="tpfield width100" style={!creditCardStatus.ccv ? { border: "none" } : { border: "1px solid red" }} id="card-ccv"></div>
                        <p className="valid-text">{creditCardStatus.ccv}</p>
                    </div>
                </div>
            </div>
        );
    };

    return null; // 如果不是 credit-card, 可以返回 null 或其他內容
};

export default CreditCard;
