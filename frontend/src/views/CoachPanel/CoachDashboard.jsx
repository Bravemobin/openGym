import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../../store/useStore.js";
import { useUI } from "../../store/useUI.js";
import {
  getCoachAthletes,
  updateCoachSubscription,
} from "../../lib/coach-panel-api.js";
import CoachReceipts from "./CoachReceipts.jsx";
import CoachAthletePlan from "./CoachAthletePlan.jsx";
import CoachPaymentSettings from "./CoachPaymentSettings.jsx";
import CoachCreateAthlete from "./CoachCreateAthlete.jsx";
import { Button } from "../../components/ui.jsx";
import Icon from "../../components/Icon.jsx";

export default function CoachDashboard() {
  const nav = useNavigate();
  const toast = useUI((s) => s.toast);
  const user = useStore((s) => s.user);

  const [loading, setLoading] = useState(true);
  const [athletes, setAthletes] = useState([]);
  const [coachSettings, setCoachSettings] = useState(null);
  const [activeTab, setActiveTab] = useState("athletes"); // 'athletes' | 'receipts' | 'settings'
  const [search, setSearch] = useState("");

  // Selected athlete for editing plans
  const [selectedAthleteId, setSelectedAthleteId] = useState(null);
  const [creatingAthlete, setCreatingAthlete] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getCoachAthletes();
      setAthletes(res.athletes || []);
      setCoachSettings(res.coachSettings || null);
    } catch (e) {
      toast(e.message || "خطا در بارگذاری اطلاعات شاگردان");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleManualActivate = async (athleteId, athleteName) => {
    try {
      await updateCoachSubscription(athleteId, { status: "active", days: 30 });
      toast(`اشتراک ${athleteName} به مدت ۳۰ روز فعال شد`);
      loadData();
    } catch (e) {
      toast(e.message || "خطا در فعال‌سازی دستی");
    }
  };

  const handleManualDeactivate = async (athleteId, athleteName) => {
    try {
      await updateCoachSubscription(athleteId, { status: "unpaid" });
      toast(`اشتراک ${athleteName} غیرفعال شد`);
      loadData();
    } catch (e) {
      toast(e.message || "خطا در غیرفعال‌سازی");
    }
  };

  // If creating a new athlete
  if (creatingAthlete) {
    return (
      <CoachCreateAthlete
        onBack={() => {
          setCreatingAthlete(false);
          loadData();
        }}
        onEditPlan={(athleteId) => {
          setCreatingAthlete(false);
          setSelectedAthleteId(athleteId);
          loadData();
        }}
      />
    );
  }

  // If editing an athlete plan
  if (selectedAthleteId) {
    return (
      <CoachAthletePlan
        athleteId={selectedAthleteId}
        onBack={() => {
          setSelectedAthleteId(null);
          loadData();
        }}
      />
    );
  }

  // Summary counts
  const totalCount = athletes.length;
  const pendingCount = athletes.filter(
    (a) => a.subscription?.status === "pending",
  ).length;
  const activeCount = athletes.filter(
    (a) => a.subscription?.status === "active",
  ).length;
  const expiredCount = totalCount - activeCount - pendingCount;

  // Filtered athletes list
  const filteredAthletes = athletes.filter((a) =>
    a.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div
      className="narrow"
      style={{ direction: "rtl", textAlign: "right", paddingBottom: 90 }}
    >
      {/* Top Header */}
      <div
        className="hdr"
        style={{
          padding: "16px 16px 10px",
          borderBottom: "1px solid var(--sep)",
        }}
      >
        <div className="row between" style={{ width: "100%" }}>
          <div>
            <div className="row" style={{ gap: 8, alignItems: "center" }}>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>
                پنل اختصاصی مربی
              </h1>
            </div>
            <div className="muted small" style={{ marginTop: 2 }}>
              خوش آمدید، {user?.name || "مربی گرامی"}
            </div>
          </div>
          <div className="row" style={{ gap: 6 }}>
            <Button size="sm" onClick={() => nav("/admin")}>
              ⚙️ مدیریت کل
            </Button>
            <Button size="sm" onClick={() => nav("/settings")}>
              تنظیمات
            </Button>
          </div>
        </div>
      </div>

      {/* Summary KPI Tiles */}
      <div style={{ padding: "16px 16px 8px" }}>
        <div className="tiles" style={{ textAlign: "start" }}>
          <div className="tile">
            <div className="l">کل شاگردان</div>
            <div className="v" style={{ fontSize: "1.25rem", fontWeight: 800 }}>
              {totalCount}
            </div>
          </div>

          <div
            className="tile"
            onClick={() => setActiveTab("receipts")}
            style={{
              cursor: "pointer",
              borderColor: pendingCount > 0 ? "var(--yellow)" : "var(--sep)",
              background:
                pendingCount > 0 ? "rgba(255, 179, 0, 0.08)" : "var(--card)",
            }}
          >
            <div
              className="l"
              style={{
                color: pendingCount > 0 ? "var(--yellow)" : "var(--label-2)",
              }}
            >
              فیش‌های بررسی‌نشده
            </div>
            <div
              className="v"
              style={{
                fontSize: "1.25rem",
                fontWeight: 800,
                color: pendingCount > 0 ? "var(--yellow)" : "var(--label-1)",
              }}
            >
              {pendingCount} {pendingCount > 0 ? "⚠️" : ""}
            </div>
          </div>

          <div className="tile">
            <div className="l">شهریه فعال</div>
            <div
              className="v"
              style={{
                fontSize: "1.25rem",
                fontWeight: 800,
                color: "var(--green)",
              }}
            >
              {activeCount}
            </div>
          </div>

          <div className="tile">
            <div className="l">معوق / قفل</div>
            <div
              className="v"
              style={{
                fontSize: "1.25rem",
                fontWeight: 800,
                color: "var(--red)",
              }}
            >
              {expiredCount}
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div style={{ padding: "0 16px 14px" }}>
        <div className="row" style={{ gap: 8 }}>
          <button
            className={`btn ${activeTab === "athletes" ? "primary" : ""}`}
            style={{ flex: 1, justifyContent: "center" }}
            onClick={() => setActiveTab("athletes")}
          >
            👥 لیست شاگردان
          </button>
          <button
            className={`btn ${activeTab === "receipts" ? "primary" : ""}`}
            style={{
              flex: 1,
              justifyContent: "center",
              position: "relative",
              borderColor: pendingCount > 0 ? "var(--yellow)" : "var(--sep)",
            }}
            onClick={() => setActiveTab("receipts")}
          >
            📄 بررسی فیش‌ها {pendingCount > 0 && `(${pendingCount})`}
          </button>
          <button
            className={`btn ${activeTab === "settings" ? "primary" : ""}`}
            style={{ flex: 1, justifyContent: "center" }}
            onClick={() => setActiveTab("settings")}
          >
            💳 شماره کارت
          </button>
        </div>
      </div>

      {/* ================= TAB: ATHLETES ================= */}
      {activeTab === "athletes" && (
        <div style={{ padding: "0 16px" }}>
          {/* Search bar and Add Athlete */}
          <div className="row" style={{ gap: 8, marginBottom: 14 }}>
            <input
              className="input"
              placeholder="🔍 جستجوی شاگرد با نام..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1 }}
            />
            <Button
              variant="primary"
              size="sm"
              onClick={() => setCreatingAthlete(true)}
              style={{ flex: "none", whiteSpace: "nowrap" }}
            >
              + ثبت شاگرد جدید
            </Button>
          </div>

          {loading ? (
            <div
              className="muted small"
              style={{ textAlign: "center", padding: 30 }}
            >
              در حال بارگذاری لیست شاگردان...
            </div>
          ) : filteredAthletes.length === 0 ? (
            <div
              className="card"
              style={{ textAlign: "center", padding: "30px 16px" }}
            >
              <div className="muted small" style={{ marginBottom: 12 }}>
                هیچ شاگردی یافت نشد.
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setCreatingAthlete(true)}
              >
                + ثبت اولین شاگرد
              </Button>
            </div>
          ) : (
            <div className="list" style={{ gap: 12 }}>
              {filteredAthletes.map((a) => {
                const sub = a.subscription || {};
                const isActive = sub.status === "active";
                const isPending = sub.status === "pending";
                const isExpired = !isActive && !isPending;

                return (
                  <div key={a.id} className="card" style={{ borderRadius: 14 }}>
                    <div className="row between" style={{ marginBottom: 8 }}>
                      <span style={{ fontWeight: 800, fontSize: 16 }}>
                        {a.name}
                      </span>
                      <span
                        className="adm-pill"
                        style={{
                          background: isActive
                            ? "var(--green)"
                            : isPending
                            ? "var(--yellow)"
                            : "var(--red)",
                          color: "#000",
                          fontWeight: 700,
                        }}
                      >
                        {isActive
                          ? "شهریه فعال"
                          : isPending
                          ? "فیش در انتظار بررسی"
                          : "شهریه معوق / قفل"}
                      </span>
                    </div>

                    {/* Expiration date or details */}
                    <div className="dim small" style={{ marginBottom: 10 }}>
                      {isActive && sub.expiresAt && (
                        <span>
                          ⏳ مهلت اشتراک: تا{" "}
                          {new Date(sub.expiresAt).toLocaleDateString("fa-IR")}
                        </span>
                      )}
                      {isPending && (
                        <span>⚠️ فیش واریزی ارسال شده است — نیازمند بررسی</span>
                      )}
                      {isExpired && (
                        <span>⛔ برنامه برای این شاگرد قفل است</span>
                      )}
                    </div>

                    {/* Plan tags */}
                    <div
                      className="row"
                      style={{ gap: 6, marginBottom: 12, flexWrap: "wrap" }}
                    >
                      <span
                        className="adm-pill"
                        style={{
                          background: a.hasAssignedWorkout
                            ? "rgba(52, 199, 89, 0.15)"
                            : "var(--sep)",
                          color: a.hasAssignedWorkout
                            ? "var(--green)"
                            : "var(--label-2)",
                        }}
                      >
                        {a.hasAssignedWorkout
                          ? "✓ برنامه تمرینی دارد"
                          : "بدون برنامه تمرینی"}
                      </span>
                      <span
                        className="adm-pill"
                        style={{
                          background: a.hasAssignedDiet
                            ? "rgba(52, 199, 89, 0.15)"
                            : "var(--sep)",
                          color: a.hasAssignedDiet
                            ? "var(--green)"
                            : "var(--label-2)",
                        }}
                      >
                        {a.hasAssignedDiet
                          ? "✓ برنامه غذایی دارد"
                          : "بدون برنامه غذایی"}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                      <Button
                        variant="primary"
                        size="sm"
                        style={{
                          flex: 1,
                          minWidth: 140,
                          justifyContent: "center",
                        }}
                        onClick={() => setSelectedAthleteId(a.id)}
                      >
                        📝 تنظیم تمرین و تغذیه
                      </Button>

                      {isPending && (
                        <Button
                          size="sm"
                          style={{
                            background: "var(--yellow)",
                            color: "#000",
                            fontWeight: 700,
                            justifyContent: "center",
                          }}
                          onClick={() => setActiveTab("receipts")}
                        >
                          بررسی فیش
                        </Button>
                      )}

                      {!isActive ? (
                        <Button
                          size="sm"
                          onClick={() => handleManualActivate(a.id, a.name)}
                          style={{ justifyContent: "center" }}
                        >
                          + فعال‌سازی دستی ۳۰ روزه
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleManualDeactivate(a.id, a.name)}
                          style={{ justifyContent: "center" }}
                        >
                          قفل کردن دسترسی
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB: RECEIPTS ================= */}
      {activeTab === "receipts" && (
        <div style={{ padding: "0 16px" }}>
          <CoachReceipts athletes={athletes} onUpdated={loadData} />
        </div>
      )}

      {/* ================= TAB: SETTINGS ================= */}
      {activeTab === "settings" && (
        <div style={{ padding: "0 16px" }}>
          <CoachPaymentSettings onSaved={loadData} />
        </div>
      )}
    </div>
  );
}
