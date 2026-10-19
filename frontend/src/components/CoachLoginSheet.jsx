import { useState } from "react";
import { useStore } from "../store/useStore.js";
import { useUI } from "../store/useUI.js";
import { coachLogin } from "../lib/coach-panel-api.js";
import { Button } from "./ui.jsx";
import Icon from "./Icon.jsx";

export default function CoachLoginSheet({ close }) {
  const setUser = useStore((s) => s.setUser);
  const toast = useUI.getState().toast;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!username.trim() || !password) {
      setError("نام کاربری و رمز عبور را وارد کنید");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await coachLogin({
        username: username.trim(),
        password,
      });
      if (res?.user) {
        setUser(res.user, { adopt: true });
        close();
        toast(`خوش آمدید مربی ${res.user.name}`);
      } else {
        setError(res?.error || "خطا در ورود به حساب مربی");
      }
    } catch (err) {
      setError(
        err?.data?.error || err?.message || "نام کاربری یا رمز عبور اشتباه است",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ direction: "rtl", textAlign: "right" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <span
          className="lrow-i"
          style={{
            background: "color-mix(in srgb, var(--indigo) 18%, transparent)",
            color: "var(--indigo)",
            width: 36,
            height: 36,
            borderRadius: 10,
          }}
        >
          <Icon name="shield" />
        </span>
        <div>
          <h3 style={{ margin: 0, fontSize: 18 }}>پنل اختصاصی مربی</h3>
          <div className="muted small" style={{ marginTop: 2 }}>
            ورود جهت مدیریت شاگردان و تنظیم برنامه‌ها
          </div>
        </div>
      </div>

      <form onSubmit={handleLogin} style={{ marginTop: 14 }}>
        <div style={{ marginBottom: 10 }}>
          <label
            className="small muted"
            style={{ display: "block", marginBottom: 4, fontWeight: 600 }}
          >
            نام کاربری یا ایمیل مربی
          </label>
          <input
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="مثال: علیرضا یا ایمیل"
            autoFocus
            required
            style={{ width: "100%", direction: "ltr", textAlign: "right" }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label
            className="small muted"
            style={{ display: "block", marginBottom: 4, fontWeight: 600 }}
          >
            رمز عبور
          </label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="حداقل ۶ کاراکتر"
            required
            style={{ width: "100%", direction: "ltr", textAlign: "right" }}
          />
        </div>

        {error && (
          <div
            style={{
              color: "var(--red)",
              background: "color-mix(in srgb, var(--red) 12%, transparent)",
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: 13,
              marginBottom: 12,
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        {/* ponytail: coach registration removed; registration happens via admin panel */}
        <Button
          variant="primary"
          type="submit"
          disabled={loading}
          style={{ width: "100%", justifyContent: "center" }}
        >
          {loading ? "در حال بررسی..." : "ورود به پنل مربیگری"}
        </Button>
      </form>
    </div>
  );
}
