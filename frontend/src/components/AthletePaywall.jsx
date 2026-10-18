import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore.js';
import { useUI } from '../store/useUI.js';
import { getAthleteStatus, uploadReceipt, receiptImageUrl } from '../lib/coach-panel-api.js';
import Icon from './Icon.jsx';
import { Button } from './ui.jsx';

// Resize and compress an image file client-side using canvas
function compressImage(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AthletePaywall({ onStatusChange }) {
  const toast = useUI((s) => s.toast);
  const user = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);

  const [loading, setLoading] = useState(true);
  const [sub, setSub] = useState(null);
  const [coachSettings, setCoachSettings] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Form states
  const [preview, setPreview] = useState(null);
  const [base64Image, setBase64Image] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const loadStatus = async () => {
    try {
      setLoading(true);
      const res = await getAthleteStatus();
      setSub(res.subscription);
      setCoachSettings(res.coachSettings);
      if (res.coachSettings?.monthlyFee) {
        setAmount(String(res.coachSettings.monthlyFee));
      }
      if (res.user) {
        setUser(res.user);
      }
      if (res.subscription?.status === 'active' && onStatusChange) {
        onStatusChange(res.subscription);
      }
    } catch (e) {
      toast(e.message || 'خطا در دریافت وضعیت شهریه');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const copyCard = () => {
    if (!coachSettings?.cardNumber) return;
    navigator.clipboard?.writeText(coachSettings.cardNumber.replace(/[\s-]/g, ''));
    toast('شماره کارت کپی شد');
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setPreview(compressed);
      setBase64Image(compressed);
    } catch {
      toast('خطا در بارگذاری تصویر');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!base64Image) {
      toast('لطفاً تصویر فیش واریزی را انتخاب کنید');
      return;
    }
    setUploading(true);
    try {
      const res = await uploadReceipt({
        image: base64Image,
        amount: Number(amount) || coachSettings?.monthlyFee || 0,
        note: note.trim()
      });
      toast('فیش واریزی با موفقیت ارسال شد و در انتظار تایید مربی است');
      setSub(res.subscription);
      setPreview(null);
      setBase64Image('');
      setNote('');
    } catch (err) {
      toast(err.message || 'خطا در ارسال فیش');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="narrow" style={{ textAlign: 'center', padding: '60px 16px' }}>
        <div style={{ color: 'var(--label-3)', marginBottom: 12 }}>
          <Icon name="spinner" />
        </div>
        <div className="muted small">در حال بارگذاری وضعیت شهریه...</div>
      </div>
    );
  }

  const isPending = sub?.status === 'pending';
  const isRejected = sub?.status === 'rejected';

  return (
    <div className="narrow" style={{ padding: '24px 16px', direction: 'rtl', textAlign: 'right' }}>
      {/* Header status banner */}
      <div
        className="card"
        style={{
          textAlign: 'center',
          padding: '24px 18px',
          background: isPending
            ? 'rgba(255, 179, 0, 0.08)'
            : isRejected
            ? 'rgba(255, 69, 58, 0.08)'
            : 'var(--card)',
          borderColor: isPending
            ? 'var(--yellow)'
            : isRejected
            ? 'var(--red)'
            : 'var(--sep)'
        }}
      >
        <div
          style={{
            fontSize: 42,
            marginBottom: 10,
            color: isPending ? 'var(--yellow)' : isRejected ? 'var(--red)' : 'var(--acc)'
          }}
        >
          <Icon name={isPending ? 'clock' : isRejected ? 'xmark' : 'lock'} />
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>
          {isPending
            ? 'فیش در حال بررسی توسط مربی'
            : isRejected
            ? 'فیش ارسالی تایید نشد'
            : 'برنامه تمرینی و غذایی قفل است'}
        </h2>
        <div className="muted small" style={{ lineHeight: 1.6 }}>
          {isPending
            ? 'فیش واریزی شما ثبت شده است. به محض بررسی و تایید مربی، برنامه‌ها فعال خواهند شد.'
            : isRejected
            ? `علت رد فیش: ${sub?.rejectReason || 'مبلغ یا تصویر نامعتبر است'}. لطفاً فیش معتبر را ارسال نمایید.`
            : 'برای دسترسی به برنامه تمرینی و غذایی، لطفاً شهریه دوره را واریز نموده و تصویر فیش را ارسال فرمایید.'}
        </div>
        {isPending && (
          <div style={{ marginTop: 14 }}>
            <Button size="sm" icon="arrow-path" onClick={loadStatus}>
              بررسی مجدد وضعیت
            </Button>
          </div>
        )}
      </div>

      {/* Details of pending receipt if exists */}
      {isPending && sub?.lastReceipt && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>اطلاعات فیش ارسالی</h3>
          <div className="row between" style={{ padding: '6px 0', borderBottom: '1px solid var(--sep)' }}>
            <span className="muted small">تاریخ ارسال:</span>
            <span className="small">{new Date(sub.lastReceipt.uploadedAt).toLocaleString('fa-IR')}</span>
          </div>
          <div className="row between" style={{ padding: '6px 0', borderBottom: '1px solid var(--sep)' }}>
            <span className="muted small">مبلغ:</span>
            <span className="small">{Number(sub.lastReceipt.amount).toLocaleString('fa-IR')} تومان</span>
          </div>
          {sub.lastReceipt.note && (
            <div className="row between" style={{ padding: '6px 0', borderBottom: '1px solid var(--sep)' }}>
              <span className="muted small">توضیحات:</span>
              <span className="small">{sub.lastReceipt.note}</span>
            </div>
          )}
          {sub.lastReceipt.filename && (
            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <img
                src={receiptImageUrl(sub.lastReceipt.filename)}
                alt="فیش ارسالی"
                style={{
                  maxWidth: '100%',
                  maxHeight: 220,
                  borderRadius: 8,
                  border: '1px solid var(--sep)',
                  objectFit: 'contain'
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Coach Bank Card & Payment Info (shown if unpaid or rejected) */}
      {!isPending && (
        <>
          <div
            className="card"
            style={{
              marginTop: 16,
              background: 'linear-gradient(135deg, rgba(30,30,35,0.9), rgba(20,20,25,0.95))',
              borderColor: 'var(--acc)',
              borderWidth: 1.5
            }}
          >
            <div className="row between" style={{ marginBottom: 12 }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--acc)' }}>
                {coachSettings?.bankName ? `بانک ${coachSettings.bankName}` : 'کارت بانکی مربی'}
              </span>
              <Icon name="credit-card" style={{ color: 'var(--acc)' }} />
            </div>

            <div
              onClick={copyCard}
              style={{
                background: 'rgba(255,255,255,0.06)',
                padding: '12px 14px',
                borderRadius: 8,
                textAlign: 'center',
                cursor: 'pointer',
                marginBottom: 12
              }}
            >
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  letterSpacing: '0.14em',
                  fontFamily: 'monospace',
                  direction: 'ltr'
                }}
              >
                {coachSettings?.cardNumber || 'شماره کارت ثبت نشده است'}
              </div>
              <div className="dim small" style={{ marginTop: 4 }}>
                برای کپی کلیک کنید 📋
              </div>
            </div>

            {coachSettings?.cardHolder && (
              <div className="row between" style={{ padding: '4px 0' }}>
                <span className="muted small">به نام:</span>
                <span className="small" style={{ fontWeight: 600 }}>{coachSettings.cardHolder}</span>
              </div>
            )}

            {coachSettings?.monthlyFee > 0 && (
              <div className="row between" style={{ padding: '4px 0' }}>
                <span className="muted small">مبلغ شهریه:</span>
                <span className="small" style={{ fontWeight: 700, color: 'var(--acc)' }}>
                  {Number(coachSettings.monthlyFee).toLocaleString('fa-IR')} تومان
                </span>
              </div>
            )}

            {coachSettings?.description && (
              <div className="dim small" style={{ marginTop: 10, lineHeight: 1.5, borderTop: '1px solid var(--sep)', paddingTop: 8 }}>
                {coachSettings.description}
              </div>
            )}
          </div>

          {/* Form to submit receipt */}
          <form className="card" onSubmit={handleSubmit} style={{ marginTop: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 16 }}>ارسال تصویر رسید واریز</h3>

            <div style={{ marginBottom: 14 }}>
              <label className="muted small" style={{ display: 'block', marginBottom: 6 }}>
                عکس فیش واریزی (الزامی):
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ width: '100%', fontSize: 14 }}
              />
            </div>

            {preview && (
              <div style={{ marginBottom: 14, textAlign: 'center' }}>
                <img
                  src={preview}
                  alt="پیش‌نمایش رسید"
                  style={{
                    maxWidth: '100%',
                    maxHeight: 200,
                    borderRadius: 8,
                    border: '1px solid var(--sep)',
                    objectFit: 'contain'
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label className="muted small" style={{ display: 'block', marginBottom: 6 }}>
                مبلغ واریز شده (تومان):
              </label>
              <input
                className="input"
                type="number"
                placeholder="مثلاً ۵۰۰۰۰۰"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ direction: 'ltr', textAlign: 'right' }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="muted small" style={{ display: 'block', marginBottom: 6 }}>
                توضیحات یا کد پیگیری (اختیاری):
              </label>
              <input
                className="input"
                placeholder="شماره پیگیری، ۴ رقم آخر کارت و..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <Button
              variant="primary"
              type="submit"
              disabled={uploading || !base64Image}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {uploading ? 'در حال ارسال فیش...' : 'ثبت و ارسال فیش برای مربی'}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
