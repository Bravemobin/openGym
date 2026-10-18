import { useState } from "react";
import { useUI } from "../../store/useUI.js";
import { verifyReceipt, receiptImageUrl } from "../../lib/coach-panel-api.js";
import { Button } from "../../components/ui.jsx";
import Icon from "../../components/Icon.jsx";

export default function CoachReceipts({ athletes, onUpdated }) {
  const toast = useUI((s) => s.toast);
  const [selectedImage, setSelectedImage] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);

  // Athletes with pending receipts
  const pendingAthletes = (athletes || []).filter(
    (a) => a.subscription?.status === "pending" && a.subscription?.lastReceipt,
  );

  const handleApprove = async (athleteId) => {
    setProcessing(true);
    try {
      await verifyReceipt(athleteId, { action: "approve", days: 30 });
      toast("فیش تایید شد و دسترسی شاگرد ۳۰ روز فعال گردید");
      if (onUpdated) onUpdated();
    } catch (e) {
      toast(e.message || "خطا در تایید فیش");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (athleteId) => {
    setProcessing(true);
    try {
      await verifyReceipt(athleteId, {
        action: "reject",
        reason:
          rejectReason.trim() || "فیش نامعتبر است یا مبلغ واریزی مغایرت دارد",
      });
      toast("فیش رد شد و پیام به شاگرد منتقل شد");
      setRejectingId(null);
      setRejectReason("");
      if (onUpdated) onUpdated();
    } catch (e) {
      toast(e.message || "خطا در رد فیش");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{ direction: "rtl", textAlign: "right" }}>
      {/* Lightbox Modal for Receipt Image */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              position: "relative",
              maxWidth: "90vw",
              maxHeight: "90vh",
            }}
          >
            <img
              src={selectedImage}
              alt="رسید واریزی"
              style={{
                maxWidth: "100%",
                maxHeight: "85vh",
                borderRadius: 12,
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                objectFit: "contain",
              }}
            />
            <div style={{ textAlign: "center", marginTop: 10 }}>
              <Button size="sm" onClick={() => setSelectedImage(null)}>
                بستن تصویر ✕
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="row between" style={{ marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 18 }}>فیش‌های در انتظار بررسی</h3>
          <div className="muted small" style={{ marginTop: 4 }}>
            {pendingAthletes.length} فیش نیازمند بررسی و تعیین وضعیت است
          </div>
        </div>
        <span
          className="adm-pill"
          style={{
            background:
              pendingAthletes.length > 0 ? "var(--yellow)" : "var(--sep)",
            color: "#000",
            fontWeight: 700,
          }}
        >
          {pendingAthletes.length} مورد
        </span>
      </div>

      {pendingAthletes.length === 0 ? (
        <div
          className="card"
          style={{ textAlign: "center", padding: "40px 16px" }}
        >
          <div
            style={{ fontSize: 36, color: "var(--green)", marginBottom: 12 }}
          >
            <Icon name="sparkles" />
          </div>
          <h4 style={{ margin: "0 0 6px", fontSize: 16 }}>
            هیچ فیشی در انتظار نیست
          </h4>
          <div className="muted small">
            تمام رسیدهای واریزی بررسی و تعیین تکلیف شده‌اند.
          </div>
        </div>
      ) : (
        <div className="list" style={{ gap: 14 }}>
          {pendingAthletes.map((a) => {
            const r = a.subscription?.lastReceipt;
            const imgUrl = r?.filename ? receiptImageUrl(r.filename) : null;
            const isRejecting = rejectingId === a.id;

            return (
              <div
                key={a.id}
                className="card"
                style={{
                  borderRadius: 14,
                  borderColor: "rgba(255, 179, 0, 0.4)",
                  background: "rgba(255, 179, 0, 0.03)",
                }}
              >
                <div
                  className="row between"
                  style={{
                    borderBottom: "1px solid var(--sep)",
                    paddingBottom: 10,
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 800, fontSize: 16 }}>
                      {a.name}
                    </span>
                    <div className="muted small" style={{ marginTop: 2 }}>
                      تاریخ ارسال:{" "}
                      {r?.uploadedAt
                        ? new Date(r.uploadedAt).toLocaleString("fa-IR")
                        : "—"}
                    </div>
                  </div>
                  <span
                    className="adm-pill"
                    style={{
                      background: "var(--yellow)",
                      color: "#000",
                      fontWeight: 700,
                    }}
                  >
                    در انتظار تایید
                  </span>
                </div>

                <div
                  className="row between"
                  style={{
                    padding: "8px 0",
                    borderBottom: "1px solid var(--sep)",
                  }}
                >
                  <span className="muted small">مبلغ اعلامی:</span>
                  <span style={{ fontWeight: 700, color: "var(--acc)" }}>
                    {r?.amount
                      ? Number(r.amount).toLocaleString("fa-IR") + " تومان"
                      : "نامشخص"}
                  </span>
                </div>

                {r?.note && (
                  <div
                    style={{
                      padding: "8px 0",
                      borderBottom: "1px solid var(--sep)",
                    }}
                  >
                    <span className="muted small">توضیحات شاگرد:</span>
                    <div className="small" style={{ marginTop: 4 }}>
                      {r.note}
                    </div>
                  </div>
                )}

                {/* Receipt Image thumbnail with click to zoom */}
                {imgUrl && (
                  <div style={{ margin: "12px 0", textAlign: "center" }}>
                    <div
                      onClick={() => setSelectedImage(imgUrl)}
                      style={{
                        cursor: "pointer",
                        display: "inline-block",
                        position: "relative",
                        borderRadius: 8,
                        overflow: "hidden",
                        border: "1px solid var(--sep)",
                      }}
                    >
                      <img
                        src={imgUrl}
                        alt="فیش رسید"
                        style={{
                          maxHeight: 180,
                          maxWidth: "100%",
                          objectFit: "contain",
                          display: "block",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          bottom: 0,
                          insetInline: 0,
                          background: "rgba(0,0,0,0.6)",
                          color: "#fff",
                          fontSize: 11,
                          padding: "3px 0",
                        }}
                      >
                        🔍 کلیک برای مشاهده در اندازه اصلی
                      </div>
                    </div>
                  </div>
                )}

                {/* Reject Input box if opened */}
                {isRejecting ? (
                  <div
                    style={{
                      background: "rgba(255, 69, 58, 0.08)",
                      padding: 12,
                      borderRadius: 10,
                      marginTop: 10,
                      border: "1px solid var(--red)",
                    }}
                  >
                    <label
                      className="small"
                      style={{
                        display: "block",
                        fontWeight: 600,
                        marginBottom: 6,
                      }}
                    >
                      علت رد فیش (به شاگرد نمایش داده می‌شود):
                    </label>
                    <input
                      className="input"
                      placeholder="مثلاً: مبلغ واریزی ناقص است یا عکس خوانا نیست"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      style={{ width: "100%", marginBottom: 10 }}
                    />
                    <div
                      className="row"
                      style={{ gap: 8, justifyContent: "flex-end" }}
                    >
                      <Button size="sm" onClick={() => setRejectingId(null)}>
                        انصراف
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={processing}
                        onClick={() => handleReject(a.id)}
                      >
                        تایید و ارسال دلیل رد
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="row">
                    <Button
                      variant="primary"
                      disabled={processing}
                      className="w-1/2"
                      onClick={() => handleApprove(a.id)}
                    >
                      تایید
                    </Button>
                    <Button
                      variant="danger"
                      disabled={processing}
                      className="w-1/2"
                      onClick={() => {
                        setRejectingId(a.id);
                        setRejectReason("");
                      }}
                    >
                      رد فیش
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
