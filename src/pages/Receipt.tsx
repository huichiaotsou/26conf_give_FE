import { Button, TextField } from "@mui/material";
import { FieldErrors, UseFormRegister } from "react-hook-form";

interface ReceiptProps {
    setReceiptType: React.Dispatch<React.SetStateAction<string>>;
    receiptType: string;
    register: UseFormRegister<any>;
    errors: FieldErrors<any>;
    onCampusChange: () => void;
}

const BRANCH_OPTIONS = ["台北分部", "線上分部", "台中分部", "其他"];

const Receipt: React.FC<ReceiptProps> = (props) => {
    const { register, errors, setReceiptType, receiptType, onCampusChange } = props;
    const campusRegistration = register("campus");

    // 統一編號的檢查碼驗證規則
    const taxIDNumberPattern = (value: any) => {
        // 檢查字元是否符合規則
        const regex = /^[0-9]{8}$/;

        // 統一編號 邏輯乘數
        const logicMultipliers = [1, 2, 1, 2, 1, 2, 4, 1];

        // 計算陣列總和
        const sum = (numbers: any) => {
            const initialValue = 0;
            const sumWithInitial = numbers.reduce(
                (accumulator: any, currentValue: any) => Number(accumulator) + Number(currentValue),
                initialValue,
            );
            return sumWithInitial
        }

        if (value.length !== 8 || !regex.test(value)) {
            return 'Tax ID Number invalid\n統一編號格式錯誤';
        }

        const logicProductArr: number[] = []
        let logicProduct = 0;
        // 通一編號倒數第二位為7時，乘積之和最後第二位數取0或1均可，其中之一和能被5整除，則符合統編邏輯
        if (value[6] == "7") {
            for (let i = 0; i < value.length; i++) {
                if (i != 6) {
                    logicProductArr.push(parseInt(value[i]) * logicMultipliers[i])
                }
            }
        } else {
            for (let i = 0; i < value.length; i++) {
                logicProductArr.push(parseInt(value[i]) * logicMultipliers[i]);
            }
        }

        for (const item of logicProductArr) {
            ;
            logicProduct += sum((item.toString()).split(''))
        }

        if (value[6] === '7' && (logicProduct % 5 === 0 || (logicProduct + 1) % 5 === 0)) {
            return true;
        } else if (logicProduct % 5 === 0) {
            return true;
        }

        return 'Tax ID Number invalid\n統一編號格式錯誤';
    }


    return (
        <>
            <div className="branch-select-block">
                <p className="label-chinese text-zh">所屬分部</p>
                <p className="label-english text-en">Campus</p>
                <TextField
                    select
                    SelectProps={{ native: true }}
                    className="branch-select width100 basic-formControl"
                    {...campusRegistration}
                    onChange={(event) => {
                        campusRegistration.onChange(event);
                        onCampusChange();
                    }}
                >
                    {BRANCH_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </TextField>
            </div>
            <div className="receipt-name-block">
                <div className="label-custom">
                    <p className="label-chinese text-zh">開立奉獻收據資訊</p>
                    <p className="label-english text-en font-gotham-light">Information for Issuing Offering Receipts</p>
                </div>
                <div>
                    <Button
                        onClick={() => setReceiptType('personal')}
                        className={`personal-company-button glass-button ${receiptType === "personal" ? "clicked" : "not-clicked"}`}
                    >個人</Button>
                    <Button
                        onClick={() => setReceiptType('company')}
                        className={`personal-company-button glass-button ${receiptType === "company" ? "clicked" : "not-clicked"}`}
                    >企業</Button>
                </div>
                {receiptType === "personal" && (
                    <div>
                        <p className="label-chinese text-zh">收據姓名</p>
                        <p className="label-english text-en">Receipt Name</p>
                        <TextField
                            id="outlined-required"
                            className="receiptName width100 basic-formControl"
                            {...register("receiptName", {
                                required: receiptType === "personal" ? "Required 必填" : false,
                            })}
                            error={!!errors.receiptName}
                            helperText={typeof errors.receiptName?.message === 'string' ? errors.receiptName?.message : undefined}
                        />
                        <p className="contact-information-note text-zh">如有報稅需求，請填寫與台灣身分證相符的姓名</p>
                    </div>
                )}
            </div>
            {
                receiptType === "company" && (
                    <div className="company-tax-block">
                        <div>
                            <p className="label-chinese text-zh">企業登記全名</p>
                            <p className="label-english text-en">Company's Registered Name</p>
                            <TextField
                                id="outlined-required"
                                className="receiptName width100 basic-formControl"
                                {...register("company", {
                                    // 當 getPaymentType === "company" 時，才需要驗證
                                    required: receiptType === "company" ? "Required 必填" : false,
                                })}
                                error={!!errors.company}
                                helperText={typeof errors.company?.message === 'string' ? errors.company?.message : undefined}
                            />
                        </div>
                        <div>
                            <p className="label-chinese text-zh">統一編號</p>
                            <p className="label-english text-en">Tax ID Number</p>
                            <TextField
                                id="outlined-required"
                                className="m-t-8 width100 basic-formControl"
                                {...register("taxid", {
                                    // 當 getPaymentType === "company" 時，才需要驗證
                                    required: receiptType === "company" ? "Required 必填" : false,
                                    validate: taxIDNumberPattern,
                                })}
                                error={!!errors.taxid}
                                helperText={typeof errors.taxid?.message === 'string' ? errors.taxid?.message : undefined}
                            />
                        </div>
                    </div>
                )
            }
        </>
    )
};

export default Receipt
