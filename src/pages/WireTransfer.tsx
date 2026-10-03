import { useState } from "react";
import { Box, Button } from "@mui/material";
import { FiCheck, FiCopy, FiGlobe } from "react-icons/fi";

const CopyButton = ({ text, label }: { text: string; label: string }) => {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
    };

    return (
        <Button className="wire-copy-button" type="button" onClick={copy} aria-label={`複製${label}`} title={`複製${label}`}>
            {copied ? <FiCheck /> : <FiCopy />}
        </Button>
    );
};

const WireTransfer = () => (
    <Box className="wire-transfer">
        <Box className="wire-transfer-heading">
            <span className="wire-transfer-icon" aria-hidden="true"><FiGlobe /></span>
            <h2>國內外銀行匯款</h2>
            <p>透過銀行轉帳的方式奉獻，點擊了解詳細匯款資訊。</p>
        </Box>

        <details className="wire-transfer-details" open>
            <summary>國內匯款資訊<span aria-hidden="true">+</span></summary>
            <Box className="wire-transfer-content">
                <p><span>銀行代號:</span><strong>013 國泰世華</strong></p>
                <p><span>帳號:</span><strong>032-03-500953-1</strong><CopyButton text="032035009531" label="帳號" /></p>
                <p><span>戶名:</span><strong>社團法人國際基督教合盼協會</strong></p>
                <p><span>銀行:</span><strong>國泰世華銀行東門分行</strong></p>
            </Box>
        </details>

        <details className="wire-transfer-details">
            <summary>國外匯款資訊 - 非台幣（Foreign Currency / Non-TWD）<span aria-hidden="true">+</span></summary>
            <Box className="wire-transfer-content wire-transfer-foreign">
                <p><span>帳號:</span><strong>032-08-704567-5</strong><CopyButton text="032087045675" label="帳號" /></p>
                <p><span>戶名:</span><strong>THE HOPE</strong></p>
                <p><span>SWIFT Code:</span><strong>UWCBTWTP</strong><CopyButton text="UWCBTWTP" label="SWIFT Code" /></p>
                <p><span>銀行:</span><strong>CATHAY UNITED BANK</strong><CopyButton text="CATHAY UNITED BANK" label="銀行" /></p>
                <p><span>分行名稱:</span><strong>TUNG MEN BRANCH</strong><CopyButton text="TUNG MEN BRANCH" label="分行名稱" /></p>
                <p><span>銀行地址:</span><strong>No. 9, Sec.3, XIN-YI Road, Taipei City, Taiwan (R.O.C)</strong><CopyButton text="No. 9, Sec.3, XIN-YI Road, Taipei City, Taiwan (R.O.C)" label="銀行地址" /></p>
            </Box>
        </details>

        <Box className="wire-transfer-notice">
            <p>匯款完成後請填寫此表單，以便財務部作帳及開立年度奉獻收據。</p>
            <Button className="wire-transfer-form-button" component="a" href="https://bankgiving.paperform.co/">
                前往表單
            </Button>
        </Box>
    </Box>
);

export default WireTransfer;
