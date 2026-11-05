import { Button } from "@mui/material";

const GiveSucessOrFail = ({ giveStatus }: { giveStatus: string }) => {
    return (
        <div className="success">
            {giveStatus === "fail" && <img loading="lazy" src="/images/fail.webp" alt="fail" />}
            <div>
                <p className="success-title text-zh">{giveStatus === "fail" ? "奉獻失敗" : "奉獻完成"}</p>
                <p className="success-title-english">{giveStatus === "fail" ? "Give Failed" : "Give Success"}</p>
            </div>
            <div>
                <p className="note-chinese">我們會將奉獻結果寄給您。請留意您的信箱</p>
                <p className="note-english">We will email you the result of giving.<br />Please check your email.</p>
            </div>
            <Button
                variant="contained"
                className="continue-button glass-button glass-button-accent width100"
                onClick={() => {
                    window.location.href = "/";
                }}>
                <span className="text-en">BACK TO HOME</span>
            </Button>
        </div>
    );
};

export default GiveSucessOrFail;
