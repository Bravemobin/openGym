import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore.js";
import {
  DAYN,
  weekOrder,
  weekStartOf,
  uid,
  exCount,
  routineCount,
} from "../lib/format.js";
import { t } from "../lib/i18n.js";
import {
  dayAssignSheet,
  dayAddRoutineSheet,
  starterPlanSheet,
  planToolsSheet,
  confirmSheet,
} from "../sheets.jsx";
import Icon from "../components/Icon.jsx";
import { Button } from "../components/ui.jsx";
import SwipeToDelete from "../components/SwipeToDelete.jsx";
import LanguageSelect from "../components/LanguageSelect.jsx";
import { deleteRoutine } from "../lib/routines.js";
import { tappable } from "../lib/use-sheet-keyboard.js";
import { glyphOf, DEFAULT_GLYPH } from "../lib/glyphs.js";
import { DEMO } from "../lib/demo.js";
import { MOBILE } from "../lib/mobile.js";
import { coachAvailable } from "../lib/coach.js";
import AthletePaywall from "../components/AthletePaywall.jsx";
import { useUI } from "../store/useUI.js";

export default function Plan() {
  const nav = useNavigate();
  const S = useStore((s) => s.S);
  const update = useStore((s) => s.update);
  const pullState = useStore((s) => s.pullState);
  const config = useStore((s) => s.config);
  const coachMode = useStore((s) => s.coachLocal?.mode);
  const user = useStore((s) => s.user);

  // ponytail: robust subscription check using both store state and user object
  const subStatus = S?.subscription?.status || user?.subscription?.status;
  const isSubActive = !!user?.admin || subStatus === "active";
  const isLocked = !isSubActive;

  if (isLocked) {
    return (
      <div style={{ paddingBottom: 80, direction: "rtl", textAlign: "right" }}>
        <div className="hdr">
          <div>
            <h1>{t("Plan")}</h1>
            <div className="sub">برنامه تمرینی اختصاصی</div>
          </div>
        </div>
        <AthletePaywall onStatusChange={() => pullState()} />
      </div>
    );
  }

  const hasRoutines = Array.isArray(S?.routines) && S.routines.length > 0;
  const hasAssigned =
    Array.isArray(S?.assignedWorkout?.routines) &&
    S.assignedWorkout.routines.length > 0;

  /* The Coach's only entry point in the app. Its screens have existed since the UI landed and
     nothing linked to them, so the feature was reachable only by typing the URL — enabled,
     configured, and invisible. The same predicate every other Coach surface uses gates it, so
     an instance without the feature sees exactly the Plan screen it saw before. */
  const showCoach = coachAvailable(config, user, {
    demo: DEMO,
    mobile: MOBILE,
    coachMode,
  });

  // Swap with the neighbour, the way the routine editor moves an exercise. `S.routines` is the
  // one order the whole app reads, so this is all there is to it (#142).
  const moveRoutine = (i, delta) =>
    update((s) => {
      const to = i + delta;
      if (to < 0 || to >= s.routines.length) return;
      const [moved] = s.routines.splice(i, 1);
      s.routines.splice(to, 0, moved);
    });

  const addRoutine = () => {
    const r = {
      id: uid(),
      name: t("New routine"),
      emoji: DEFAULT_GLYPH,
      ex: [],
    };
    update((s) => {
      s.routines.push(r);
    });
    nav("/plan/r/" + r.id);
  };

  // Pull one routine off a weekday; drop the key when the day empties (never store []).
  const removeFromDay = (d, rid) =>
    update((s) => {
      const next = [].concat(s.week[d] || []).filter((id) => id !== rid);
      if (next.length) s.week[d] = next;
      else delete s.week[d];
    });

  // The same confirmation and the same delete as RoutineEdit's "Delete routine" button, minus
  // its navigation back to /plan, which this screen already is.
  const confirmDelete = (r) =>
    confirmSheet({
      title: t("Delete routine?"),
      message: t("“{0}” and its exercises will be removed.", r.name),
      confirmText: t("Delete"),
      danger: true,
      onConfirm: () =>
        update((s) => {
          deleteRoutine(s, r.id);
        }),
    });

  return (
    <>
      <div className="hdr">
        <div>
          <h1>{t("Plan")}</h1>
          <div className="sub">{t("Your weekly routine")}</div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flex: "none",
          }}
        >
          {/* <LanguageSelect /> */}
          {/* <button
            className="iconbtn"
            onClick={planToolsSheet}
            aria-label={t("Share your plan")}
            title={t("Share your plan")}
          >
            <Icon name="upload" />
          </button> */}
        </div>
      </div>

      <div style={{ padding: "12px 0", display: "flex", gap: 8 }}>
        <button
          className="btn primary"
          style={{ flex: 1, justifyContent: "center" }}
        >
          🏋️ برنامه تمرینی
        </button>
        <button
          className="btn"
          style={{ flex: 1, justifyContent: "center" }}
          onClick={() => nav("/diet")}
        >
          🥗 برنامه غذایی
        </button>
      </div>

      {!hasRoutines && !hasAssigned && (
        <div
          className="card"
          style={{
            margin: "0 16px 14px",
            background: "rgba(0, 122, 255, 0.08)",
            borderColor: "rgba(0, 122, 255, 0.25)",
            padding: "16px",
          }}
        >
          <div
            className="row"
            style={{
              gap: 8,
              color: "var(--blue)",
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            <Icon name="clock" />
            <span>شهریه فعال — در انتظار ثبت برنامه توسط مربی</span>
          </div>
          <div className="dim small" style={{ lineHeight: 1.6 }}>
            شهریه دوره شما تایید شده و فعال است. مربی شما در حال تنظیم برنامه
            تمرینی اختصاصی شماست و به محض ثبت، برنامه به صورت خودکار در این صفحه
            قرار خواهد گرفت.
          </div>
        </div>
      )}

      {/* {S?.assignedWorkout?.routines?.length > 0 && (
        <div
          className="card"
          style={{
            margin: "0 16px 14px",
            background: "rgba(52, 199, 89, 0.08)",
            borderColor: "rgba(52, 199, 89, 0.3)",
          }}
        >
          <div className="row between" style={{ marginBottom: 6 }}>
            <span style={{ fontWeight: 700, color: "var(--green)" }}>
              ✓ برنامه مربی آماده است
            </span>
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                update((s) => {
                  s.routines = S.assignedWorkout.routines;
                  if (S.assignedWorkout.week) s.week = S.assignedWorkout.week;
                });
                useUI.getState().toast("برنامه مربی در برنامه شما اعمال شد");
              }}
            >
              بارگذاری در برنامه هفتگی
            </Button>
          </div>
          <div className="dim small">
            مربی برای شما {S.assignedWorkout.routines.length} روال تمرینی تنظیم
            کرده است. برای اعمال در جدول هفتگی، دکمه بالا را بزنید.
          </div>
        </div>
      )} */}
      {/* {showCoach && <button className="coach-cta" onClick={() => nav('/coach')}>
      <span className="coach-cta-av"><Icon name="sparkles" /></span>
      <span className="coach-cta-t">
        <b>{t('Coach')}</b>
        <span>{t('Plan design and reviews, from your own training')}</span>
      </span>
      <Icon name="chevronRight" className="coach-cta-chev" />
    </button>} */}

      <div className="cols">
        <div>
          <h4 className="sec">{t("Week schedule")}</h4>
          <div
            className="list"
            style={{ display: "flex", flexDirection: "column" }}
          >
            {weekOrder(weekStartOf(S)).map((d) => {
              const dayRoutines = []
                .concat(S.week[d] || [])
                .map((id) => S.routines.find((x) => x.id === id))
                .filter(Boolean);
              // An empty day stays one tappable row → pick its first routine (today's behaviour).
              if (!dayRoutines.length)
                return (
                  <div
                    key={d}
                    className="item"
                    {...tappable(() => dayAssignSheet(d))}
                  >
                    <div className="grow">
                      <div className="tt">{t(DAYN[d])}</div>
                    </div>
                    <span className="tag">{t("Rest")}</span>
                    <Icon name="chevronRight" className="chev" />
                  </div>
                );
              // A populated day: always-visible routine sub-rows + inline ✕. Adding a second routine
              // is a small ＋ in the day's header, centred over the ✕ column (#276): a full-width
              // "＋ Add routine" under every planned day made the week read as a list of buttons,
              // when most people train one routine a day. The ＋ keeps the option for those who don't.
              return (
                <div
                  key={d}
                  className="item"
                  style={{ display: "block", padding: "10px 14px" }}
                >
                  <div className="row between" style={{ marginBottom: 6 }}>
                    <div className="tt">{t(DAYN[d])}</div>
                    <div className="row" style={{ gap: 8 }}>
                      <div className="small dim">
                        {routineCount(dayRoutines.length)}
                      </div>
                      <button
                        className="iconbtn sm"
                        aria-label={t("Add routine")}
                        title={t("Add routine")}
                        style={{
                          width: 30,
                          height: 30,
                          margin: "-5px 3px",
                          fontSize: 15,
                        }}
                        onClick={() => dayAddRoutineSheet(d)}
                      >
                        <Icon name="plus" />
                      </button>
                    </div>
                  </div>
                  {dayRoutines.map((r) => (
                    <div
                      key={r.id}
                      className="row"
                      style={{ gap: 8, padding: "4px 0 4px 8px" }}
                    >
                      <span
                        className="lrow-i"
                        style={{ width: 26, height: 26, fontSize: 14 }}
                      >
                        <Icon name={glyphOf(r.emoji)} />
                      </span>
                      <div className="grow" style={{ minWidth: 0 }}>
                        <div className="tt" style={{ fontSize: 14 }}>
                          {r.name}
                        </div>
                        <div className="ss">{exCount(r.ex.length)}</div>
                      </div>
                      <button
                        className="iconbtn sm"
                        aria-label={t("Remove")}
                        onClick={() => removeFromDay(d, r.id)}
                      >
                        <Icon name="xmark" />
                      </button>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <div
            className="row between"
            style={{ marginTop: 22, marginBottom: 10 }}
          >
            <h4 className="sec" style={{ margin: 0 }}>
              {t("Routines")}
            </h4>
            {/* <Button size="sm" variant="tinted" icon="plus" onClick={addRoutine}>
              {t("New")}
            </Button> */}
          </div>
          {S.routines.length ? (
            <div className="list">
              {S.routines.map((r, i) => (
                <SwipeToDelete
                  key={r.id}
                  className="item"
                  deleteLabel={t("Delete routine")}
                  onDelete={() => confirmDelete(r)}
                  {...tappable(() => nav("/plan/r/" + r.id))}
                >
                  <span className="lrow-i">
                    <Icon name={glyphOf(r.emoji)} />
                  </span>
                  <div className="grow">
                    <div className="tt">{r.name}</div>
                    <div className="ss">{exCount(r.ex.length)}</div>
                  </div>
                  {/* The order of this list is the order of `S.routines`, and every other screen reads the
            same array — the Start screen, the day-assignment sheets, the routine pickers. So
            moving a routine here moves it everywhere, which is what the request asked for (#142). */}
                  {S.routines.length > 1 && (
                    <div style={{ display: "flex", gap: 2, flex: "none" }}>
                      <button
                        className="iconbtn"
                        aria-label={t("Move up")}
                        title={t("Move up")}
                        disabled={i === 0}
                        style={{
                          width: 28,
                          height: 24,
                          borderRadius: 7,
                          fontSize: 12,
                        }}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          moveRoutine(i, -1);
                        }}
                      >
                        <Icon name="chevronUp" />
                      </button>
                      <button
                        className="iconbtn"
                        aria-label={t("Move down")}
                        title={t("Move down")}
                        disabled={i === S.routines.length - 1}
                        style={{
                          width: 28,
                          height: 24,
                          borderRadius: 7,
                          fontSize: 12,
                        }}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          moveRoutine(i, 1);
                        }}
                      >
                        <Icon name="chevronDown" />
                      </button>
                    </div>
                  )}
                  <Icon name="chevronRight" className="chev" />
                </SwipeToDelete>
              ))}
            </div>
          ) : (
            <>
              <div className="empty">
                <div className="ico">
                  <Icon name="clipboard" />
                </div>
                {t("No routines yet.")}
                <br />
                {t("Create one or load the starter plan.")}
              </div>
              <Button icon="sparkles" onClick={starterPlanSheet}>
                {t("Load starter plan")}
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
