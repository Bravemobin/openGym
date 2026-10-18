import { useState, useEffect } from 'react';
import { useUI } from '../../store/useUI.js';
import { getCoachAthlete, saveAthletePlan } from '../../lib/coach-panel-api.js';
import { CATALOGUE } from '../../lib/exercises.js';
import { exerciseNameFor } from '../../lib/i18n.js';
import { Button } from '../../components/ui.jsx';
import Icon from '../../components/Icon.jsx';

const WEEKDAYS = [
  { id: 6, name: 'شنبه' },
  { id: 0, name: 'یکشنبه' },
  { id: 1, name: 'دوشنبه' },
  { id: 2, name: 'سه‌شنبه' },
  { id: 3, name: 'چهارشنبه' },
  { id: 4, name: 'پنج‌شنبه' },
  { id: 5, name: 'جمعه' }
];

const DAY_ALIAS = { sat: 6, sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5 };

const DEFAULT_MEALS = [
  {
    id: 'm1',
    title: 'صبحانه',
    time: '08:30',
    items: [
      { name: 'سفیده تخم مرغ', amount: '۴ عدد' },
      { name: 'نان جو یا سنگک', amount: '۲ کف دست' },
      { name: 'گردو', amount: '۲ عدد' }
    ],
    note: 'همراه با چای کمرنگ یا آب ولرم'
  },
  {
    id: 'm2',
    title: 'میان‌وعده صبح',
    time: '11:00',
    items: [
      { name: 'سیب یا موز', amount: '۱ عدد' },
      { name: 'کره بادام زمینی', amount: '۱ قاشق غذاخوری' }
    ],
    note: ''
  },
  {
    id: 'm3',
    title: 'ناهار',
    time: '14:00',
    items: [
      { name: 'سینه مرغ گریل', amount: '۱۵۰ گرم' },
      { name: 'برنج کته', amount: '۸ قاشق غذاخوری' },
      { name: 'سالاد فصل بدون سس', amount: '۱ کاسه' }
    ],
    note: 'همراه با روغن زیتون ۱ قاشق مرباخوری'
  },
  {
    id: 'm4',
    title: 'میان‌وعده عصر (قبل تمرین)',
    time: '17:30',
    items: [
      { name: 'قهوه اسپرسو', amount: '۱ شات' },
      { name: 'خرما', amount: '۲ عدد' }
    ],
    note: '۳۰ تا ۴۵ دقیقه قبل از شروع تمرین'
  },
  {
    id: 'm5',
    title: 'شام',
    time: '21:00',
    items: [
      { name: 'فیله مرغ یا گوشت کم‌چرب', amount: '۱۲۰ گرم' },
      { name: 'سبزیجات بخارپز (کلم بروکلی، هویج)', amount: '۱ بشقاب' }
    ],
    note: 'حداقل ۲ ساعت قبل از خواب میل شود'
  }
];

export default function CoachAthletePlan({ athleteId, onBack }) {
  const toast = useUI((s) => s.toast);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('workout'); // 'workout' | 'diet'

  const [athlete, setAthlete] = useState(null);

  // Workout Plan State
  const [routines, setRoutines] = useState([]);
  const [week, setWeek] = useState({});

  // Exercise search state for adding exercise
  const [searchQuery, setSearchQuery] = useState('');
  const [targetRoutineId, setTargetRoutineId] = useState(null);

  // Diet Plan State
  const [dietNotes, setDietNotes] = useState('');
  const [meals, setMeals] = useState([]);

  useEffect(() => {
    getCoachAthlete(athleteId)
      .then((res) => {
        setAthlete(res.athlete);
        const w = res.assignedWorkout || {};
        setRoutines(Array.isArray(w.routines) ? w.routines : []);
        const rawWeek = w.week || {};
        const normalizedWeek = {};
        for (const [k, v] of Object.entries(rawWeek)) {
          const dayNum = k in DAY_ALIAS ? DAY_ALIAS[k] : k;
          normalizedWeek[dayNum] = v;
        }
        setWeek(normalizedWeek);

        const d = res.assignedDiet || {};
        setDietNotes(d.notes || '');
        setMeals(Array.isArray(d.meals) && d.meals.length > 0 ? d.meals : DEFAULT_MEALS);
      })
      .catch((e) => toast(e.message || 'خطا در بارگذاری برنامه‌های شاگرد'))
      .finally(() => setLoading(false));
  }, [athleteId]);

  // Workout manipulation
  const addRoutine = (dayId = null) => {
    const newId = 'r_' + Date.now();
    const dayObj = dayId !== null && dayId !== undefined ? WEEKDAYS.find((d) => d.id === dayId) : null;
    const newRoutine = {
      id: newId,
      name: dayObj ? `تمرین روز ${dayObj.name}` : 'برنامه جدید',
      emoji: 'dumbbell',
      ex: []
    };
    setRoutines((prev) => [...prev, newRoutine]);
    if (dayId !== null && dayId !== undefined) {
      setWeek((prev) => ({ ...prev, [dayId]: [...(prev[dayId] || []), newId] }));
    }
  };

  const removeRoutine = (rId) => {
    setRoutines((prev) => prev.filter((r) => r.id !== rId));
    setWeek((prev) => {
      const next = { ...prev };
      for (const d of Object.keys(next)) {
        next[d] = (next[d] || []).filter((id) => id !== rId);
        if (!next[d].length) delete next[d];
      }
      return next;
    });
  };

  const updateRoutineName = (rId, name) => {
    setRoutines((prev) => prev.map((r) => (r.id === rId ? { ...r, name } : r)));
  };

  const addExerciseToRoutine = (rId, exItem) => {
    const displayName = exItem.name || exerciseNameFor(exItem) || exItem.n || '';
    const newEx = {
      id: exItem.id,
      name: displayName,
      sets: 4,
      reps: 10,
      weight: 0,
      note: ''
    };
    setRoutines((prev) =>
      prev.map((r) => (r.id === rId ? { ...r, ex: [...(r.ex || []), newEx] } : r))
    );
    setSearchQuery('');
    setTargetRoutineId(null);
  };

  const removeExercise = (rId, exIndex) => {
    setRoutines((prev) =>
      prev.map((r) => {
        if (r.id !== rId) return r;
        const nextEx = [...(r.ex || [])];
        nextEx.splice(exIndex, 1);
        return { ...r, ex: nextEx };
      })
    );
  };

  const updateExercise = (rId, exIndex, field, value) => {
    setRoutines((prev) =>
      prev.map((r) => {
        if (r.id !== rId) return r;
        const nextEx = [...(r.ex || [])];
        nextEx[exIndex] = { ...nextEx[exIndex], [field]: value };
        return { ...r, ex: nextEx };
      })
    );
  };

  // Diet manipulation
  const addMeal = () => {
    const newId = 'm_' + Date.now();
    setMeals((prev) => [
      ...prev,
      {
        id: newId,
        title: `وعده ${prev.length + 1}`,
        time: '',
        items: [{ name: '', amount: '' }],
        note: ''
      }
    ]);
  };

  const removeMeal = (mId) => {
    setMeals((prev) => prev.filter((m) => m.id !== mId));
  };

  const updateMealField = (mId, field, val) => {
    setMeals((prev) => prev.map((m) => (m.id === mId ? { ...m, [field]: val } : m)));
  };

  const addMealItem = (mId) => {
    setMeals((prev) =>
      prev.map((m) =>
        m.id === mId ? { ...m, items: [...(m.items || []), { name: '', amount: '' }] } : m
      )
    );
  };

  const updateMealItem = (mId, itemIdx, field, val) => {
    setMeals((prev) =>
      prev.map((m) => {
        if (m.id !== mId) return m;
        const nextItems = [...(m.items || [])];
        nextItems[itemIdx] = { ...nextItems[itemIdx], [field]: val };
        return { ...m, items: nextItems };
      })
    );
  };

  const removeMealItem = (mId, itemIdx) => {
    setMeals((prev) =>
      prev.map((m) => {
        if (m.id !== mId) return m;
        const nextItems = [...(m.items || [])];
        nextItems.splice(itemIdx, 1);
        return { ...m, items: nextItems };
      })
    );
  };

  // Save everything
  const handleSave = async () => {
    setSaving(true);
    try {
      await saveAthletePlan(athleteId, {
        assignedWorkout: {
          routines,
          week
        },
        assignedDiet: {
          notes: dietNotes.trim(),
          meals: meals.filter((m) => m.title.trim())
        }
      });
      toast(`برنامه‌های ${athlete?.name || 'شاگرد'} با موفقیت ذخیره شد`);
    } catch (e) {
      toast(e.message || 'خطا در ذخیره برنامه‌ها');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="narrow" style={{ textAlign: 'center', padding: '60px 16px' }}>
        <div className="muted small">در حال بارگذاری اطلاعات شاگرد...</div>
      </div>
    );
  }

  // Filtered exercises for modal/search (matching Persian and English names)
  const searchResults = searchQuery.trim()
    ? CATALOGUE.filter((e) => {
        const faName = exerciseNameFor(e) || '';
        const enName = e.n || '';
        const q = searchQuery.toLowerCase();
        return faName.toLowerCase().includes(q) || enName.toLowerCase().includes(q);
      }).slice(0, 20)
    : [];

  return (
    <div className="narrow" style={{ direction: 'rtl', textAlign: 'right', paddingBottom: 100 }}>
      {/* Top bar with back and save */}
      <div className="row between" style={{ padding: '12px 16px', borderBottom: '1px solid var(--sep)' }}>
        <Button size="sm" icon="chevron-right" onClick={onBack}>
          بازگشت به لیست شاگردان
        </Button>
        <Button variant="primary" size="sm" disabled={saving} onClick={handleSave}>
          {saving ? 'در حال ذخیره...' : '💾 ذخیره تغییرات'}
        </Button>
      </div>

      <div style={{ padding: '16px 16px 8px' }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>تنظیم برنامه برای: {athlete?.name}</h2>
        <div className="muted small" style={{ marginTop: 4 }}>
          وضعیت اشتراک: {athlete?.subscription?.status === 'active' ? '🟢 فعال' : '🔴 قفل / معوق'}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: '0 16px 16px' }}>
        <div className="row" style={{ gap: 8 }}>
          <button
            className={`btn ${activeTab === 'workout' ? 'primary' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => setActiveTab('workout')}
          >
            🏋️ برنامه تمرینی
          </button>
          <button
            className={`btn ${activeTab === 'diet' ? 'primary' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => setActiveTab('diet')}
          >
            🥗 برنامه غذایی
          </button>
        </div>
      </div>

      {/* ================= WORKOUT TAB ================= */}
      {activeTab === 'workout' && (
        <div style={{ padding: '0 16px' }}>
          <div className="row between" style={{ marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>روال‌های تمرینی ({routines.length} روال)</h3>
            <Button size="sm" icon="plus" onClick={() => addRoutine()}>
              افزودن روال تمرینی
            </Button>
          </div>

          {/* Quick day assignment bar */}
          <div className="card" style={{ marginBottom: 16, padding: '10px 14px' }}>
            <div className="muted small" style={{ marginBottom: 8, fontWeight: 600 }}>
              روزهای هفته:
            </div>
            <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
              {WEEKDAYS.map((d) => {
                const assigned = week[d.id] || [];
                return (
                  <button
                    key={d.id}
                    className="btn"
                    style={{
                      fontSize: 12,
                      padding: '4px 8px',
                      background: assigned.length ? 'var(--acc)' : 'var(--card)',
                      color: assigned.length ? '#000' : 'var(--label-1)',
                      fontWeight: assigned.length ? 700 : 400
                    }}
                    onClick={() => {
                      if (!assigned.length) addRoutine(d.id);
                    }}
                  >
                    {d.name} {assigned.length ? `(${assigned.length})` : '+'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* List of routines */}
          {routines.map((r, rIdx) => (
            <div key={r.id || rIdx} className="card" style={{ marginBottom: 16, borderRadius: 14 }}>
              <div className="row between" style={{ marginBottom: 10, borderBottom: '1px solid var(--sep)', paddingBottom: 8 }}>
                <input
                  className="input"
                  value={r.name}
                  onChange={(e) => updateRoutineName(r.id, e.target.value)}
                  style={{ fontWeight: 700, fontSize: 15, flex: 1, maxWidth: 260 }}
                  placeholder="نام روال (مثلاً سینه و زیربغل)"
                />
                <Button size="sm" variant="danger" onClick={() => removeRoutine(r.id)}>
                  حذف روال
                </Button>
              </div>

              {/* Exercises inside routine */}
              <div className="list" style={{ gap: 8 }}>
                {(r.ex || []).map((ex, exIdx) => (
                  <div
                    key={exIdx}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: '1px solid var(--sep)'
                    }}
                  >
                    <div className="row between" style={{ marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>
                        {exIdx + 1}. {ex.name}
                      </span>
                      <button
                        className="iconbtn"
                        style={{ color: 'var(--red)' }}
                        onClick={() => removeExercise(r.id, exIdx)}
                      >
                        ✕
                      </button>
                    </div>

                    <div className="row" style={{ gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div className="row" style={{ gap: 4, alignItems: 'center' }}>
                        <span className="muted small">تعداد ست:</span>
                        <input
                          className="input"
                          type="number"
                          value={ex.sets}
                          onChange={(e) => updateExercise(r.id, exIdx, 'sets', +e.target.value)}
                          style={{ width: 55, padding: '4px 6px', textAlign: 'center', direction: 'ltr' }}
                        />
                      </div>

                      <div className="row" style={{ gap: 4, alignItems: 'center' }}>
                        <span className="muted small">تکرار:</span>
                        <input
                          className="input"
                          value={ex.reps}
                          onChange={(e) => updateExercise(r.id, exIdx, 'reps', e.target.value)}
                          style={{ width: 70, padding: '4px 6px', textAlign: 'center', direction: 'ltr' }}
                          placeholder="مثلاً 10"
                        />
                      </div>

                      <input
                        className="input"
                        value={ex.note || ''}
                        onChange={(e) => updateExercise(r.id, exIdx, 'note', e.target.value)}
                        placeholder="نکته یا وزن هدف (اختیاری)"
                        style={{ flex: 1, minWidth: 140, padding: '4px 8px', fontSize: 12 }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Button to open exercise search */}
              <div style={{ marginTop: 10 }}>
                {targetRoutineId === r.id ? (
                  <div style={{ background: 'var(--card)', padding: 10, borderRadius: 10, border: '1px solid var(--acc)' }}>
                    <div className="row between" style={{ marginBottom: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>جستجو و انتخاب حرکت:</span>
                      <Button size="sm" onClick={() => setTargetRoutineId(null)}>
                        بستن ✕
                      </Button>
                    </div>
                    <input
                      className="input"
                      placeholder="نام حرکت به انگلیسی یا فارسی..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ width: '100%', marginBottom: 8 }}
                      autoFocus
                    />
                    {/* Results list */}
                    <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                      {searchResults.map((e) => (
                        <div
                          key={e.id}
                          onClick={() => addExerciseToRoutine(r.id, e)}
                          style={{
                            padding: '6px 8px',
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--sep)',
                            fontSize: 13
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>{exerciseNameFor(e)}</span>
                          <span className="muted small" style={{ marginRight: 6 }}>
                            ({e.n})
                          </span>
                        </div>
                      ))}
                      {searchQuery.trim() && searchResults.length === 0 && (
                        <div
                          onClick={() => addExerciseToRoutine(r.id, { id: 'c_' + Date.now(), name: searchQuery.trim() })}
                          style={{ padding: '8px', cursor: 'pointer', color: 'var(--acc)', fontWeight: 600 }}
                        >
                          + افزودن «{searchQuery}» به عنوان حرکت سفارشی
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <Button size="sm" icon="plus" onClick={() => setTargetRoutineId(r.id)}>
                    افزودن حرکت به این روال
                  </Button>
                )}
              </div>
            </div>
          ))}

          {routines.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '30px 16px' }}>
              <div className="muted small" style={{ marginBottom: 12 }}>
                هنوز هیچ روال تمرینی برای این شاگرد ایجاد نشده است.
              </div>
              <Button variant="primary" size="sm" icon="plus" onClick={() => addRoutine()}>
                شروع با اولین روال تمرینی
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ================= DIET TAB ================= */}
      {activeTab === 'diet' && (
        <div style={{ padding: '0 16px' }}>
          {/* General Notes */}
          <div className="card" style={{ marginBottom: 16 }}>
            <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: 6 }}>
              💡 توصیه‌های کلی مربی (مصرف آب، مکمل، توصیه‌های خواب و...):
            </label>
            <textarea
              className="input"
              rows={3}
              placeholder="مثلاً: روزانه حداقل ۳ لیتر آب، کراتین ۵ گرم بعد تمرین..."
              value={dietNotes}
              onChange={(e) => setDietNotes(e.target.value)}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <div className="row between" style={{ marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>وعده‌های غذایی ({meals.length} وعده)</h3>
            <Button size="sm" icon="plus" onClick={addMeal}>
              افزودن وعده جدید
            </Button>
          </div>

          {meals.map((meal, mIdx) => (
            <div key={meal.id || mIdx} className="card" style={{ marginBottom: 14, borderRadius: 14 }}>
              <div className="row between" style={{ marginBottom: 10, borderBottom: '1px solid var(--sep)', paddingBottom: 8 }}>
                <div className="row" style={{ gap: 8, flex: 1 }}>
                  <input
                    className="input"
                    value={meal.title}
                    onChange={(e) => updateMealField(meal.id, 'title', e.target.value)}
                    placeholder="عنوان وعده (صبحانه، ناهار...)"
                    style={{ fontWeight: 700, maxWidth: 160 }}
                  />
                  <input
                    className="input"
                    value={meal.time || ''}
                    onChange={(e) => updateMealField(meal.id, 'time', e.target.value)}
                    placeholder="ساعت (مثلاً 08:30)"
                    style={{ width: 100, direction: 'ltr', textAlign: 'center' }}
                  />
                </div>
                <Button size="sm" variant="danger" onClick={() => removeMeal(meal.id)}>
                  حذف وعده
                </Button>
              </div>

              {/* Items in meal */}
              <div className="list" style={{ gap: 6, marginBottom: 8 }}>
                {(meal.items || []).map((item, itemIdx) => (
                  <div key={itemIdx} className="row" style={{ gap: 6, alignItems: 'center' }}>
                    <input
                      className="input"
                      placeholder="نام ماده غذایی (مثلاً سفیده تخم‌مرغ)"
                      value={item.name}
                      onChange={(e) => updateMealItem(meal.id, itemIdx, 'name', e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <input
                      className="input"
                      placeholder="مقدار (مثلاً ۳ عدد / ۱۵۰ گرم)"
                      value={item.amount}
                      onChange={(e) => updateMealItem(meal.id, itemIdx, 'amount', e.target.value)}
                      style={{ width: 140 }}
                    />
                    <button
                      className="iconbtn"
                      style={{ color: 'var(--red)' }}
                      onClick={() => removeMealItem(meal.id, itemIdx)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="row between" style={{ marginTop: 6 }}>
                <Button size="sm" icon="plus" onClick={() => addMealItem(meal.id)}>
                  افزودن آیتم غذایی
                </Button>
              </div>

              <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--sep)' }}>
                <input
                  className="input"
                  placeholder="نکته مخصوص این وعده (اختیاری)"
                  value={meal.note || ''}
                  onChange={(e) => updateMealField(meal.id, 'note', e.target.value)}
                  style={{ width: '100%', fontSize: 12 }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
