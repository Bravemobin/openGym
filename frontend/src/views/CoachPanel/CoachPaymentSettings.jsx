import { useState, useEffect } from "react";
import { useUI } from "../../store/useUI.js";
import {
  getCoachPaymentSettings,
  saveCoachPaymentSettings,
} from "../../lib/coach-panel-api.js";
import { Button } from "../../components/ui.jsx";
import Icon from "../../components/Icon.jsx";

export default function CoachPaymentSettings({ onSaved }) {
  const toast = useUI((s) => s.toast);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [bankName, setBankName] = useState("");
  const [monthlyFee, setMonthlyFee] = useState("500000");
  const [description, setDescription] = useState("");

  useEffect(() => {
    getCoachPaymentSettings()
      .then((res) => {
        const s = res.coachSettings || {};
        setCardNumber(s.cardNumber || "");
        setCardHolder(s.cardHolder || "");
        setBankName(s.bankName || "");
        setMonthlyFee(String(s.monthlyFee ?? 500000));
        setDescription(s.description || "");
      })
      .catch((e) => toast(e.message || "خطا در بارگذاری تنظیمات پرداخت"))
      .finally(() => setLoading(false));
  }, []);

  // Format 16 digits into XXXX-XXXX-XXXX-XXXX
  const formatCard = (val) => {
    const raw = val.replace(/\D/g, "").slice(0, 16);
    const parts = raw.match(/[\s\S]{1,4}/g) || [];
    return parts.join("-");
  };

  const handleCardChange = (e) => {
    setCardNumber(formatCard(e.target.value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveCoachPaymentSettings({
        cardNumber,
        cardHolder: cardHolder.trim(),
        bankName: bankName.trim(),
        monthlyFee: Number(monthlyFee) || 0,
        description: description.trim(),
      });
      toast("تنظیمات پرداخت و شماره کارت ذخیره شد");
      if (onSaved) onSaved();
    } catch (err) {
      toast(err.message || "خطا در ذخیره تنظیمات");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="muted small" style={{ textAlign: "center", padding: 20 }}>
        در حال بارگذاری...
      </div>
    );
  }

  return (
    <form
      className="card"
      onSubmit={handleSubmit}
      style={{ direction: "rtl", textAlign: "right" }}
    >
      <div className="row between" style={{ marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 17 }}>
          تنظیمات دریافت شهریه و کارت بانکی
        </h3>
        <Icon name="credit-card" style={{ color: "var(--acc)" }} />
      </div>

      <div className="adm-lead" style={{ marginBottom: 16 }}>
        این اطلاعات در صفحه پرداخت و قفل برنامه به ورزشکاران نمایش داده می‌شود
        تا شهریه را به این حساب واریز کنند.
      </div>

      <div style={{ marginBottom: 14 }}>
        <label
          className="muted small"
          style={{ display: "block", marginBottom: 6 }}
        >
          شماره کارت بانکی (۱۶ رقم):
        </label>
        <input
          className="input"
          placeholder="مثلاً ۶۰۳۷-۹۹۱۸-۱۲۳۴-۵۶۷۸"
          value={cardNumber}
          onChange={handleCardChange}
          style={{
            direction: "ltr",
            textAlign: "center",
            letterSpacing: "0.12em",
            fontWeight: 700,
          }}
          maxLength={19}
        />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label
          className="muted small"
          style={{ display: "block", marginBottom: 6 }}
        >
          نام و نام خانوادگی صاحب کارت:
        </label>
        <input
          className="input"
          placeholder="مثلاً علی رضایی"
          value={cardHolder}
          onChange={(e) => setCardHolder(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label
          className="muted small"
          style={{ display: "block", marginBottom: 6 }}
        >
          نام بانک:
        </label>
        <input
          className="input"
          placeholder="مثلاً بانک ملی"
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label
          className="muted small"
          style={{ display: "block", marginBottom: 6 }}
        >
          مبلغ شهریه ماهانه (تومان):
        </label>
        <input
          className="input"
          type="number"
          placeholder="مثلاً ۵۰۰۰۰۰"
          value={monthlyFee}
          onChange={(e) => setMonthlyFee(e.target.value)}
          style={{ direction: "ltr", textAlign: "right" }}
        />
        {Number(monthlyFee) > 0 && (
          <div className="dim small" style={{ marginTop: 4 }}>
            معادل: {Number(monthlyFee).toLocaleString("fa-IR")} تومان
          </div>
        )}
      </div>

      <div style={{ marginBottom: 18 }}>
        <label
          className="muted small"
          style={{ display: "block", marginBottom: 6 }}
        >
          پیام یا توضیحات برای ورزشکار:
        </label>
        <textarea
          className="input"
          rows={3}
          placeholder="توضیحات در مورد نحوه واریز، مهلت و..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ width: "100%", resize: "vertical" }}
        />
      </div>

      <Button
        variant="primary"
        type="submit"
        disabled={saving}
        style={{ width: "100%", justifyContent: "center" }}
      >
        {saving ? "در حال ذخیره..." : "ذخیره تنظیمات کارت"}
      </Button>
    </form>
  );
}
