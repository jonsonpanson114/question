"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// ─── 型 ────────────────────────────────────────────────────
interface Message { role: "ai" | "user"; text: string; }

interface Round {
  scenario: string;
  question: string;
}

interface Session {
  id: string;
  date: string;
  mode: string;
  rounds?: Round[];
  conversation?: Message[];
  completedAt: number;
}

const MODE_LABELS: Record<string, string> = {
  casual: "日常雑談",
  oneonone: "仕事の 1on1",
  introspect: "自己内省",
  book: "読書振り返り",
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

  if (diffDays === 0) return "今日";
  if (diffDays === 1) return "昨日";
  if (diffDays < 7) return diffDays + "日前";
  if (diffDays < 30) return Math.floor(diffDays / 7) + "週間前";
  return Math.floor(diffDays / 30) + "ヶ月前";
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return hours.toString().padStart(2, "0") + ":" + minutes.toString().padStart(2, "0");
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem("dojo_sessions");
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          setSessions(arr);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const sortedSessions = [...sessions].sort((a, b) => b.completedAt - a.completedAt);

  return (
    <div style={{ backgroundColor: "var(--dojo-paper)", minHeight: "100vh" }}>
      <div style={{ maxWidth: "560px", margin: "0 auto", padding: "2rem 1.25rem 3rem" }}>
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--dojo-border)",
          paddingBottom: "1rem",
          marginBottom: "1.5rem",
        }}>
          <Link href="/practice" style={{
            fontSize: "0.75rem",
            color: "var(--dojo-muted)",
            textDecoration: "none",
            letterSpacing: "0.03em",
            opacity: 0.7,
          }}>
            ← 道場へ
          </Link>
          <h1 style={{
            fontSize: "1.1rem",
            color: "var(--dojo-ink)",
            letterSpacing: "0.1em",
            fontWeight: 300,
            margin: 0,
          }}>
            稽古の記録
          </h1>
          <div style={{ width: "60px" }} />
        </div>

        {/* Session List */}
        {sortedSessions.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "3rem 0",
            color: "var(--dojo-muted)",
            opacity: 0.6,
            animation: "dojo-fade-in 0.5s ease-out both",
          }}>
            <p style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}>
              まだ稽古の記録がありません
            </p>
            <p style={{ fontSize: "0.75rem", opacity: 0.8 }}>
              道場で練習を始めましょう
            </p>
            <Link href="/practice" style={{
              display: "inline-block",
              padding: "0.6rem 1.5rem",
              backgroundColor: "var(--dojo-indigo)",
              color: "#E8EEF5",
              borderRadius: "6px",
              fontSize: "0.85rem",
              letterSpacing: "0.06em",
              textDecoration: "none",
              fontFamily: "Noto Sans JP, sans-serif",
              marginTop: "1rem",
            }}>
              道場へ
            </Link>
          </div>
        ) : (
          <div style={{ animation: "dojo-fade-in 0.5s ease-out both" }}>
            {sortedSessions.map((session, i) => (
              <div key={session.id} style={{
                border: "1px solid var(--dojo-border)",
                borderRadius: "8px",
                padding: "1.1rem 1.3rem",
                marginBottom: "1rem",
                backgroundColor: "var(--dojo-surface)",
                animation: "dojo-fade-in 0.4s " + (i * 0.05) + "s ease-out both",
              }}>
                {/* Session Header */}
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "0.75rem",
                }}>
                  <div>
                    <p style={{
                      fontSize: "0.58rem",
                      color: "var(--dojo-muted)",
                      letterSpacing: "0.1em",
                      opacity: 0.7,
                      marginBottom: "3px",
                    }}>
                      {formatDate(session.date)}
                    </p>
                    <p style={{
                      fontSize: "0.72rem",
                      color: "var(--dojo-indigo)",
                      letterSpacing: "0.04em",
                      opacity: 0.85,
                    }}>
                      {MODE_LABELS[session.mode] || session.mode}
                    </p>
                  </div>
                  <p style={{
                    fontSize: "0.65rem",
                    color: "var(--dojo-muted)",
                    opacity: 0.55,
                  }}>
                    {formatTime(session.completedAt)}
                  </p>
                </div>

                {/* Content Preview */}
                {session.rounds && session.rounds.length > 0 && (
                  <div style={{
                    borderLeft: "2px solid var(--dojo-border)",
                    paddingLeft: "0.9rem",
                  }}>
                    {session.rounds.slice(0, 2).map((r, ri) => (
                      <div key={ri} style={{ marginBottom: "0.5rem" }}>
                        <p style={{
                          fontSize: "0.58rem",
                          color: "var(--dojo-muted)",
                          letterSpacing: "0.08em",
                          marginBottom: "2px",
                        }}>
                          問 {ri + 1}
                        </p>
                        <p style={{
                          fontSize: "0.78rem",
                          color: "var(--dojo-ink)",
                          opacity: 0.75,
                          lineHeight: "1.6",
                        }}>
                          {r.question}
                        </p>
                      </div>
                    ))}
                    {session.rounds.length > 2 && (
                      <p style={{
                        fontSize: "0.58rem",
                        color: "var(--dojo-muted)",
                        opacity: 0.6,
                      }}>
                        他{session.rounds.length - 2}問
                      </p>
                    )}
                  </div>
                )}

                {/* Rally Mode Preview */}
                {session.conversation && session.conversation.length > 0 && (
                  <div style={{
                    borderLeft: "2px solid var(--dojo-border)",
                    paddingLeft: "0.9rem",
                  }}>
                    {session.conversation.slice(0, 3).map((m, mi) => (
                      <div key={mi} style={{ marginBottom: "0.5rem" }}>
                        <p style={{
                          fontSize: "0.58rem",
                          color: "var(--dojo-muted)",
                          letterSpacing: "0.08em",
                          marginBottom: "2px",
                        }}>
                          {m.role === "ai" ? "相手" : "あなた"}
                        </p>
                        <p style={{
                          fontSize: "0.78rem",
                          color: "var(--dojo-ink)",
                          opacity: 0.75,
                          lineHeight: "1.6",
                        }}>
                          {m.text}
                        </p>
                      </div>
                    ))}
                    {session.conversation.length > 3 && (
                      <p style={{
                        fontSize: "0.58rem",
                        color: "var(--dojo-muted)",
                        opacity: 0.6,
                      }}>
                        他{session.conversation.length - 3}往復
                      </p>
                    )}
                  </div>
                )}

                {/* Detail Link */}
                <div style={{
                  marginTop: "0.75rem",
                  paddingTop: "0.6rem",
                  borderTop: "1px solid var(--dojo-border)",
                }}>
                  <Link
                    href={"/practice/" + session.mode}
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--dojo-indigo)",
                      textDecoration: "none",
                      letterSpacing: "0.04em",
                      opacity: 0.85,
                      fontFamily: "Noto Sans JP, sans-serif",
                    }}
                  >
                    このセッションを再見る
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{
          borderTop: "1px solid var(--dojo-border)",
          paddingTop: "1.1rem",
          marginTop: "2rem",
          textAlign: "center",
        }}>
          <p style={{
            fontSize: "0.62rem",
            color: "var(--dojo-muted)",
            opacity: 0.4,
            letterSpacing: "0.08em",
          }}>
            問いが積み重なると、自分の言葉が変わる
          </p>
        </div>
      </div>
    </div>
  );
}
