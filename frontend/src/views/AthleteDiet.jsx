import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore.js';
import { t } from '../lib/i18n.js';
import AthletePaywall from '../components/AthletePaywall.jsx';
import Icon from '../components/Icon.jsx';

export default function AthleteDiet() {
  const nav = useNavigate();
  const S = useStore((s) => s.S);
  const user = useStore((s) => s.user);
  const pullState = useStore((s) => s.pullState);

  // ponytail: robust subscription check using both store state and user object
  const subStatus = S?.subscription?.status || user?.subscription?.status;
  const isSubActive = !!user?.admin || subStatus === 'active';
  const isLocked = !isSubActive;
  const [checkedMeals, setCheckedMeals] = useState({});

  const goBack = () => {
    if (window.history.state?.idx > 0) nav(-1);
    else nav('/plan');
  };

  const header = (
    <div className="hdr">
      <button className="iconbtn" onClick={goBack} aria-label={t('Back')}>
        <Icon name="chevronLeft" />
      </button>
      <div style={{ flex: 1, marginInlineStart: 12 }}>
        <h1>برنامه غذایی</h1>
      </div>
    </div>
  );

  if (isLocked) {
    return (
      <div className="narrow" style={{ paddingBottom: 80, direction: 'rtl', textAlign: 'right' }}>
        {header}
        <AthletePaywall onStatusChange={() => pullState()} />
      </div>
    );
  }

  const diet = S?.assignedDiet;
  const meals = Array.isArray(diet?.meals) ? diet.meals : [];
  const notes = diet?.notes || '';

  const toggleCheck = (mealId) => {
    setCheckedMeals((prev) => ({ ...prev, [mealId]: !prev[mealId] }));
  };

  return (
    <div className="narrow" style={{ paddingBottom: 90, direction: 'rtl', textAlign: 'right' }}>
      {header}

      {notes && (
        <div
          className="card"
          style={{
            margin: '12px 16px',
            background: 'rgba(52, 199, 89, 0.08)',
            borderColor: 'rgba(52, 199, 89, 0.3)',
            borderRadius: 12
          }}
        >
          <div className="row" style={{ gap: 8, marginBottom: 6, color: 'var(--green)', fontWeight: 700 }}>
            <Icon name="sparkles" />
            <span>توصیه‌های مربی:</span>
          </div>
          <div className="small" style={{ lineHeight: 1.7, color: 'var(--label-1)' }}>
            {notes}
          </div>
        </div>
      )}

      {meals.length === 0 ? (
        <div className="card" style={{ margin: '20px 16px', textAlign: 'center', padding: '40px 16px', background: 'rgba(0, 122, 255, 0.08)', borderColor: 'rgba(0, 122, 255, 0.25)' }}>
          <div style={{ fontSize: 36, color: 'var(--blue)', marginBottom: 12 }}>
            <Icon name="clock" />
          </div>
          <h3 style={{ margin: '0 0 6px', fontSize: 17, color: 'var(--blue)' }}>شهریه فعال — در انتظار برنامه غذایی</h3>
          <div className="muted small" style={{ lineHeight: 1.6 }}>
            شهریه شما تایید شده و فعال است. مربی شما در حال تنظیم رژیم و برنامه غذایی اختصاصی شماست و به زودی در این قسمت قرار خواهد گرفت.
          </div>
        </div>
      ) : (
        <div style={{ padding: '0 16px' }}>
          {meals.map((meal, idx) => {
            const isDone = !!checkedMeals[meal.id || idx];
            return (
              <div
                key={meal.id || idx}
                className="card"
                style={{
                  marginTop: 12,
                  borderRadius: 14,
                  opacity: isDone ? 0.6 : 1,
                  transition: 'opacity 0.2s',
                  border: isDone ? '1px dashed var(--sep)' : '1px solid var(--sep)'
                }}
              >
                <div
                  className="row between"
                  style={{
                    cursor: 'pointer',
                    paddingBottom: 10,
                    borderBottom: '1px solid var(--sep)'
                  }}
                  onClick={() => toggleCheck(meal.id || idx)}
                >
                  <div className="row" style={{ gap: 10 }}>
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 6,
                        border: '2px solid var(--acc)',
                        background: isDone ? 'var(--acc)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#000',
                        fontSize: 14,
                        fontWeight: 700
                      }}
                    >
                      {isDone && '✓'}
                    </div>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 16 }}>
                        {meal.title || `وعده ${idx + 1}`}
                      </span>
                      {meal.time && (
                        <span className="muted small" style={{ marginRight: 8 }}>
                          ⏱ ساعت {meal.time}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div style={{ padding: '10px 0 4px' }}>
                  {(meal.items || []).map((item, itemIdx) => (
                    <div
                      key={itemIdx}
                      className="row between"
                      style={{
                        padding: '6px 0',
                        borderBottom: itemIdx < meal.items.length - 1 ? '1px dashed var(--sep)' : 'none'
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: 14 }}>
                        • {item.name}
                      </span>
                      <span className="small muted" style={{ direction: 'ltr' }}>
                        {item.amount}
                      </span>
                    </div>
                  ))}
                </div>

                {meal.note && (
                  <div
                    className="dim small"
                    style={{
                      marginTop: 8,
                      paddingTop: 8,
                      borderTop: '1px solid var(--sep)',
                      lineHeight: 1.5
                    }}
                  >
                    💡 نکته: {meal.note}
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
