import { Button } from "@mui/material";

const GiveSucessOrFail = ({ giveStatus }: { giveStatus: string }) => {
    return (
        <div className="success">
            {giveStatus === "fail"
                ? <img loading="lazy" src="/images/fail.webp" alt="fail" />
                : <img loading="lazy" src="/images/success.webp" alt="success" />}
            <div>
                <p className="success-title text-zh">{giveStatus === "fail" ? "奉獻失敗" : "奉獻完成"}</p>
                <p className="success-title-english">{giveStatus === "fail" ? "FAILED" : "SUCCESS!"}</p>
            </div>
            <div>
                {giveStatus === "fail" ?
                    <>
                        <p className="note-chinese">
                            謝謝你的慷慨奉獻，與我們一起建造這個家！<br></br>
                            我們注意到這筆奉獻「未成功授權」，請與你<br></br>
                            的發卡銀行確認授權，或更換支付方式。<br></br>
                            如有疑問請來信 <a href="mailto:give@thehope.co" onClick={(e) => {
                                e.preventDefault();
                                window.open("https://mail.google.com/mail/?view=cm&to=give@thehope.co", "_blank");
                            }}> give@thehope.co</a>，我們樂意<br></br>協助！
                        </p>
                        <p className="note-english">
                            Thank you for your generosity in building this<br></br>
                            home with us!<br></br>
                            Your transaction was not authorized. Please<br></br>
                            check with your bank/Credit Card 信用卡 or try another<br></br>
                            payment method.<br></br>
                            For further support, please contact us at <br></br>
                            <a href="mailto:give@thehope.co" onClick={(e) => {
                                e.preventDefault();
                                window.open("https://mail.google.com/mail/?view=cm&to=give@thehope.co", "_blank");
                            }}>give@thehope.co</a>
                        </p>
                    </>
                    :
                    <>
                        <p className="note-chinese">
                            謝謝你的慷慨奉獻，與我們一起建造這個家！<br></br>
                            如有任何疑問，請來信 <a href="mailto:give@thehope.co">give@thehope.co</a>
                        </p>
                        <p className="note-english">
                            Thank you for your generosity in building this<br></br>
                            home with us!<br></br>
                            If you have any questions, please feel free to <br></br>
                            contact us at <a href="mailto:give@thehope.co">give@thehope.co</a>
                        </p>
                    </>
                }
            </div>
            <Button
                variant="contained"
                className="continue-button glass-button glass-button-accent width100"
                onClick={() => {
                    if (giveStatus === "fail") {
                        window.location.href = "/";
                    } else {
                        window.location.href = "https://thehope.co/25report";
                    };
                }}>
                {giveStatus === "fail" ?
                    <>
                        <span className="text-en">TRY AGAIN</span>
                        <span className="text-zh"> 重試</span>
                    </>
                    :
                    <>
                        <span className="text-en">BACK TO HOME</span>
                        {/* <span className="text-zh"> 返回首頁</span> */}
                    </>
                }
            </Button>
        </div>
    );
};

export default GiveSucessOrFail;
