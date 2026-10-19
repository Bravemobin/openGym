import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUI } from "../../store/useUI.js";
import { createCoachAthlete } from "../../lib/coach-panel-api.js";
import { Button } from "../../components/ui.jsx";
import Icon from "../../components/Icon.jsx";

export default function CoachCreateAthlete({ onBack, onEditPlan }) {
  const nav = useNavigate();
  const toast = useUI((s) => s.toast);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [days, setDays] = useState(30);
  const [customDays, setCustomDays] = useState("");
  const [status, setStatus] = useState("active"); // 'active' | 'unpaid'
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdAthlete, setCreatedAthlete] = useState(null);

  const generateRandomPassword = () => {
    // 6-digit random pin
    const pin = String(Math.floor(100000 + Math.random() * 900000));
    setPassword(pin);
  };

  const handleBack = () => {
    if (onBack) onBack();
    else nav("/coach-panel");
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast("نام شاگرد را وارد کنید");
      return;
    }
    if (!password || password.length < 4) {
      toast("رمز عبور باید حداقل ۴ رقم یا کاراکتر باشد");
      return;
    }

    const durationDays = customDays ? Number(customDays) : days;
    setLoading(true);
    try {
      const res = await createCoachAthlete({
        name: trimmedName,
        password,
        days: durationDays,
        status,
        email: email.trim() || undefined,
      });

      if (res?.ok && res?.athlete) {
        toast(`شاگرد «${trimmedName}» با موفقیت اضافه شد`);
        setCreatedAthlete({
          ...res.athlete,
          plainPassword: password,
        });
      } else {
        toast(res?.error || "خطا در ثبت شاگرد");
      }
    } catch (err) {
      toast(err?.data?.error || err?.message || "خطا در ثبت شاگرد جدید");
    } finally {
      setLoading(false);
    }
  };

  const copyCredentials = () => {
    if (!createdAthlete) return;
    const textToCopy = `سلام ${
      createdAthlete.name
    } عزیز،\nاطلاعات ورود شما به برنامه ورزشی:\nنام کاربری: ${
      createdAthlete.name
    }\nرمز عبور: ${createdAthlete.plainPassword}\nوضعیت اشتراک: ${
      createdAthlete.subscription?.status === "active"
        ? "فعال"
        : "در انتظار پرداخت"
    }`;
    navigator.clipboard?.writeText(textToCopy).catch(() => {});
    toast("اطلاعات ورود در کلیپ‌بورد کپی شد");
  };

  const handleResetForm = () => {
    setName("");
    setPassword("");
    setDays(30);
    setCustomDays("");
    setStatus("active");
    setEmail("");
    setCreatedAthlete(null);
  };

  // Success view with credentials and actions
  if (createdAthlete) {
    return (
      <div
        className="narrow"
        style={{ direction: "rtl", textAlign: "right", paddingBottom: 60 }}
      >
        <div
          className="hdr"
          style={{
            padding: "16px 16px 10px",
            borderBottom: "1px solid var(--sep)",
          }}
        >
          <div className="row between" style={{ alignItems: "center" }}>
            <div className="row" style={{ gap: 8, alignItems: "center" }}>
              <button
                className="iconbtn"
                onClick={handleBack}
                aria-label="بازگشت"
              >
                <Icon
                  name="chevronLeft"
                  style={{ transform: "rotate(180deg)" }}
                />
              </button>
              <h1 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>
                حساب شاگرد ساخته شد
              </h1>
            </div>
            <Button size="sm" onClick={handleBack}>
              لیست شاگردان
            </Button>
          </div>
        </div>

        <div style={{ padding: "20px 16px" }}>
          <div
            className="card"
            style={{
              textAlign: "center",
              padding: "24px 16px",
              borderRadius: 16,
            }}
          >
            <span style={{ fontSize: 44 }}>🎉</span>
            <h2
              style={{
                margin: "12px 0 6px",
                fontSize: 18,
                color: "var(--green)",
              }}
            >
              حساب «{createdAthlete.name}» با موفقیت ثبت شد
            </h2>
            <div className="dim small" style={{ marginBottom: 20 }}>
              شاگرد می‌تواند با نام و رمز عبور زیر وارد برنامه شود:
            </div>

            <div
              style={{
                background: "var(--surface-2)",
                borderRadius: 12,
                padding: "16px",
                textAlign: "right",
                margin: "0 auto 20px",
                maxWidth: 360,
                border: "1px dashed var(--sep)",
              }}
            >
              <div
                className="row between"
                style={{
                  padding: "6px 0",
                  borderBottom: "1px solid var(--sep)",
                }}
              >
                <span className="muted small">نام کاربری:</span>
                <span style={{ fontWeight: 700, fontSize: 15 }}>
                  {createdAthlete.name}
                </span>
              </div>
              <div
                className="row between"
                style={{
                  padding: "6px 0",
                  borderBottom: "1px solid var(--sep)",
                }}
              >
                <span className="muted small">رمز عبور:</span>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 16,
                    fontFamily: "monospace",
                    color: "var(--acc)",
                  }}
                >
                  {createdAthlete.plainPassword}
                </span>
              </div>
              <div className="row between" style={{ padding: "6px 0" }}>
                <span className="muted small">وضعیت اشتراک:</span>
                <span
                  style={{
                    fontWeight: 600,
                    color:
                      createdAthlete.subscription?.status === "active"
                        ? "var(--green)"
                        : "var(--yellow)",
                  }}
                >
                  {createdAthlete.subscription?.status === "active"
                    ? "فعال"
                    : "در انتظار پرداخت"}
                </span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                maxWidth: 360,
                margin: "0 auto",
              }}
            >
              <Button
                variant="primary"
                onClick={copyCredentials}
                style={{ justifyContent: "center" }}
              >
                📋 کپی اطلاعات ورود برای شاگرد
              </Button>

              <Button
                onClick={() => {
                  if (onEditPlan) {
                    onEditPlan(createdAthlete.id);
                  } else {
                    nav("/coach-panel");
                  }
                }}
                style={{ justifyContent: "center" }}
              >
                📝 تنظیم برنامه تمرین و تغذیه
              </Button>

              <div className="row" style={{ gap: 8, marginTop: 6 }}>
                <Button
                  size="sm"
                  onClick={handleResetForm}
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  + شاگرد دیگر
                </Button>
                <Button
                  size="sm"
                  onClick={handleBack}
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  بازگشت به پنل
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ponytail: form skips email verification and phone sms; add when gateway credentials configured
  return (
    <div
      className="narrow"
      style={{ direction: "rtl", textAlign: "right", paddingBottom: 60 }}
    >
      {/* Header */}
      <div
        className="hdr"
        style={{
          padding: "16px 16px 10px",
          borderBottom: "1px solid var(--sep)",
        }}
      >
        <div className="row between" style={{ alignItems: "center" }}>
          <div className="row" style={{ gap: 8, alignItems: "center" }}>
            <button
              className="iconbtn"
              onClick={handleBack}
              aria-label="بازگشت"
            >
              <Icon
                name="chevronLeft"
                style={{ transform: "rotate(180deg)" }}
              />
            </button>
            <div>
              <h1 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>
                ثبت شاگرد جدید
              </h1>
              <div className="dim small">
                ایجاد حساب کاربری و تعیین وضعیت شهریه
              </div>
            </div>
          </div>
          <Button size="sm" onClick={handleBack}>
            انصراف
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: "16px" }}>
        <div className="card" style={{ borderRadius: 14, marginBottom: 14 }}>
          {/* Athlete Name */}
          <div style={{ marginBottom: 16 }}>
            <label
              className="small"
              style={{ fontWeight: 700, display: "block", marginBottom: 6 }}
            >
              نام و نام خانوادگی شاگرد{" "}
              <span style={{ color: "var(--red)" }}>*</span>
            </label>
            <input
              className="input"
              type="text"
              placeholder="مثال: علی رضایی"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: "100%" }}
              required
              autoFocus
            />
            <div className="dim small" style={{ marginTop: 4 }}>
              شاگرد با همین نام وارد سامانه خواهد شد.
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 16 }}>
            <div className="row between" style={{ marginBottom: 6 }}>
              <label className="small" style={{ fontWeight: 700 }}>
                رمز عبور اولیه <span style={{ color: "var(--red)" }}>*</span>
              </label>
              <button
                type="button"
                className="btn link small"
                style={{ padding: 0, fontSize: 12, color: "var(--acc)" }}
                onClick={generateRandomPassword}
              >
                ⚡ ایجاد رمز تصادفی
              </button>
            </div>
            <input
              className="input"
              type="text"
              placeholder="حداقل ۴ کاراکتر یا عدد"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", fontFamily: "monospace" }}
              required
            />
            <div className="dim small" style={{ marginTop: 4 }}>
              این رمز را در اختیار شاگرد قرار دهید تا بتواند با آن وارد شود.
            </div>
          </div>

          {/* Optional Email */}
          <div style={{ marginBottom: 8 }}>
            <label
              className="small"
              style={{ fontWeight: 700, display: "block", marginBottom: 6 }}
            >
              ایمیل شاگرد (اختیاری)
            </label>
            <input
              className="input"
              type="email"
              placeholder="athlete@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", direction: "ltr", textAlign: "left" }}
            />
          </div>
        </div>

        {/* Subscription duration & status */}
        <div className="card" style={{ borderRadius: 14, marginBottom: 20 }}>
          <h2 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700 }}>
            وضعیت اشتراک و شهریه
          </h2>

          {/* Initial Status */}
          <div style={{ marginBottom: 16 }}>
            <div className="small" style={{ fontWeight: 600, marginBottom: 8 }}>
              وضعیت دسترسی اولیه:
            </div>
            <div className="row" style={{ gap: 8 }}>
              <button
                type="button"
                className={`btn ${status === "active" ? "primary" : ""}`}
                style={{ flex: 1, justifyContent: "center" }}
                onClick={() => setStatus("active")}
              >
                ✓ شهریه فعال (دسترسی باز)
              </button>
              <button
                type="button"
                className={`btn ${status === "unpaid" ? "primary" : ""}`}
                style={{ flex: 1, justifyContent: "center" }}
                onClick={() => setStatus("unpaid")}
              >
                قفل / در انتظار پرداخت
              </button>
            </div>
          </div>

          {/* Duration selection if active */}
          {status === "active" && (
            <div>
              <div
                className="small"
                style={{ fontWeight: 600, marginBottom: 8 }}
              >
                مدت اعتبار اشتراک:
              </div>
              <div
                className="row"
                style={{ gap: 6, flexWrap: "wrap", marginBottom: 10 }}
              >
                {[
                  { label: "۳۰ روز (۱ ماه)", val: 30 },
                  { label: "۶۰ روز (۲ ماه)", val: 60 },
                  { label: "۹۰ روز (۳ ماه)", val: 90 },
                  { label: "۱۸۰ روز (۶ ماه)", val: 180 },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    className={`btn ${
                      days === item.val && !customDays ? "primary" : ""
                    }`}
                    size="sm"
                    onClick={() => {
                      setDays(item.val);
                      setCustomDays("");
                    }}
                    style={{
                      flex: 1,
                      minWidth: 90,
                      justifyContent: "center",
                      fontSize: 12,
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="row" style={{ gap: 8, alignItems: "center" }}>
                <span className="dim small" style={{ flex: "none" }}>
                  یا تعداد روز دلخواه:
                </span>
                <input
                  className="input"
                  type="number"
                  placeholder="مثال: ۴۵"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  style={{ width: 100 }}
                  min="1"
                />
                <span className="dim small">روز</span>
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          style={{
            width: "100%",
            justifyContent: "center",
            padding: "14px 0",
            fontSize: 16,
          }}
        >
          {loading ? "در حال ثبت..." : "✓ ایجاد حساب کاربری شاگرد"}
        </Button>
      </form>
    </div>
  );
}
