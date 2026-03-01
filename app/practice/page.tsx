"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// ─── 型 ────────────────────────────────────────────────────
interface MessageCache {
  date: string;
  message: string;
  speaker: string;
}

// ─── 定数 ──────────────────────────────────────────────────
const MODES = [
  { id: "casual",     label: "日常雑談",     sub: "日々の会話を深める",       mark: "◯" },
  { id: "oneonone",   label: "仕事の 1on1",  sub: "問いで場を耕す",           mark: "◈" },
  { id: "introspect", label: "自己内省",      sub: "自分の内側を探る",         mark: "◎" },
  { id: "book",       label: "読書振り返り",  sub: "言葉を問いに変える",       mark: "冊" },
] as const;

type ModeId = (typeof MODES)[number]["id"];

// ─── 成長の木 SVG ──────────────────────────────────────────
function DojoTree({ level }: { level: number }) {
  const lv = Math.min(level, 5);

  return (
    <svg
      viewBox="0 0 140 160"
      width={140}
      height={160}
      aria-label={`成長の木 Lv.${level}`}
    >
      {/* 地面 */}
      <path
        d="M18,142 Q70,137 122,142"
        stroke="var(--dojo-border)"
        strokeWidth="1.2"
        fill="none"
      />

      {/* Lv0: 種 */}
      {lv === 0 && (
        <>
          <ellipse cx="70" cy="140" rx="6" ry="4" fill="var(--dojo-ink)" opacity="0.2" />
          <text x="70" y="156" textAnchor="middle" fontSize="9"
            fill="var(--dojo-muted)" fontFamily="Noto Sans JP, sans-serif">
            種を蒔く
          </text>
        </>
      )}

      {/* Lv1以上: 幹 */}
      {lv >= 1 && (
        <path d="M70,140 Q68,118 70,98"
          stroke="var(--dojo-ink)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.65" />
      )}

      {/* Lv1: 芽 */}
      {lv === 1 && (
        <>
          <path d="M70,118 Q56,106 60,94 Q68,102 70,114"
            fill="var(--dojo-bamboo)" opacity="0.5" />
          <path d="M70,121 Q84,109 80,97 Q72,105 70,117"
            fill="var(--dojo-bamboo)" opacity="0.5" />
        </>
      )}

      {/* Lv2: 若木 */}
      {lv === 2 && (
        <>
          <path d="M70,98 Q67,80 69,64"
            stroke="var(--dojo-ink)" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.6" />
          <path d="M70,94 Q52,82 44,68"
            stroke="var(--dojo-ink)" strokeWidth="1.1" strokeLinecap="round" fill="none" opacity="0.55" />
          <path d="M70,88 Q88,76 96,62"
            stroke="var(--dojo-ink)" strokeWidth="1.1" strokeLinecap="round" fill="none" opacity="0.55" />
          <ellipse cx="42" cy="64" rx="13" ry="9" fill="var(--dojo-bamboo)" opacity="0.45" />
          <ellipse cx="98" cy="58" rx="13" ry="9" fill="var(--dojo-bamboo)" opacity="0.45" />
          <ellipse cx="69" cy="56" rx="13" ry="9" fill="var(--dojo-bamboo)" opacity="0.48" />
        </>
      )}

      {/* Lv3: 成長した木 */}
      {lv === 3 && (
        <>
          <path d="M70,98 Q66,72 68,48"
            stroke="var(--dojo-ink)" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.62" />
          <path d="M70,90 Q48,76 34,58"
            stroke="var(--dojo-ink)" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.55" />
          <path d="M70,80 Q92,66 106,50"
            stroke="var(--dojo-ink)" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.55" />
          <path d="M50,80 Q36,68 28,54"
            stroke="var(--dojo-ink)" strokeWidth="0.9" strokeLinecap="round" fill="none" opacity="0.4" />
          <path d="M90,74 Q106,62 112,48"
            stroke="var(--dojo-ink)" strokeWidth="0.9" strokeLinecap="round" fill="none" opacity="0.4" />
          <ellipse cx="32" cy="50" rx="15" ry="10" fill="var(--dojo-bamboo)" opacity="0.42" />
          <ellipse cx="110" cy="45" rx="15" ry="10" fill="var(--dojo-bamboo)" opacity="0.42" />
          <ellipse cx="68" cy="38" rx="18" ry="12" fill="var(--dojo-bamboo)" opacity="0.46" />
          <ellipse cx="48" cy="42" rx="12" ry="9" fill="var(--dojo-bamboo)" opacity="0.38" />
          <ellipse cx="92" cy="38" rx="12" ry="9" fill="var(--dojo-bamboo)" opacity="0.38" />
        </>
      )}

      {/* Lv4: 大木 */}
      {lv === 4 && (
        <>
          <path d="M70,100 Q64,66 67,38"
            stroke="var(--dojo-ink)" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.62" />
          <path d="M70,90 Q44,74 28,54"
            stroke="var(--dojo-ink)" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.52" />
          <path d="M70,78 Q96,62 112,44"
            stroke="var(--dojo-ink)" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.52" />
          <path d="M44,76 Q28,62 20,46"
            stroke="var(--dojo-ink)" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.4" />
          <path d="M96,70 Q114,56 120,42"
            stroke="var(--dojo-ink)" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.4" />
          <path d="M68,58 Q52,42 46,26"
            stroke="var(--dojo-ink)" strokeWidth="0.9" strokeLinecap="round" fill="none" opacity="0.38" />
          <path d="M68,50 Q86,34 90,18"
            stroke="var(--dojo-ink)" strokeWidth="0.9" strokeLinecap="round" fill="none" opacity="0.38" />
          <ellipse cx="68" cy="26" rx="22" ry="14" fill="var(--dojo-bamboo)" opacity="0.44" />
          <ellipse cx="22" cy="42" rx="16" ry="11" fill="var(--dojo-bamboo)" opacity="0.4" />
          <ellipse cx="118" cy="40" rx="16" ry="11" fill="var(--dojo-bamboo)" opacity="0.4" />
          <ellipse cx="46" cy="24" rx="14" ry="10" fill="var(--dojo-bamboo)" opacity="0.36" />
          <ellipse cx="90" cy="20" rx="14" ry="10" fill="var(--dojo-bamboo)" opacity="0.36" />
        </>
      )}

      {/* Lv5: 花咲く木 */}
      {lv === 5 && (
        <>
          <path d="M70,100 Q64,66 67,38"
            stroke="var(--dojo-ink)" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.58" />
          <path d="M70,90 Q44,74 28,54"
            stroke="var(--dojo-ink)" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.48" />
          <path d="M70,78 Q96,62 112,44"
            stroke="var(--dojo-ink)" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.48" />
          <path d="M44,76 Q28,62 20,46"
            stroke="var(--dojo-ink)" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.36" />
          <path d="M96,70 Q114,56 120,42"
            stroke="var(--dojo-ink)" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.36" />
          <path d="M68,58 Q52,42 46,26"
            stroke="var(--dojo-ink)" strokeWidth="0.9" strokeLinecap="round" fill="none" opacity="0.34" />
          <path d="M68,50 Q86,34 90,18"
            stroke="var(--dojo-ink)" strokeWidth="0.9" strokeLinecap="round" fill="none" opacity="0.34" />
          {/* 花 */}
          {([
            [68,22],[46,22],[90,16],[22,38],[118,36],[56,38],[82,34],[70,8],
          ] as [number,number][]).map(([cx, cy], i) =>
            [0,72,144,216,288].map((angle) => {
              const r = (angle * Math.PI) / 180;
              const px = cx + Math.cos(r) * 4.5;
              const py = cy + Math.sin(r) * 4.5;
              return (
                <ellipse key={`${i}-${angle}`}
                  cx={px} cy={py} rx="3.8" ry="2.4"
                  transform={`rotate(${angle} ${px} ${py})`}
                  fill="#C07060" opacity="0.65" />
              );
            })
          )}
          {([
            [68,22],[46,22],[90,16],[22,38],[118,36],[56,38],[82,34],[70,8],
          ] as [number,number][]).map(([cx, cy], i) => (
            <circle key={`c${i}`} cx={cx} cy={cy} r="1.8" fill="var(--dojo-gold)" opacity="0.7" />
          ))}
        </>
      )}

      {/* レベル表示 */}
      {lv > 0 && (
        <text x="70" y="156" textAnchor="middle" fontSize="9"
          fill="var(--dojo-muted)" fontFamily="Noto Sans JP, sans-serif" opacity="0.6">
          Lv.{level}
        </text>
      )}
    </svg>
  );
}

// ─── 今日の一言 ────────────────────────────────────────────
function TodaysWord({
  message,
  speaker,
  loading,
}: {
  message: string;
  speaker: string;
  loading: boolean;
}) {
  return (
    <div style={{
      border: "1px solid var(--dojo-border)",
      borderLeft: "3px solid var(--dojo-vermilion)",
      borderRadius: "6px",
      padding: "1.1rem 1.3rem",
      backgroundColor: "var(--dojo-surface)",
      marginBottom: "2rem",
    }}>
      <p style={{
        fontSize: "0.6rem",
        color: "var(--dojo-vermilion)",
        letterSpacing: "0.15em",
        marginBottom: "0.55rem",
        opacity: 0.85,
      }}>
        {speaker} より
      </p>
      {loading ? (
        <div style={{ display: "flex", gap: "6px", padding: "0.5rem 0" }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{
              display: "inline-block",
              width: "5px", height: "5px",
              borderRadius: "50%",
              backgroundColor: "var(--dojo-border)",
              animation: `dot-pulse 1.2s ${i * 0.2}s ease-in-out infinite`,
            }} />
          ))}
        </div>
      ) : (
        <p className="serif" style={{
          fontSize: "0.88rem",
          lineHeight: "1.95",
          color: "var(--dojo-ink)",
          opacity: 0.82,
          letterSpacing: "0.02em",
          margin: 0,
        }}>
          {message}
        </p>
      )}
    </div>
  );
}

// ─── メインページ ──────────────────────────────────────────
export default function PracticePage() {
  const router = useRouter();
  const [mounted, setMounted]         = useState(false);
  const [treeLevel, setTreeLevel]     = useState(0);
  const [streak, setStreak]           = useState(0);
  const [speaker, setSpeaker]         = useState<"ハル" | "ソラ">("ハル");
  const [message, setMessage]         = useState("");
  const [loadingMsg, setLoadingMsg]   = useState(true);
  const [selectedMode, setSelectedMode] = useState<ModeId | null>(null);

  useEffect(() => {
    setMounted(true);

    // 道場データ読み込み
    const lv  = parseInt(localStorage.getItem("dojo_tree_level") ?? "0", 10);
    const str = parseInt(localStorage.getItem("dojo_streak")     ?? "0", 10);
    setTreeLevel(isNaN(lv)  ? 0 : lv);
    setStreak   (isNaN(str) ? 0 : str);

    // 話者を日付で交互切替
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    const sp: "ハル" | "ソラ" = dayOfYear % 2 === 0 ? "ハル" : "ソラ";
    setSpeaker(sp);

    // キャッシュチェック
    const today = new Date().toISOString().split("T")[0];
    try {
      const cached: MessageCache = JSON.parse(localStorage.getItem("dojo_message_cache") ?? "null");
      if (cached?.date === today) {
        setMessage(cached.message);
        setSpeaker(cached.speaker as "ハル" | "ソラ");
        setLoadingMsg(false);
        return;
      }
    } catch { /* ignore */ }

    // 気づきエントリ収集 (kizuki_log: { id, content, prompt, created_at }[])
    const entries: string[] = [];
    try {
      const raw = localStorage.getItem("kizuki_log");
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          arr.slice(-3).forEach((e: unknown) => {
            const rec = e as Record<string, unknown>;
            if (typeof rec?.content === "string") entries.push(rec.content as string);
          });
        }
      }
    } catch { /* ignore */ }

    // API 呼び出し
    const fallback = "今日も、問いと向き合う時間を。小さな一問が、深い気づきへの扉を開きます。";
    fetch("/api/dojo-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries, speaker: sp }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const msg = data?.message ?? fallback;
        setMessage(msg);
        localStorage.setItem("dojo_message_cache", JSON.stringify({ date: today, message: msg, speaker: sp }));
      })
      .catch(() => setMessage(fallback))
      .finally(() => setLoadingMsg(false));
  }, []);

  return (
    <div style={{ backgroundColor: "var(--dojo-paper)", minHeight: "100vh" }}>
      <div style={{ maxWidth: "560px", margin: "0 auto", padding: "2rem 1.25rem 3rem" }}>

        {/* ─── ヘッダー ─── */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          borderBottom: "1px solid var(--dojo-border)",
          paddingBottom: "1.1rem",
          marginBottom: "1.75rem",
        }}>
          <div>
            <p style={{
              fontSize: "0.6rem",
              color: "var(--dojo-indigo)",
              letterSpacing: "0.18em",
              opacity: 0.7,
              marginBottom: "3px",
            }}>
              TOI NO DOJO
            </p>
            <h1 className="serif" style={{
              fontSize: "1.35rem",
              color: "var(--dojo-ink)",
              letterSpacing: "0.12em",
              fontWeight: 300,
              margin: 0,
            }}>
              問いの道場
            </h1>
          </div>

          {/* ストリーク */}
          {mounted && streak > 0 && (
            <div style={{ textAlign: "right" }}>
              <p style={{
                fontSize: "1.4rem",
                color: "var(--dojo-vermilion)",
                lineHeight: 1,
                fontWeight: 300,
              }}>
                {streak}
              </p>
              <p style={{
                fontSize: "0.58rem",
                color: "var(--dojo-muted)",
                letterSpacing: "0.06em",
              }}>
                日連続
              </p>
            </div>
          )}
        </div>

        {/* ─── 今日の一言 ─── */}
        <div style={{ animation: "dojo-fade-in 0.5s ease-out both" }}>
          <TodaysWord message={message} speaker={speaker} loading={loadingMsg} />
        </div>

        {/* ─── 成長の木 ─── */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginBottom: "2rem",
          animation: "dojo-fade-in 0.5s 0.12s ease-out both",
        }}>
          <p style={{
            fontSize: "0.6rem",
            color: "var(--dojo-muted)",
            letterSpacing: "0.12em",
            marginBottom: "0.6rem",
            opacity: 0.7,
          }}>
            成長の木
          </p>
          {mounted
            ? <DojoTree level={treeLevel} />
            : <div style={{ width: 140, height: 160, opacity: 0.1,
                backgroundColor: "var(--dojo-border)", borderRadius: 8 }} />
          }
          {mounted && treeLevel === 0 && (
            <p style={{
              fontSize: "0.68rem",
              color: "var(--dojo-muted)",
              opacity: 0.55,
              marginTop: "0.4rem",
              letterSpacing: "0.04em",
            }}>
              練習を重ねると木が育ちます
            </p>
          )}
        </div>

        {/* ─── モード選択 ─── */}
        <div style={{ animation: "dojo-fade-in 0.5s 0.22s ease-out both" }}>
          <p style={{
            fontSize: "0.6rem",
            color: "var(--dojo-muted)",
            letterSpacing: "0.14em",
            marginBottom: "0.9rem",
            textAlign: "center",
            opacity: 0.7,
          }}>
            稽古の種目を選ぶ
          </p>

          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.65rem",
          }}>
            {MODES.map((mode) => {
              const active = selectedMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => {
                    setSelectedMode(mode.id);
                    router.push(`/practice/${mode.id}`);
                  }}
                  style={{
                    padding: "1rem 0.85rem",
                    background: active ? "var(--dojo-indigo)" : "var(--dojo-surface)",
                    border: `1px solid ${active ? "var(--dojo-indigo)" : "var(--dojo-border)"}`,
                    borderRadius: "8px",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.16s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.borderColor = "var(--dojo-indigo)";
                      e.currentTarget.style.background   = "var(--dojo-paper)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.borderColor = "var(--dojo-border)";
                      e.currentTarget.style.background   = "var(--dojo-surface)";
                    }
                  }}
                >
                  <p style={{
                    fontSize: "0.75rem",
                    color: active ? "#8BAAD0" : "var(--dojo-muted)",
                    marginBottom: "5px",
                    lineHeight: 1,
                    fontFamily: "Noto Sans JP, sans-serif",
                  }}>
                    {mode.mark}
                  </p>
                  <p className="serif" style={{
                    fontSize: "0.9rem",
                    color: active ? "#F0EAD8" : "var(--dojo-ink)",
                    opacity: active ? 1 : 0.8,
                    letterSpacing: "0.05em",
                    margin: "0 0 4px",
                    fontWeight: 300,
                  }}>
                    {mode.label}
                  </p>
                  <p style={{
                    fontSize: "0.62rem",
                    color: active ? "#A8C0D8" : "var(--dojo-muted)",
                    opacity: 0.8,
                    letterSpacing: "0.02em",
                    margin: 0,
                    lineHeight: 1.4,
                  }}>
                    {mode.sub}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── フッター ─── */}
        <div style={{
          borderTop: "1px solid var(--dojo-border)",
          paddingTop: "1.1rem",
          marginTop: "2.5rem",
          textAlign: "center",
        }}>
          <p style={{
            fontSize: "0.62rem",
            color: "var(--dojo-muted)",
            opacity: 0.4,
            letterSpacing: "0.08em",
            marginBottom: "0.75rem",
          }}>
            問いが深まると、木が育つ
          </p>
          {/* 通知リクエストボタン */}
          <button
            onClick={async () => {
              if (!("Notification" in window)) {
                alert("このブラウザは通知をサポートしていません");
                return;
              }
              const permission = await Notification.requestPermission();
              if (permission === "granted") {
                // 毎日18時に通知をスケジュール
                const now = new Date();
                const tomorrow = new Date(now);
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(18);
                tomorrow.setMinutes(0);

                const notificationTime = tomorrow.getTime();
                const ONE_DAY = 24 * 60 * 60 * 1000;

                // ローカルストレージに通知時刻を保存
                localStorage.setItem("dojo_next_notification", notificationTime.toString());

                // Service Worker 経由で通知スケジュール
                if ("serviceWorker" in navigator) {
                  const registration = await navigator.serviceWorker.ready;
                  if (registration) {
                    registration.active?.postMessage({
                      type: "SCHEDULE_NOTIFICATION",
                      time: notificationTime,
                      title: "今日の稽古、お疲れさまでした",
                      body: "問いの道場で練習を始めましょう",
                    });
                  }
                }

                alert("毎日18時に練習リマインダーを設定しました");
              } else {
                alert("通知の許可が必要です");
              }
            }}
            style={{
              background: "none",
              border: "1px solid var(--dojo-border)",
              borderRadius: "4px",
              padding: "0.5rem 1rem",
              fontSize: "0.68rem",
              color: "var(--dojo-indigo)",
              cursor: "pointer",
              fontFamily: "inherit",
              letterSpacing: "0.04em",
              opacity: 0.7,
            }}
          >
            毎日のリマインダーを設定
          </button>
        </div>

      </div>
    </div>
  );
}
