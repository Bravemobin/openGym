import { useEffect, useState } from "react";
import { useUI } from "../store/useUI.js";
import { useStore } from "../store/useStore.js";
import { api } from "../lib/api.js";
import Icon from "../components/Icon.jsx";
import { Button, Switch, TextField } from "../components/ui.jsx";
import { getLang } from "../lib/i18n.js";
import {
  tAdmin as t,
  relAdmin as rel,
  credentialHintAdmin as credentialHint,
  credentialLabelAdmin as credentialLabel,
  failureTitleAdmin as failureTitle,
} from "./admin-i18n.js";

// Which chips go under which heading. Runtime-backed providers are the ones that need the
// bigger `coach` image; the fixture exists so the whole loop can be walked without any account.
const RUNTIME_IDS = ["claude", "codex"];
const TESTING_IDS = ["fixture"];

export default function AdminCoach() {
  const toast = useUI((s) => s.toast);
  const openSheet = useUI((s) => s.openSheet);
  const [d, setD] = useState(null);
  const [busy, setBusy] = useState(false);
  // The models the endpoint serves, fetched on demand. Seeded from the status call when the
  // stored key already let it list them.
  const [models, setModels] = useState(null);
  // The last "Test the Coach" outcome, shown inline where the button is rather than only as a
  // toast that is gone before anyone has read the provider's reason.
  const [testResult, setTestResult] = useState(null);

  // Every change on this card ends in load(), so load() also re-reads /api/config. The app reads
  // that once per boot, and the Plan tab's Coach card hangs off it: without the re-read, an admin
  // who has just switched the Coach on and connected it finds no Coach anywhere until a reload,
  // which reads as a setup that failed (Discord #install-help, 2026-09-19).
  const load = () =>
    api("/api/admin/coach")
      .then((r) => {
        setD(r);
        setModels(r.knownModels || null);
        useStore.getState().refreshConfig();
      })
      .catch((e) => toast(e.message || "Failed to load"));
  useEffect(() => {
    load();
  }, []);

  const patch = async (body) => {
    setBusy(true);
    try {
      await api("/api/admin/coach/config", {
        method: "POST",
        body: JSON.stringify(body),
      });
      await load();
    } catch (e) {
      toast(e.message);
    }
    setBusy(false);
  };
  const loadModels = async () => {
    setBusy(true);
    try {
      const r = await api("/api/admin/coach/models", {
        method: "POST",
        body: "{}",
      });
      if (r.ok) {
        setModels(r.models);
        toast(r.models.length + " models");
      } else toast(r.error || "Could not list models");
    } catch (e) {
      toast(e.message);
    }
    setBusy(false);
  };
  const test = async () => {
    setBusy(true);
    setTestResult({ pending: true });
    try {
      // The server gives the provider up to 90 s for this round-trip (api/coach/jobs.js testRun),
      // longer than api()'s default for a request; a slow local model must still get its answer.
      const r = await api("/api/admin/coach/test", {
        method: "POST",
        body: "{}",
        timeout: 150000,
      });
      setTestResult(r);
      toast(r.ok ? "Coach test passed ✅" : "Test failed");
      await load();
    } catch (e) {
      setTestResult({ ok: false, error: e.message });
      toast(e.message);
    }
    setBusy(false);
  };
  const disconnect = async () => {
    setBusy(true);
    try {
      await api("/api/admin/coach/disconnect", {
        method: "POST",
        body: JSON.stringify({ provider: d.provider }),
      });
      toast("Credential removed");
      await load();
    } catch (e) {
      toast(e.message);
    }
    setBusy(false);
  };

  if (!d)
    return (
      <div className="card">
        <div className="muted small">{t("Loading Coach status…")}</div>
      </div>
    );

  if (d.disabledByEnv)
    return (
      <div className="card">
        <h2 style={{ margin: "0 0 6px" }}>{t("AI Coach")}</h2>
        <div className="adm-lead">
          {getLang() === "fa" ? (
            <>
              توسط متغیر <code>COACH_DISABLED</code> در محیط سرور به اجبار
              غیرفعال شده است. این متغیر را حذف و سرور را ری‌استارت کنید تا مربی
              در اینجا پیکربندی شود.
            </>
          ) : (
            <>
              Force-disabled by <code>COACH_DISABLED</code> in the server's
              environment. Remove that variable and restart to configure the
              Coach here.
            </>
          )}
        </div>
      </div>
    );

  const meta = d.providers.find((p) => p.id === d.provider) || {};
  const authState = d.auth?.state;
  const authed =
    authState === "connected" ||
    authState === "not-required" ||
    authState === "optional";
  const needsEndpoint = !!meta.baseUrl;
  const hasEndpoint = !needsEndpoint || !!d.baseUrl;
  const live = d.enabled && d.runtime.ok && authed && hasEndpoint;

  const status = !d.enabled ? (
    t("Off — users see no Coach anywhere in the app.")
  ) : live ? (
    <>
      {t("On")} · {meta.label}
      {d.model ? " · " + d.model : ""}
    </>
  ) : !hasEndpoint ? (
    t("On, but no endpoint yet — finish step 2.")
  ) : !authed ? (
    t("On, but no credential yet — finish the Credential step.")
  ) : !d.runtime.ok ? (
    t("On, but the provider cannot be reached — see the Test step.")
  ) : (
    t("On")
  );

  // Chips, grouped.
  const groups = [
    {
      title: t("Paste an API key"),
      hint: t(
        "Plain HTTPS to the provider. Works on the default api image — nothing extra to install.",
      ),
      items: d.providers.filter((p) => p.http),
    },
    {
      title: t("Runs a local AI runtime"),
      hint: t("Needs the bigger api image built with --target coach."),
      items: d.providers.filter((p) => RUNTIME_IDS.includes(p.id)),
    },
    {
      title: t("Testing"),
      hint: t(
        "A built-in fake that answers instantly, so the whole loop can be tried without an account.",
      ),
      items: d.providers.filter((p) => TESTING_IDS.includes(p.id)),
    },
  ];

  const hasCredentialStep = !!(meta.setupToken || meta.apiKey);
  const step1Done = !!d.provider;
  const step2Done = hasEndpoint;
  const step3Done = authed;
  const step4Done = !!d.model;
  const step5Done = !!testResult?.ok || !!d.lastSuccess;
  // Step numbers only count the steps this provider actually shows — and like any wizard,
  // only the first unfinished step stands open; everything done folds to its summary line.
  const flags = [
    step1Done,
    ...(needsEndpoint ? [step2Done] : []),
    ...(hasCredentialStep ? [step3Done] : []),
    step4Done,
    step5Done,
  ];
  const doneCount = flags.filter(Boolean).length;
  const firstTodo = flags.indexOf(false);
  let n = 1;
  let idx = 0;
  const num = () => n++;
  const stepAt = () => {
    const i = idx++;
    return {
      open: i === (firstTodo === -1 ? -1 : firstTodo),
      key: i + ":" + (i === firstTodo),
    };
  };

  // Off = a quiet, optional feature: one clean pitch and one button, no half-dimmed controls.
  if (!d.enabled)
    return (
      <div className="card">
        <div className="adm-hero">
          <div className="adm-hero-av">
            <Icon name="sparkles" />
          </div>
          <h2>{t("AI Coach")}</h2>
          <p>
            {t(
              "An optional coach that designs training plans and reviews what people actually log. Off right now — nobody sees it anywhere in the app.",
            )}
          </p>
          <div className="adm-hero-feats">
            <div>
              <Icon name="clipboard" />
              <span>
                <b>{t("Bring any AI.")}</b>{" "}
                {getLang() === "fa"
                  ? "کلید API از Anthropic، OpenAI یا Gemini — یا یک مدل محلی رایگان از طریق Ollama."
                  : "An API key from Anthropic, OpenAI or Gemini — or a free local model via Ollama."}
              </span>
            </div>
            <div>
              <Icon name="shield" />
              <span>
                <b>{t("Private by design.")}</b>{" "}
                {getLang() === "fa"
                  ? "یک لیست مجاز سخت‌گیرانه مشخص می‌کند چه داده‌هایی ارسال شوند؛ هر تغییری نیازمند تأیید کاربر بوده و قابل بازگشت است."
                  : "A strict allowlist decides what leaves; every change needs the user's yes and can be undone."}
              </span>
            </div>
            <div>
              <Icon name="person" />
              <span>
                <b>{t("Each user decides.")}</b>{" "}
                {getLang() === "fa"
                  ? "روشن کردن آن فقط مربی را در دسترس قرار می‌دهد؛ هر کاربر شخصاً رضایت خود را اعلام می‌کند."
                  : "Turning it on only makes the Coach available; every person consents for themselves."}
              </span>
            </div>
          </div>
          <Button
            variant="primary"
            icon="sparkles"
            disabled={busy}
            onClick={() => patch({ enabled: true })}
          >
            {t("Set up the Coach")}
          </Button>
        </div>
      </div>
    );

  return (
    <div
      className="card"
      style={{ borderColor: live ? "var(--acc)" : undefined }}
    >
      <div className="row between" style={{ marginBottom: 2 }}>
        <h2 style={{ margin: 0 }}>{t("AI Coach")}</h2>
        <Switch
          checked={!!d.enabled}
          disabled={busy}
          onChange={(v) => patch({ enabled: v })}
        />
      </div>
      <div className="adm-status">
        <span className={"adm-pill " + (live ? "ok" : "warn")}>
          {live ? t("ready") : t("not ready")}
        </span>
        <span>{status}</span>
      </div>
      {!live && (
        <div className="adm-progress" aria-hidden="true">
          <i
            style={{
              width: Math.round((doneCount / flags.length) * 100) + "%",
            }}
          />
        </div>
      )}
      <div className="adm-lead">
        {live
          ? t(
              "Users find the Coach under Plan → Coach. This switch is the only place it can be turned off for everyone.",
            )
          : getLang() === "fa"
          ? `${doneCount} از ${flags.length} مرحله انجام شده است — مرحله باز را تکمیل کنید تا مرحله بعدی باز شود.`
          : `${doneCount} of ${flags.length} steps done — finish the open step and the next one unfolds.`}
      </div>

      {d.enabled && (
        <>
          {/* ---------- provider ---------- */}
          {(() => {
            const s = stepAt();
            return (
              <Step
                key={s.key}
                n={num()}
                title={t("Provider")}
                hint={meta.label || t("Which AI answers the Coach")}
                done={step1Done}
                open={s.open}
              >
                <div className="adm-hint">
                  {t(
                    "Pick who answers. A key or token you save stays with its provider, so you can switch back and forth without pasting it again.",
                  )}
                </div>
                {groups.map(
                  (g) =>
                    !!g.items.length && (
                      <div key={g.title} className="adm-group">
                        <div className="adm-group-t">{g.title}</div>
                        <div className="adm-chips">
                          {g.items.map((p) => (
                            <button
                              key={p.id}
                              className={
                                "chip" + (p.id === d.provider ? " on" : "")
                              }
                              disabled={busy}
                              onClick={() => {
                                setTestResult(null);
                                patch({ provider: p.id });
                              }}
                            >
                              {p.label}
                              {p.connected && (
                                <span className="adm-chip-key">
                                  {t("key saved")}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                        <div className="adm-hint" style={{ margin: "6px 0 0" }}>
                          {g.hint}
                        </div>
                      </div>
                    ),
                )}
              </Step>
            );
          })()}

          {/* ---------- endpoint (compatible only) ---------- */}
          {needsEndpoint &&
            (() => {
              const s = stepAt();
              return (
                <Step
                  key={s.key}
                  n={num()}
                  title={t("Endpoint")}
                  hint={d.baseUrl || t("Where the model runs")}
                  done={step2Done}
                  open={s.open}
                >
                  <div className="adm-hint">
                    {getLang() === "fa" ? (
                      <>
                        آدرس هر سروری که با API چت سازگار با OpenAI کار می‌کند:{" "}
                        <b>Ollama</b>، <b>LM Studio</b>، <b>vLLM</b>،{" "}
                        <b>OpenRouter</b>، یا درگاه اختصاصی خودتان. فقط آدرس
                        پایه — بدون <code>/v1</code> و بدون کلید در URL.
                      </>
                    ) : (
                      <>
                        The address of any server that speaks OpenAI's chat API:{" "}
                        <b>Ollama</b>, <b>LM Studio</b>, <b>vLLM</b>,{" "}
                        <b>OpenRouter</b>, or a gateway of your own. Just the
                        base — no <code>/v1</code>, no key in the URL.
                      </>
                    )}
                  </div>
                  <div className="adm-field">
                    <label>{t("Base URL")}</label>
                    <TextField
                      key={d.baseUrl || ""}
                      defaultValue={d.baseUrl || ""}
                      placeholder="http://ollama:11434  or  https://openrouter.ai/api"
                      inputMode="url"
                      autoCapitalize="none"
                      autoCorrect="off"
                      onBlur={(e) =>
                        e.target.value !== (d.baseUrl || "") &&
                        patch({ baseUrl: e.target.value })
                      }
                    />
                  </div>
                  <div className="adm-hint" style={{ margin: 0 }}>
                    {t(
                      "The host is written to the job log, so you can always see where requests went.",
                    )}
                  </div>
                </Step>
              );
            })()}

          {/* ---------- credential ---------- */}
          {hasCredentialStep &&
            (() => {
              const s = stepAt();
              return (
                <Step
                  key={s.key}
                  n={num()}
                  title={t("Credential")}
                  hint={credentialHint(d.auth, meta)}
                  done={step3Done}
                  open={s.open}
                >
                  <div
                    className="row"
                    style={{ gap: 8, flexWrap: "wrap", marginBottom: 8 }}
                  >
                    <CredentialPill auth={d.auth} />
                  </div>
                  {authState === "connected" ? (
                    <>
                      <div className="adm-hint">
                        {getLang() === "fa" ? (
                          <>
                            متصل
                            {d.auth.account
                              ? " به عنوان " + d.auth.account
                              : ""}{" "}
                            از طریق {credentialLabel(d.auth.type)}
                            {d.auth.connectedAt
                              ? " · اضافه شده " + rel(d.auth.connectedAt)
                              : ""}
                            . کلید به صورت رمزنگاری‌شده ذخیره می‌شود و هرگز
                            دوباره نمایش داده نخواهد شد.
                          </>
                        ) : (
                          <>
                            Connected
                            {d.auth.account ? " as " + d.auth.account : ""} via{" "}
                            {credentialLabel(d.auth.type)}
                            {d.auth.connectedAt
                              ? " · added " + rel(d.auth.connectedAt)
                              : ""}
                            . The key is stored encrypted and is never shown
                            again.
                          </>
                        )}
                      </div>
                      <div className="adm-actions">
                        {meta.apiKey && (
                          <Button
                            size="sm"
                            variant="tinted"
                            icon="lock"
                            disabled={busy}
                            onClick={() =>
                              openSheet((close) => (
                                <ApiKeySheet
                                  close={close}
                                  onDone={load}
                                  label={meta.label}
                                  placeholder={meta.keyPlaceholder}
                                  optional={meta.keyOptional}
                                />
                              ))
                            }
                          >
                            {t("Replace key")}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          danger
                          disabled={busy}
                          onClick={disconnect}
                        >
                          {t("Remove")}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      {authState === "unreadable" && (
                        <div
                          className="adm-hint"
                          style={{ color: "var(--red)" }}
                        >
                          {getLang() === "fa" ? (
                            <>
                              اعتبار ذخیره‌شده قابل رمزگشایی نیست. این معمولاً
                              به این معنی است که <code>./data</code> بدون فایل{" "}
                              <code>secret</code> بازیابی شده است. برای رفع این
                              مشکل، کلید را مجدداً وارد کنید.
                            </>
                          ) : (
                            <>
                              The stored credential can't be decrypted. This
                              usually means <code>./data</code> was restored
                              without its <code>secret</code> file. Add the key
                              again to fix it.
                            </>
                          )}
                        </div>
                      )}
                      {authState === "optional" && (
                        <div className="adm-hint">
                          {t(
                            "This endpoint works without a key. Add one only if your server asks for it (OpenRouter does; a model on your own network usually does not).",
                          )}
                        </div>
                      )}
                      {authState === "none" && (
                        <div className="adm-hint">
                          {meta.setupToken
                            ? t(
                                "Paste either a Claude Code setup token (your subscription) or an Anthropic API key (pay per use).",
                              )
                            : t(
                                "Paste an API key from the provider's console. It is stored encrypted on this server and sent to the provider only while a job runs.",
                              )}
                        </div>
                      )}
                      <div className="adm-actions">
                        {meta.setupToken && (
                          <Button
                            size="sm"
                            variant="primary"
                            icon="key"
                            disabled={busy}
                            onClick={() =>
                              openSheet((close) => (
                                <SetupTokenSheet
                                  close={close}
                                  onDone={load}
                                  label={meta.label}
                                />
                              ))
                            }
                          >
                            {t("Add Claude Code token")}
                          </Button>
                        )}
                        {meta.apiKey && (
                          <Button
                            size="sm"
                            variant={meta.setupToken ? undefined : "primary"}
                            icon="lock"
                            disabled={busy}
                            onClick={() =>
                              openSheet((close) => (
                                <ApiKeySheet
                                  close={close}
                                  onDone={load}
                                  label={meta.label}
                                  placeholder={meta.keyPlaceholder}
                                  optional={meta.keyOptional}
                                />
                              ))
                            }
                          >
                            {meta.keyOptional
                              ? t("Add API key (optional)")
                              : t("Add API key")}
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </Step>
              );
            })()}

          {/* ---------- model ---------- */}
          {(() => {
            const s = stepAt();
            return (
              <Step
                key={s.key}
                n={num()}
                title={t("Model")}
                hint={
                  d.model ||
                  (meta.defaultModel
                    ? getLang() === "fa"
                      ? `پیش‌فرض: ${meta.defaultModel}`
                      : `default: ${meta.defaultModel}`
                    : getLang() === "fa"
                    ? "هنوز انتخاب نشده"
                    : "not chosen yet")
                }
                done={step4Done}
                open={s.open}
              >
                <div className="adm-hint">
                  {meta.http
                    ? t(
                        'Which model the provider should use. "List models" asks the provider for its current list, so nothing here goes stale.',
                      )
                    : t(
                        "Optional. Leave it empty to use the runtime's own default.",
                      )}
                </div>
                <div className="adm-field">
                  <label>{t("Model")}</label>
                  {models && models.length ? (
                    <select
                      className="adm-select"
                      value={models.includes(d.model) ? d.model : ""}
                      disabled={busy}
                      onChange={(e) => patch({ model: e.target.value })}
                    >
                      <option value="">
                        {meta.defaultModel
                          ? getLang() === "fa"
                            ? `پیش‌فرض (${meta.defaultModel})`
                            : `Default (${meta.defaultModel})`
                          : t("Pick a model…")}
                      </option>
                      {d.model && !models.includes(d.model) && (
                        <option value={d.model}>
                          {d.model}{" "}
                          {getLang() === "fa"
                            ? "(در لیست نیست)"
                            : "(not in the list)"}
                        </option>
                      )}
                      {models.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <TextField
                      key={d.provider}
                      defaultValue={d.models?.[d.provider] || ""}
                      placeholder={
                        meta.defaultModel
                          ? `Default: ${meta.defaultModel}`
                          : needsEndpoint
                          ? 'e.g. qwen2.5:3b — or press "List models"'
                          : "(runtime default)"
                      }
                      onBlur={(e) =>
                        e.target.value !== (d.models?.[d.provider] || "") &&
                        patch({ model: e.target.value })
                      }
                    />
                  )}
                </div>
                {meta.http && (
                  <div className="adm-actions">
                    <Button
                      size="sm"
                      variant="tinted"
                      icon="reset"
                      disabled={busy}
                      onClick={loadModels}
                    >
                      {models ? t("Refresh list") : t("List models")}
                    </Button>
                    {models && models.length ? (
                      <span
                        className="dim small"
                        style={{ alignSelf: "center" }}
                      >
                        {models.length}{" "}
                        {getLang() === "fa"
                          ? "مدل توسط ارائه‌دهنده ارائه شده است"
                          : "served by the provider"}
                      </span>
                    ) : null}
                  </div>
                )}
              </Step>
            );
          })()}

          {/* ---------- test ---------- */}
          {(() => {
            const s = stepAt();
            return (
              <Step
                key={s.key}
                n={num()}
                title={t("Test")}
                hint={
                  step5Done
                    ? t("passed")
                    : t("one real round trip, no user data")
                }
                done={step5Done}
                open={s.open}
                forceOpen={!!testResult}
              >
                <div className="adm-hint">
                  {t(
                    "Sends one tiny question to the provider and checks the answer. No training data is involved. Do this after every change above.",
                  )}
                </div>
                <div className="adm-actions">
                  <Button
                    size="sm"
                    variant="primary"
                    icon="check"
                    disabled={busy || !authed || !hasEndpoint}
                    onClick={test}
                  >
                    {t("Test the Coach")}
                  </Button>
                </div>
                {(!authed || !hasEndpoint) && (
                  <div className="adm-hint" style={{ margin: "6px 0 0" }}>
                    {!hasEndpoint
                      ? t("Finish the Endpoint step first.")
                      : t("Finish the Credential step first.")}
                  </div>
                )}
                {testResult && (
                  <div
                    className={
                      "adm-result " +
                      (testResult.pending ? "" : testResult.ok ? "ok" : "bad")
                    }
                  >
                    {testResult.pending ? (
                      t("Asking the provider…")
                    ) : testResult.ok ? (
                      <>
                        <b>{t("Passed")}</b>
                        {testResult.version
                          ? " · " + testResult.version
                          : " · " + t("The provider answered as expected.")}
                      </>
                    ) : (
                      <>
                        <b>{t("Failed")}</b>
                        {testResult.error ||
                          " · " + t("No answer from the provider.")}
                      </>
                    )}
                  </div>
                )}
                <div className="adm-kv" style={{ marginTop: 10 }}>
                  <span className="k">{t("Runtime")}</span>
                  <span className="v">
                    {d.runtime.ok ? (
                      <span className="adm-pill ok">{t("ready")}</span>
                    ) : (
                      <span className="adm-pill bad">{t("missing")}</span>
                    )}
                    {d.runtime.version ? (
                      <div className="dim small">{d.runtime.version}</div>
                    ) : null}
                    {!d.runtime.ok && d.runtime.error ? (
                      <div className="small" style={{ color: "var(--red)" }}>
                        {d.runtime.error}
                      </div>
                    ) : null}
                  </span>
                </div>
              </Step>
            );
          })()}

          {/* ---------- advanced ---------- */}
          <details className="adm-fold">
            <summary>
              {t("Advanced")} <Icon name="chevronRight" className="chev" />
            </summary>
            <div className="adm-fold-b">
              <div className="adm-group-t">{t("Limits")}</div>
              <div className="adm-hint">
                {t(
                  "How many Coach runs are allowed per day. Every run is one request on the provider account above. 0 means no limit.",
                )}
              </div>
              <div className="adm-kv">
                <span className="k">{t("Per user, per day")}</span>
                <span className="v">
                  <input
                    className="num"
                    type="number"
                    min="0"
                    max="200"
                    defaultValue={d.caps.perProfileDaily}
                    disabled={busy}
                    onBlur={(e) =>
                      +e.target.value !== d.caps.perProfileDaily &&
                      patch({
                        caps: { ...d.caps, perProfileDaily: +e.target.value },
                      })
                    }
                  />
                </span>
              </div>
              <div className="adm-kv">
                <span className="k">{t("Whole instance, per day")}</span>
                <span className="v">
                  <input
                    className="num"
                    type="number"
                    min="0"
                    max="5000"
                    defaultValue={d.caps.instanceDaily}
                    disabled={busy}
                    onBlur={(e) =>
                      +e.target.value !== d.caps.instanceDaily &&
                      patch({
                        caps: { ...d.caps, instanceDaily: +e.target.value },
                      })
                    }
                  />
                </span>
              </div>
              <div className="adm-hint" style={{ marginTop: 10 }}>
                {t(
                  "How long a chat message, refinement or review note can be. The chat composer and the server both enforce this.",
                )}
              </div>
              <div className="adm-kv">
                <span className="k">{t("Max message length")}</span>
                <span className="v">
                  <input
                    className="num"
                    type="number"
                    min="200"
                    max="4000"
                    defaultValue={d.maxMessageLen}
                    disabled={busy}
                    onBlur={(e) =>
                      +e.target.value !== d.maxMessageLen &&
                      patch({ maxMessageLen: +e.target.value })
                    }
                  />
                </span>
              </div>

              <div className="adm-group-t" style={{ marginTop: 14 }}>
                {t("Compare with others")}
              </div>
              <div
                className="row between"
                style={{ gap: 12, alignItems: "flex-start" }}
              >
                <div className="adm-hint" style={{ margin: 0 }}>
                  <b>{t("Let people compare with each other.")}</b>{" "}
                  {getLang() === "fa"
                    ? "میانه‌های ناشناس (تخمین ۱RM، جلسات در هفته) بین نمایه‌هایی که این گزینه را فعال کرده‌اند؛ حداقل سه نفر باید به اشتراک بگذارند تا ارقام نمایش داده شوند. هر فرد خود این گزینه را در چت مربی فعال می‌کند و تا زمانی که فعال نکند، چیزی نمی‌بیند."
                    : "Anonymous medians (estimated 1RM, sessions per week) across profiles that opt in; at least three must share before anyone sees a number. Each person switches themselves on in the Coach chat, and sees nothing unless they do."}
                </div>
                <Switch
                  checked={!!d.community}
                  disabled={busy}
                  onChange={(v) => patch({ community: v })}
                />
              </div>

              <div className="adm-group-t" style={{ marginTop: 14 }}>
                {t("Whose account pays")}
              </div>
              <div className="adm-hint">
                {d.authMode === "profile"
                  ? t("Each profile signs in with their own account.")
                  : d.auth?.type === "apikey" || meta.http
                  ? t(
                      "One API key for the whole instance: every profile may use the Coach with it, and the daily limits above are what bound the spend.",
                    )
                  : d.boundUid
                  ? t(
                      "One personal account, already in use by one profile. Every other profile is refused, so nobody spends somebody else's subscription.",
                    )
                  : t(
                      "One personal account. The first profile to use it becomes the only one allowed to — every other profile is then refused. Paste an API key instead if the whole instance should have the Coach.",
                    )}
              </div>

              <div className="adm-group-t" style={{ marginTop: 14 }}>
                {t("Isolation")}
              </div>
              <div className="adm-hint">
                {d.unprivileged && !d.unprivileged.ok ? (
                  <span style={{ color: "var(--red)" }}>
                    {getLang() === "fa"
                      ? `وظایف مسدود شده‌اند: ${d.unprivileged.why}. تا رفع این مشکل، چیزی اجرا نمی‌شود.`
                      : `Jobs are blocked: ${d.unprivileged.why}. Nothing runs until this is fixed.`}
                  </span>
                ) : d.unprivileged?.dropped ? (
                  getLang() === "fa" ? (
                    "وظایف به عنوان یک کاربر بدون دسترسی مجزا اجرا می‌شوند که امکان خواندن دایرکتوری داده‌ها یا کلیدهای امنیتی را ندارد."
                  ) : (
                    "Jobs run as a separate unprivileged user that cannot read your data directory or secrets."
                  )
                ) : d.unprivileged?.why?.includes("no child process") ? (
                  getLang() === "fa" ? (
                    "برای این ارائه‌دهنده نیازی نیست — این مورد یک درخواست HTTPS ارسال می‌کند و برنامه‌ای روی این سرور اجرا نمی‌کند."
                  ) : (
                    "Not needed for this provider — it makes an HTTPS request and starts no program on this server."
                  )
                ) : getLang() === "fa" ? (
                  "وظایف با کاربر خود سرور روی این میزبان اجرا می‌شوند (کاربر مجزایی وجود ندارد)."
                ) : (
                  "Jobs run with the server's own user on this host (no separate user to drop to)."
                )}
              </div>
            </div>
          </details>

          {/* ---------- activity ---------- */}
          <details className="adm-fold">
            <summary>
              {t("Activity")} <Icon name="chevronRight" className="chev" />
            </summary>
            <div className="adm-fold-b">
              <div
                className="tiles"
                style={{ textAlign: "start", marginBottom: 10 }}
              >
                <div className="tile">
                  <div className="l">{t("Jobs today")}</div>
                  <div className="v" style={{ fontSize: "1.1rem" }}>
                    {d.jobsToday}
                  </div>
                </div>
                <div className="tile">
                  <div className="l">{t("Last success")}</div>
                  <div className="v" style={{ fontSize: ".85rem" }}>
                    {rel(d.lastSuccess?.at)}
                  </div>
                </div>
              </div>
              {d.lastError && (
                <>
                  <div className="adm-group-t">{t("Last failure")}</div>
                  <div
                    className="adm-result bad"
                    style={{ marginTop: 0, marginBottom: 10 }}
                  >
                    <b>{failureTitle(d.lastError.errorClass)}</b>
                    {d.lastError.detail ? (
                      <span className="small">{d.lastError.detail}</span>
                    ) : null}
                    <div
                      className="dim"
                      style={{ fontSize: ".72rem", marginTop: 4 }}
                    >
                      {rel(d.lastError.at)}
                    </div>
                  </div>
                </>
              )}
              <div className="adm-group-t">{t("Recent jobs")}</div>
              {d.recent?.length ? (
                <div className="adm-log">
                  {d.recent.slice(0, 10).map((e, i) => (
                    <div key={i} className="adm-log-row">
                      <span>
                        {e.kind === "create" ? t("Plan") : t("Review")}
                        {e.trigger === "scheduled"
                          ? getLang() === "fa"
                            ? " · زمان‌بندی‌شده"
                            : " · scheduled"
                          : ""}{" "}
                        ·{" "}
                        <span
                          style={{
                            color:
                              e.outcome === "failed"
                                ? "var(--red)"
                                : e.outcome === "ready"
                                ? "var(--acc)"
                                : "var(--label-2)",
                          }}
                        >
                          {e.outcome}
                        </span>
                        {e.ms ? " · " + Math.round(e.ms / 1000) + " s" : ""}
                      </span>
                      <span className="when">{rel(e.at)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="adm-empty">{t("No jobs yet.")}</div>
              )}
              <div className="adm-hint" style={{ margin: "8px 0 0" }}>
                {t(
                  "Counts and outcomes only. What people asked the Coach, and what it answered, is never shown here.",
                )}
              </div>
            </div>
          </details>
        </>
      )}
    </div>
  );
}

/* ---------------------------------- pieces ---------------------------------- */

function Step({ n, title, hint, done, open, forceOpen, children }) {
  // `key` remounts the <details> when the wizard advances, so the next step unfolds itself.
  return (
    <details
      className={"adm-step " + (done ? "done" : "todo")}
      open={open || forceOpen}
    >
      <summary>
        <span className="adm-num">{done ? <Icon name="check" /> : n}</span>
        <span className="adm-step-t">
          <b>{title}</b>
          <span>{hint}</span>
        </span>
        <Icon name="chevronRight" className="chev" />
      </summary>
      <div className="adm-step-b">{children}</div>
    </details>
  );
}

function CredentialPill({ auth }) {
  const s = auth?.state;
  if (s === "connected")
    return (
      <span className="adm-pill ok">
        {t("connected")}
        {auth.account ? " · " + auth.account : ""}
      </span>
    );
  if (s === "not-required")
    return <span className="adm-pill">{t("not needed")}</span>;
  if (s === "optional")
    return <span className="adm-pill">{t("optional — none saved")}</span>;
  if (s === "unreadable")
    return <span className="adm-pill bad">{t("can't be read")}</span>;
  return <span className="adm-pill warn">{t("needed")}</span>;
}

/* ------------------------------- setup token -------------------------------- */

function SetupTokenSheet({ close, onDone, label }) {
  const toast = useUI((s) => s.toast);
  const [token, setToken] = useState("");
  // Which account this token belongs to. Optional, and stored as a plain label — it is what the
  // admin card and the user's Coach screen both show when they name whose account is spent.
  const [account, setAccount] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const r = await api("/api/admin/coach/connect", {
        method: "POST",
        body: JSON.stringify({
          type: "cli-token",
          token: token.trim(),
          account: account.trim(),
        }),
      });
      setToken("");
      toast(r.test?.ok ? "Connected ✅" : "Token saved");
      close();
      onDone();
    } catch (e) {
      toast(e.message);
      setBusy(false);
    }
  };

  return (
    <>
      <h3>{getLang() === "fa" ? `اتصال ${label}` : `Connect ${label}`}</h3>
      <div
        className="muted small"
        style={{ lineHeight: 1.5, marginBottom: 12 }}
      >
        {getLang() === "fa" ? (
          <>
            در یک رایانه مطمئن که از Claude Code استفاده می‌کنید، دستور{" "}
            <code>claude setup-token</code> را اجرا کرده، مراحل ورود در مرورگر
            را تکمیل کنید، سپس توکنی را که چاپ می‌کند اینجا قرار دهید. این
            برنامه هرگز جریان احراز هویت Claude را مدیریت نمی‌کند.
          </>
        ) : (
          <>
            On a trusted computer where you use Claude Code, run{" "}
            <code>claude setup-token</code>, complete its normal browser
            sign-in, then paste the token it prints here. This app never opens
            or handles Claude's authorization flow.
          </>
        )}
      </div>
      <TextField
        value={token}
        autoFocus
        type="password"
        placeholder="paste setup token"
        onChange={(e) => setToken(e.target.value)}
      />
      <div style={{ height: 8 }} />
      <TextField
        value={account}
        placeholder="whose account is this? (e.g. you@example.com)"
        onChange={(e) => setAccount(e.target.value)}
      />
      <div style={{ height: 12 }} />
      <Button variant="primary" disabled={busy || !token.trim()} onClick={save}>
        {t("Save token")}
      </Button>
      <div style={{ height: 8 }} />
    </>
  );
}

function ApiKeySheet({ close, onDone, label, placeholder, optional }) {
  const toast = useUI((s) => s.toast);
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      const r = await api("/api/admin/coach/connect", {
        method: "POST",
        body: JSON.stringify({ type: "apikey", token: key.trim() }),
      });
      toast(r.test?.ok ? "Key saved ✅" : "Key saved");
      close();
      onDone();
    } catch (e) {
      toast(e.message);
      setBusy(false);
    }
  };
  return (
    <>
      <h3>{getLang() === "fa" ? `کلید API ${label}` : `${label} API key`}</h3>
      <div
        className="muted small"
        style={{ lineHeight: 1.5, marginBottom: 12 }}
      >
        {getLang() === "fa" ? (
          <>
            به صورت رمزنگاری‌شده در این سرور ذخیره می‌شود و تنها در زمان اجرای
            وظیفه برای ارائه‌دهنده ارسال می‌گردد. هرگز مجدداً نمایش داده نمی‌شود
            و هرگز سرور را ترک نمی‌کند
            {optional
              ? " — و برای پایانه‌ای که نیاز به کلید ندارد، می‌توانید این مورد را خالی بگذارید و برگه را ببندید."
              : "."}
          </>
        ) : (
          <>
            Stored encrypted on this server and sent to the provider only while
            a job runs. It is never shown again and never leaves the server
            {optional
              ? " — and for an endpoint that takes no key, you can leave this empty and close the sheet."
              : "."}
          </>
        )}
      </div>
      <TextField
        value={key}
        autoFocus
        type="password"
        placeholder={placeholder || "sk-…"}
        autoCapitalize="none"
        autoCorrect="off"
        onChange={(e) => setKey(e.target.value)}
      />
      <div style={{ height: 12 }} />
      <Button variant="primary" disabled={busy || !key.trim()} onClick={save}>
        {t("Save key")}
      </Button>
      <div style={{ height: 8 }} />
    </>
  );
}
