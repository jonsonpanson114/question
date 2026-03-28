"use client";

import { useState, useEffect, use, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FeedbackData } from "@/app/api/dojo-feedback/route";
import NotificationSettings from "../components/NotificationSettings";

// ─── 定数 ──────────────────────────────────────────────────
const ROUNDS_PER_SESSION = 3;
const MIN_EXCHANGES      = 3;
const MAX_EXCHANGES      = 5;
const RALLY_MODES        = new Set(["casual", "oneonone"]);

const MODE_META: Record<string, { label: string; guide: string }> = {
  casual:     { label: "日常雑談",     guide: "相手の言葉に耳を傾け、もっと聴きたいという問いを。" },
  oneonone:   { label: "仕事の 1on1",  guide: "相手の考えや感情を引き出す、開いた問いを。" },
  introspect: { label: "自己内省",     guide: "自分の内側を深掘りする問いを考えてみましょう。" },
  book:       { label: "読書振り返り", guide: "本の言葉をさらに自分のものにする問いを。" },
};

function scoreStyle(score: number): { color: string; bg: string; border: string; accent: string } {
  if (score >= 8) return { color: "#7A3A20", bg: "#F5E8D8", border: "#C07040", accent: "var(--dojo-vermilion)" };
  if (score >= 5) return { color: "#1E3A5C", bg: "#DDE8F0", border: "#5A8CB8", accent: "var(--dojo-indigo)" };
  return             { color: "#3A3A1E", bg: "#EDEDDC", border: "#8A8A50", accent: "var(--dojo-border)" };
}

// ─── 型 ────────────────────────────────────────────────────
interface Message { role: "ai" | "user"; text: string; }

interface Round {
  scenario:  string;
  question:  string;
  feedback:  FeedbackData;
}

interface DojoSession {
  id:           string;
  date:         string;
  mode:         string;
  rounds?:      Round[];
  conversation?: Message[];
  completedAt:  number;
}

// ─── ストレージ ────────────────────────────────────────────
function calcTreeLevel(total: number): number {
  if (total === 0) return 0;
  if (total < 4)  return 1;
  if (total < 7)  return 2;
  if (total < 10) return 3;
  if (total < 15) return 4;
  return 5;
}

function completeSession(
  mode: string,
  rounds: Round[],
  conversation?: Message[],
): { streak: number; treeLevel: number } {
  const today     = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  const sessions: DojoSession[] = JSON.parse(localStorage.getItem("dojo_sessions") ?? "[]");
  const alreadyToday = sessions.some((s) => s.date === today);

  const entry: DojoSession = {
    id: Date.now().toString(),
    date: today,
    mode,
    completedAt: Date.now(),
    ...(conversation ? { conversation } : { rounds }),
  };
  sessions.push(entry);
  localStorage.setItem("dojo_sessions", JSON.stringify(sessions));

  let streak = parseInt(localStorage.getItem("dojo_streak") ?? "0", 10);
  if (!alreadyToday) {
    const prevDates = sessions.slice(0, -1).map((s) => s.date);
    const lastDate  = prevDates.length > 0 ? prevDates[prevDates.length - 1] : null;
    streak = lastDate === yesterday ? streak + 1 : 1;
    localStorage.setItem("dojo_streak", streak.toString());
  }

  const treeLevel = calcTreeLevel(sessions.length);
  localStorage.setItem("dojo_tree_level", treeLevel.toString());

  return { streak, treeLevel };
}

// ─── ラウンド進捗ドット ────────────────────────────────────
function RoundDots({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} style={{
          display: "inline-block",
          width:  i < current ? "22px" : "8px",
          height: "8px",
          borderRadius: "4px",
          backgroundColor: i < current
            ? "var(--dojo-vermilion)"
            : i === current
            ? "var(--dojo-indigo)"
            : "var(--dojo-border)",
          opacity: i < current ? 0.7 : 1,
          transition: "all 0.3s ease",
        }} />
      ))}
    </div>
  );
}

// ─── 会話スレッド ──────────────────────────────────────────
function ConversationThread({
  messages,
  mode,
  endRef,
}: {
  messages: Message[];
  mode: string;
  endRef: React.RefObject<HTMLDivElement | null>;
}) {
  const partnerLabel = mode === "oneonone" ? "同僚・部下" : "友人";
  return (
    <div style={{ marginBottom: "1rem" }}>
      {messages.map((m, i) => (
        <div
          key={i}
          style={{
            marginBottom: "0.75rem",
            display: "flex",
            flexDirection: "column",
            alignItems: m.role === "ai" ? "flex-start" : "flex-end",
            animation: "dojo-fade-in 0.3s ease-out both",
          }}
        >
          {m.role === "ai" && (
            <p style={{
              fontSize: "0.55rem",
              color: "var(--dojo-indigo)",
              letterSpacing: "0.1em",
              opacity: 0.65,
              marginBottom: "3px",
            }}>
              {partnerLabel}
            </p>
          )}
          <div style={{
            maxWidth: "85%",
            padding: "0.7rem 0.9rem",
            borderRadius: m.role === "ai" ? "2px 8px 8px 8px" : "8px 2px 8px 8px",
            backgroundColor: m.role === "ai" ? "var(--dojo-surface)" : "#EAF0F8",
            border: `1px solid ${m.role === "ai" ? "var(--dojo-border)" : "#B8CCE0"}`,
          }}>
            <p
              className="serif"
              style={{
                fontSize: "0.88rem",
                lineHeight: "1.85",
                color: "var(--dojo-ink)",
                opacity: 0.82,
                whiteSpace: "pre-wrap",
              }}
            >
              {m.text}
            </p>
          </div>
          {m.role === "user" && (
            <p style={{
              fontSize: "0.55rem",
              color: "var(--dojo-muted)",
              letterSpacing: "0.06em",
              opacity: 0.55,
              marginTop: "3px",
            }}>
              あなたの問い
            </p>
          )}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}

// ─── フィードバックカード ──────────────────────────────────
function FeedbackCard({ data }: { data: FeedbackData }) {
  const style = scoreStyle(data.score);
  return (
    <div style={{
      border: `1px solid ${style.border}`,
      borderRadius: "8px",
      overflow: "hidden",
      marginBottom: "1.25rem",
      animation: "dojo-fade-in 0.4s ease-out both",
    }}>
      {/* Score header */}
      <div style={{
        backgroundColor: style.bg,
        borderBottom: `1px solid ${style.border}`,
        padding: "0.75rem 1.2rem",
        display: "flex",
        alignItems: "baseline",
        gap: "0.4rem",
      }}>
        <span style={{ fontSize: "2rem", fontWeight: 300, color: style.color, lineHeight: 1, fontFamily: "Georgia, serif" }}>
          {data.score}
        </span>
        <span style={{ fontSize: "0.72rem", color: style.color, opacity: 0.6, letterSpacing: "0.04em" }}>
          / 10
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: "1rem 1.2rem", backgroundColor: "var(--dojo-paper)" }}>
        <div style={{ marginBottom: data.improve ? "0.85rem" : 0 }}>
          <p style={{ fontSize: "0.6rem", color: "var(--dojo-muted)", letterSpacing: "0.1em", marginBottom: "0.35rem" }}>
            良かった点
          </p>
          <p style={{ fontSize: "0.82rem", lineHeight: "1.75", color: "var(--dojo-ink)", opacity: 0.82 }}>
            {data.good}
          </p>
        </div>
        {data.improve && (
          <div style={{ marginBottom: "0.85rem" }}>
            <p style={{ fontSize: "0.6rem", color: "var(--dojo-muted)", letterSpacing: "0.1em", marginBottom: "0.35rem" }}>
              より深めるには
            </p>
            <p style={{ fontSize: "0.82rem", lineHeight: "1.75", color: "var(--dojo-ink)", opacity: 0.75 }}>
              {data.improve}
            </p>
          </div>
        )}
        <div style={{
          backgroundColor: "var(--dojo-surface)",
          border: "1px solid var(--dojo-border)",
          borderRadius: "6px",
          padding: "0.7rem 0.9rem",
        }}>
          <p style={{ fontSize: "0.58rem", color: "var(--dojo-muted)", letterSpacing: "0.1em", marginBottom: "0.3rem" }}>
            別の問いの例
          </p>
          <p className="serif" style={{ fontSize: "0.84rem", lineHeight: "1.75", color: "var(--dojo-indigo)", opacity: 0.9 }}>
            {data.alternative}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── シナリオカード（単問モード） ────────────────────────────
function ScenarioCard({ text, mode }: { text: string; mode: string }) {
  const label = mode === "introspect" ? "内なる声" : "相手の言葉";
  return (
    <div style={{
      backgroundColor: "var(--dojo-surface)",
      border: "1px solid var(--dojo-border)",
      borderTop: "3px solid var(--dojo-indigo)",
      borderRadius: "8px",
      padding: "1.25rem 1.4rem",
      marginBottom: "1.25rem",
      animation: "dojo-fade-in 0.4s ease-out both",
    }}>
      <p style={{ fontSize: "0.58rem", color: "var(--dojo-indigo)", letterSpacing: "0.14em", opacity: 0.75, marginBottom: "0.7rem" }}>
        {label}
      </p>
      <p className="serif" style={{ fontSize: "0.92rem", lineHeight: "1.95", color: "var(--dojo-ink)", opacity: 0.85, whiteSpace: "pre-wrap" }}>
        {text}
      </p>
    </div>
  );
}

// ─── 完了画面（単問モード） ─────────────────────────────────
function CompletionScreen({
  rounds, streak, treeLevel, prevTreeLevel,
}: {
  rounds: Round[]; streak: number; treeLevel: number; prevTreeLevel: number;
}) {
  const leveledUp = treeLevel > prevTreeLevel;
  return (
    <div style={{ animation: "dojo-fade-in 0.5s ease-out both", textAlign: "center" }}>
      <div style={{
        border: "1px solid var(--dojo-border)",
        borderTop: "3px solid var(--dojo-vermilion)",
        borderRadius: "10px",
        padding: "1.75rem 1.5rem",
        backgroundColor: "var(--dojo-surface)",
        marginBottom: "1.5rem",
      }}>
        <p className="serif" style={{ fontSize: "1.05rem", letterSpacing: "0.1em", color: "var(--dojo-ink)", opacity: 0.82, marginBottom: "0.4rem" }}>
          今日の稽古、お疲れさまでした
        </p>
        <p style={{ fontSize: "0.72rem", color: "var(--dojo-muted)", letterSpacing: "0.04em" }}>
          {ROUNDS_PER_SESSION} 問に向き合いました
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginTop: "1.25rem", padding: "1rem 0", borderTop: "1px solid var(--dojo-border)" }}>
          <div>
            <p style={{ fontSize: "1.6rem", color: "var(--dojo-vermilion)", lineHeight: 1, fontWeight: 300 }}>{streak}</p>
            <p style={{ fontSize: "0.58rem", color: "var(--dojo-muted)", letterSpacing: "0.06em", marginTop: "4px" }}>日連続</p>
          </div>
          <div style={{ width: "1px", backgroundColor: "var(--dojo-border)" }} />
          <div>
            <p style={{ fontSize: "1.6rem", color: leveledUp ? "var(--dojo-vermilion)" : "var(--dojo-indigo)", lineHeight: 1, fontWeight: 300 }}>Lv.{treeLevel}</p>
            <p style={{ fontSize: "0.58rem", color: "var(--dojo-muted)", letterSpacing: "0.06em", marginTop: "4px" }}>{leveledUp ? "木が成長した" : "成長の木"}</p>
          </div>
        </div>
      </div>
      <div style={{ textAlign: "left", marginBottom: "1.5rem" }}>
        <p style={{ fontSize: "0.6rem", color: "var(--dojo-muted)", letterSpacing: "0.12em", marginBottom: "0.75rem", textAlign: "center" }}>
          今日の問い
        </p>
        {rounds.map((r, i) => {
          const s = scoreStyle(r.feedback.score);
          return (
            <div key={i} style={{
              borderLeft: `2px solid ${s.accent}`,
              paddingLeft: "0.85rem",
              marginBottom: "0.85rem",
            }}>
              <p style={{ fontSize: "0.58rem", color: "var(--dojo-muted)", letterSpacing: "0.08em", marginBottom: "3px" }}>
                問 {i + 1}
                <span style={{ color: s.color }}>{r.feedback.score}/10</span>
              </p>
              <p className="serif" style={{ fontSize: "0.82rem", color: "var(--dojo-ink)", opacity: 0.78, lineHeight: "1.65" }}>{r.question}</p>
            </div>
          );
        })}
      </div>
      <Link href="/practice" style={{ display: "inline-block", padding: "0.75rem 2.5rem", backgroundColor: "var(--dojo-indigo)", color: "#E8EEF5", borderRadius: "6px", fontSize: "0.85rem", letterSpacing: "0.06em", textDecoration: "none", fontFamily: "Noto Sans JP, sans-serif" }}>
        道場へ戻る
      </Link>
    </div>
  );
}

// ─── 完了画面（ラリーモード） ─────────────────────────────
function RallyCompletionScreen({
  conversation, feedback, streak, treeLevel, prevTreeLevel,
}: {
  conversation: Message[]; feedback: FeedbackData; streak: number; treeLevel: number; prevTreeLevel: number;
}) {
  const leveledUp    = treeLevel > prevTreeLevel;
  const userMessages = conversation.filter((m) => m.role === "user");
  return (
    <div style={{ animation: "dojo-fade-in 0.5s ease-out both" }}>
      <div style={{
        border: "1px solid var(--dojo-border)",
        borderTop: "3px solid var(--dojo-vermilion)",
        borderRadius: "10px",
        padding: "1.5rem",
        backgroundColor: "var(--dojo-surface)",
        marginBottom: "1.25rem",
        textAlign: "center",
      }}>
        <p className="serif" style={{ fontSize: "1.05rem", letterSpacing: "0.1em", color: "var(--dojo-ink)", opacity: 0.82, marginBottom: "0.3rem" }}>
          今日の稽古、お疲れさまでした
        </p>
        <p style={{ fontSize: "0.72rem", color: "var(--dojo-muted)" }}>
          {userMessages.length} 往復こなしました
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--dojo-border)" }}>
          <div>
            <p style={{ fontSize: "1.6rem", color: "var(--dojo-vermilion)", lineHeight: 1, fontWeight: 300 }}>{streak}</p>
            <p style={{ fontSize: "0.58rem", color: "var(--dojo-muted)", marginTop: "4px" }}>日連続</p>
          </div>
          <div style={{ width: "1px", backgroundColor: "var(--dojo-border)" }} />
          <div>
            <p style={{ fontSize: "1.6rem", color: leveledUp ? "var(--dojo-vermilion)" : "var(--dojo-indigo)", lineHeight: 1, fontWeight: 300 }}>Lv.{treeLevel}</p>
            <p style={{ fontSize: "0.58rem", color: "var(--dojo-muted)", marginTop: "4px" }}>{leveledUp ? "木が成長した" : "成長の木"}</p>
          </div>
        </div>
      </div>

      <FeedbackCard data={feedback} />

      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ fontSize: "0.6rem", color: "var(--dojo-muted)", letterSpacing: "0.12em", marginBottom: "0.75rem", textAlign: "center" }}>
          今日の問い
        </p>
        {userMessages.map((m, i) => (
          <div key={i} style={{ borderLeft: "2px solid var(--dojo-border)", paddingLeft: "0.85rem", marginBottom: "0.75rem" }}>
            <p style={{ fontSize: "0.58rem", color: "var(--dojo-muted)", marginBottom: "3px" }}>問 {i + 1}</p>
            <p className="serif" style={{ fontSize: "0.82rem", color: "var(--dojo-ink)", opacity: 0.78, lineHeight: "1.65" }}>{m.text}</p>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center" }}>
        <Link href="/practice" style={{ display: "inline-block", padding: "0.75rem 2.5rem", backgroundColor: "var(--dojo-indigo)", color: "#E8EEF5", borderRadius: "6px", fontSize: "0.85rem", letterSpacing: "0.06em", textDecoration: "none", fontFamily: "Noto Sans JP, sans-serif" }}>
          道場へ戻る
        </Link>
      </div>
    </div>
  );
}

// ─── メインページ ──────────────────────────────────────────
type Phase =
  | "loading-scenario"
  | "answering"
  | "loading-reply"
  | "evaluating"
  | "feedback"
  | "complete";

export default function SessionPage({
  params,
}: {
  params: Promise<{ mode: string }>;
}) {
  const { mode } = use(params);
  const router   = useRouter();
  const meta     = MODE_META[mode];
  const isRally  = RALLY_MODES.has(mode);

  // ─── 共通状態 ───
  const [phase, setPhase]             = useState<Phase>("loading-scenario");
  const [question, setQuestion]       = useState("");
  const [feedback, setFeedback]       = useState<FeedbackData | null>(null);
  const [error, setError]             = useState("");
  const [streak, setStreak]           = useState(0);
  const [treeLevel, setTreeLevel]     = useState(0);
  const [prevTreeLevel, setPrevTreeLevel] = useState(0);

  // ─── 単問モード状態 ───
  const [scenario, setScenario]         = useState("");
  const [rounds, setRounds]             = useState<Round[]>([]);
  const [currentRound, setCurrentRound] = useState(0);

  // ─── ラリーモード状態 ───
  const [conversation, setConversation]   = useState<Message[]>([]);
  const [exchangeCount, setExchangeCount] = useState(0);

  const [mounted, setMounted]         = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const convEndRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ─── エントリ読み込み（気づき＋読書） ───
  function loadEntries(mode: string): { entries: string[]; bookTitle?: string; bookAuthor?: string } {
    const entries: string[] = [];
    let bookTitle: string | undefined;
    let bookAuthor: string | undefined;

    // kizuki_log から気づきを読み込み
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

    // bookモードの場合、jinnai_books から読書のinsightsも読み込み
    if (mode === "book") {
      try {
        const booksRaw = localStorage.getItem("jinnai_books");
        if (booksRaw) {
          const books = JSON.parse(booksRaw);
          if (Array.isArray(books) && books.length > 0) {
            // 最新の読んでいる本を取得
            const latestBook = books.find((b: Record<string, unknown>) =>
              b.status === "reading" || b.status === "tsundoku"
            ) ?? books[0];
            if (latestBook) {
              bookTitle = latestBook.title as string;
              bookAuthor = latestBook.author as string;
              const insights = latestBook.insights as { text: string }[] | undefined;
              if (Array.isArray(insights)) {
                insights.slice(-2).forEach((i: { text: string }) => {
                  if (typeof i?.text === "string") entries.push(i.text);
                });
              }
            }
          }
        }
      } catch { /* ignore */ }
    }

    return { entries, bookTitle, bookAuthor };
  }

  // 会話更新時にスクロール
  useEffect(() => {
    convEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [conversation]);

  useEffect(() => {
    if (!meta) { router.replace("/practice"); return; }
    setPrevTreeLevel(parseInt(localStorage.getItem("dojo_tree_level") ?? "0", 10));
    if (isRally) {
      loadOpening();
    } else {
      loadScenario();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── 単問モード関数 ───
  async function loadScenario() {
    setPhase("loading-scenario");
    setQuestion("");
    setFeedback(null);
    setError("");
    try {
      const { entries, bookTitle, bookAuthor } = loadEntries(mode);
      const res = await fetch("/api/dojo-scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, entries, bookTitle, bookAuthor }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setScenario(data.scenario);
      setPhase("answering");
      setTimeout(() => textareaRef.current?.focus(), 100);
    } catch {
      setError("一言の生成に失敗しました。");
      setPhase("answering");
    }
  }

  async function handleSingleSubmit() {
    if (!question.trim() || phase !== "answering") return;
    setPhase("evaluating");
    setError("");
    try {
      const res = await fetch("/api/dojo-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, scenario, question: question.trim() }),
      });
      if (!res.ok) throw new Error();
      const data: FeedbackData = await res.json();
      setFeedback(data);
      setPhase("feedback");
    } catch {
      setError("評価の取得に失敗しました。もう一度お試しください。");
      setPhase("answering");
    }
  }

  function handleSingleNext() {
    const newRounds = [...rounds, { scenario, question: question.trim(), feedback: feedback! }];
    setRounds(newRounds);
    const nextRound = currentRound + 1;
    if (nextRound >= ROUNDS_PER_SESSION) {
      const result = completeSession(mode, newRounds);
      setStreak(result.streak);
      setTreeLevel(result.treeLevel);
      setPhase("complete");
    } else {
      setCurrentRound(nextRound);
      loadScenario();
    }
  }

  // ─── ラリーモード関数 ───
  async function loadOpening() {
    setPhase("loading-scenario");
    setQuestion("");
    setFeedback(null);
    setError("");
    setConversation([]);
    setExchangeCount(0);
    try {
      const { entries, bookTitle, bookAuthor } = loadEntries(mode);
      const res = await fetch("/api/dojo-scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, entries, bookTitle, bookAuthor }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setConversation([{ role: "ai", text: data.scenario }]);
      setPhase("answering");
      setTimeout(() => textareaRef.current?.focus(), 100);
    } catch {
      setError("会話の開始に失敗しました。");
      setPhase("answering");
    }
  }

  async function submitRallyQuestion() {
    if (!question.trim() || phase !== "answering") return;
    const q = question.trim();
    setQuestion("");
    const newConv: Message[] = [...conversation, { role: "user", text: q }];
    setConversation(newConv);
    const newCount = exchangeCount + 1;
    setExchangeCount(newCount);

    if (newCount >= MAX_EXCHANGES) {
      await evaluateRally(newConv);
      return;
    }

    setPhase("loading-reply");
    setError("");
    try {
      const res = await fetch("/api/dojo-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, conversation: newConv }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setConversation([...newConv, { role: "ai", text: data.reply }]);
      setPhase("answering");
      setTimeout(() => textareaRef.current?.focus(), 100);
    } catch {
      setError("返答の生成に失敗しました。");
      setPhase("answering");
    }
  }

  async function evaluateRally(conv: Message[]) {
    setPhase("evaluating");
    setError("");
    try {
      const res = await fetch("/api/dojo-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, conversation: conv }),
      });
      if (!res.ok) throw new Error();
      const data: FeedbackData = await res.json();
      setFeedback(data);
      setPhase("feedback");
    } catch {
      setError("評価の取得に失敗しました。もう一度お試しください。");
      setPhase("answering");
    }
  }

  function handleRallyComplete() {
    const result = completeSession(mode, [], conversation);
    setStreak(result.streak);
    setTreeLevel(result.treeLevel);
    setPhase("complete");
  }

  if (!meta || !mounted) return null;

  const canSubmit   = !!question.trim() && phase === "answering";
  const canEndRally = isRally && exchangeCount >= MIN_EXCHANGES && phase === "answering";

  // ─── ローディングドット（共通） ───
  const LoadingDots = ({ small = false }: { small?: boolean }) => (
    <>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{
          display: "inline-block",
          width:  small ? "5px" : "6px",
          height: small ? "5px" : "6px",
          borderRadius: "50%",
          backgroundColor: "var(--dojo-border)",
          animation: `dot-pulse 1.2s ${i * 0.2}s ease-in-out infinite`,
        }} />
      ))}
    </>
  );

  return (
    <div style={{ backgroundColor: "var(--dojo-paper)", minHeight: "100vh" }}>
      <div style={{ maxWidth: "560px", margin: "0 auto", padding: "2rem 1.25rem 3rem" }}>

        {/* ─── ヘッダー ─── */}
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
          <div style={{ textAlign: "center" }}>
            <p className="serif" style={{
              fontSize: "0.95rem",
              color: "var(--dojo-ink)",
              letterSpacing: "0.1em",
              fontWeight: 300,
              opacity: 0.82,
            }}>
              {meta.label}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button
              onClick={() => setShowNotificationSettings(true)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0.25rem",
                opacity: 0.6,
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "0.6"}
              aria-label="通知設定"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ color: "var(--dojo-ink)" }}
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
            {phase !== "complete" && (
              isRally
                ? <RoundDots current={exchangeCount} total={MAX_EXCHANGES} />
                : <RoundDots current={currentRound} total={ROUNDS_PER_SESSION} />
            )}
            {phase === "complete" && <div style={{ width: "20px" }} />}
          </div>
        </div>

        {/* ─── 完了画面 ─── */}
        {phase === "complete" && (
          isRally
            ? <RallyCompletionScreen
                conversation={conversation}
                feedback={feedback!}
                streak={streak}
                treeLevel={treeLevel}
                prevTreeLevel={prevTreeLevel}
              />
            : <CompletionScreen
                rounds={rounds}
                streak={streak}
                treeLevel={treeLevel}
                prevTreeLevel={prevTreeLevel}
              />
        )}

        {/* ─── 稽古画面 ─── */}
        {phase !== "complete" && (
          <>
            <p style={{
              fontSize: "0.68rem",
              color: "var(--dojo-muted)",
              letterSpacing: "0.04em",
              opacity: 0.7,
              marginBottom: "1rem",
              lineHeight: "1.7",
            }}>
              {meta.guide}
            </p>

            {/* ══ ラリーモード ══ */}
            {isRally && (
              <>
                {/* Loading opening */}
                {phase === "loading-scenario" && (
                  <div style={{
                    height: "100px",
                    backgroundColor: "var(--dojo-surface)",
                    border: "1px solid var(--dojo-border)",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    marginBottom: "1rem",
                  }}>
                    <LoadingDots />
                  </div>
                )}

                {/* Conversation thread */}
                {conversation.length > 0 && (
                  <ConversationThread
                    messages={conversation}
                    mode={mode}
                    endRef={convEndRef}
                  />
                )}

                {/* AI thinking indicator */}
                {phase === "loading-reply" && (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "0.55rem 0.8rem",
                    backgroundColor: "var(--dojo-surface)",
                    border: "1px solid var(--dojo-border)",
                    borderRadius: "2px 8px 8px 8px",
                    width: "fit-content",
                    marginBottom: "1rem",
                    animation: "dojo-fade-in 0.3s ease-out both",
                  }}>
                    <LoadingDots small />
                  </div>
                )}

                {/* Evaluating */}
                {phase === "evaluating" && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "1rem 0", color: "var(--dojo-muted)", fontSize: "0.78rem" }}>
                    <LoadingDots />
                    <span style={{ marginLeft: "4px", letterSpacing: "0.06em" }}>評価中</span>
                  </div>
                )}

                {/* Feedback card */}
                {phase === "feedback" && feedback && (
                  <FeedbackCard data={feedback} />
                )}

                {/* Input area (answering phase only) */}
                {phase === "answering" && conversation.length > 0 && (
                  <div style={{ animation: "dojo-fade-in 0.3s ease-out both" }}>
                    <p style={{ fontSize: "0.6rem", color: "var(--dojo-muted)", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
                      あなたの問い
                    </p>
                    <textarea
                      ref={textareaRef}
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitRallyQuestion();
                      }}
                      placeholder="どんな問いを返しますか？"
                      rows={3}
                      style={{
                        width: "100%",
                        padding: "0.85rem 1rem",
                        border: "1px solid var(--dojo-border)",
                        borderRadius: "8px",
                        backgroundColor: "var(--dojo-paper)",
                        color: "var(--dojo-ink)",
                        fontSize: "0.88rem",
                        lineHeight: "1.8",
                        fontFamily: "Noto Serif JP, Georgia, serif",
                        outline: "none",
                        marginBottom: "0.75rem",
                        transition: "border-color 0.18s",
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "var(--dojo-indigo)"; }}
                      onBlur={(e)  => { e.currentTarget.style.borderColor = "var(--dojo-border)"; }}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      {canEndRally ? (
                        <button
                          onClick={() => evaluateRally(conversation)}
                          style={{
                            background: "none",
                            border: "none",
                            fontSize: "0.72rem",
                            color: "var(--dojo-muted)",
                            cursor: "pointer",
                            fontFamily: "inherit",
                            opacity: 0.65,
                            letterSpacing: "0.04em",
                          }}
                        >
                          ラリーを終える
                        </button>
                      ) : (
                        <span style={{ fontSize: "0.68rem", color: "var(--dojo-muted)", opacity: 0.4, letterSpacing: "0.04em" }}>
                          あと {MIN_EXCHANGES - exchangeCount} 往復で終了可
                        </span>
                      )}
                      <button
                        onClick={submitRallyQuestion}
                        disabled={!canSubmit}
                        style={{
                          padding: "0.6rem 1.6rem",
                          backgroundColor: canSubmit ? "var(--dojo-indigo)" : "var(--dojo-border)",
                          color: canSubmit ? "#E8EEF5" : "var(--dojo-muted)",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "0.82rem",
                          cursor: canSubmit ? "pointer" : "default",
                          fontFamily: "inherit",
                          letterSpacing: "0.06em",
                          transition: "all 0.18s",
                        }}
                      >
                        問いを投げる
                      </button>
                    </div>
                  </div>
                )}

                {/* After feedback: end button */}
                {phase === "feedback" && (
                  <div style={{ display: "flex", justifyContent: "flex-end", animation: "dojo-fade-in 0.3s 0.1s ease-out both" }}>
                    <button
                      onClick={handleRallyComplete}
                      style={{
                        padding: "0.65rem 1.75rem",
                        backgroundColor: "var(--dojo-vermilion)",
                        color: "#F5EEE8",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "0.82rem",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        letterSpacing: "0.06em",
                      }}
                    >
                      稽古を終える
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ══ 単問モード ══ */}
            {!isRally && (
              <>
                {/* Loading scenario */}
                {phase === "loading-scenario" ? (
                  <div style={{
                    height: "120px",
                    backgroundColor: "var(--dojo-surface)",
                    border: "1px solid var(--dojo-border)",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    marginBottom: "1.25rem",
                  }}>
                    <LoadingDots />
                  </div>
                ) : (
                  scenario && <ScenarioCard text={scenario} mode={mode} />
                )}

                {/* Feedback card */}
                {phase === "feedback" && feedback && (
                  <FeedbackCard data={feedback} />
                )}

                {/* Input area */}
                {(phase === "answering" || phase === "evaluating") && (
                  <div style={{ animation: "dojo-fade-in 0.3s ease-out both" }}>
                    <p style={{ fontSize: "0.6rem", color: "var(--dojo-muted)", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
                      あなたの問い
                    </p>
                    <textarea
                      ref={textareaRef}
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSingleSubmit();
                      }}
                      placeholder="どんな問いを返しますか？"
                      rows={3}
                      disabled={phase === "evaluating"}
                      style={{
                        width: "100%",
                        padding: "0.85rem 1rem",
                        border: "1px solid var(--dojo-border)",
                        borderRadius: "8px",
                        backgroundColor: phase === "evaluating" ? "var(--dojo-surface)" : "var(--dojo-paper)",
                        color: "var(--dojo-ink)",
                        fontSize: "0.88rem",
                        lineHeight: "1.8",
                        fontFamily: "Noto Serif JP, Georgia, serif",
                        outline: "none",
                        marginBottom: "0.75rem",
                        opacity: phase === "evaluating" ? 0.6 : 1,
                        transition: "border-color 0.18s, opacity 0.18s",
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "var(--dojo-indigo)"; }}
                      onBlur={(e)  => { e.currentTarget.style.borderColor = "var(--dojo-border)"; }}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <button
                        onClick={loadScenario}
                        disabled={phase === "evaluating"}
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: "0.72rem",
                          color: "var(--dojo-muted)",
                          cursor: "pointer",
                          fontFamily: "inherit",
                          opacity: 0.6,
                          letterSpacing: "0.04em",
                        }}
                      >
                        別の一言へ
                      </button>
                      <button
                        onClick={handleSingleSubmit}
                        disabled={!question.trim() || phase === "evaluating"}
                        style={{
                          padding: "0.6rem 1.6rem",
                          backgroundColor: question.trim() && phase === "answering" ? "var(--dojo-indigo)" : "var(--dojo-border)",
                          color: question.trim() && phase === "answering" ? "#E8EEF5" : "var(--dojo-muted)",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "0.82rem",
                          cursor: question.trim() && phase === "answering" ? "pointer" : "default",
                          fontFamily: "inherit",
                          letterSpacing: "0.06em",
                          transition: "all 0.18s",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        {phase === "evaluating" ? (
                          <>
                            <span style={{
                              display: "inline-block",
                              width: "10px", height: "10px",
                              border: "1.5px solid #8BAAD0",
                              borderTopColor: "transparent",
                              borderRadius: "50%",
                              animation: "spin 0.8s linear infinite",
                            }} />
                            評価中
                          </>
                        ) : "問いを投げる"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Next button (after feedback) */}
                {phase === "feedback" && (
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", animation: "dojo-fade-in 0.3s 0.1s ease-out both" }}>
                    <button
                      onClick={handleSingleNext}
                      style={{
                        padding: "0.65rem 1.75rem",
                        backgroundColor: currentRound + 1 >= ROUNDS_PER_SESSION ? "var(--dojo-vermilion)" : "var(--dojo-indigo)",
                        color: "#F5EEE8",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "0.82rem",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        letterSpacing: "0.06em",
                        transition: "opacity 0.18s",
                      }}
                    >
                      {currentRound + 1 >= ROUNDS_PER_SESSION ? "稽古を終える" : "次の一言へ"}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Error */}
            {error && (
              <div>
                <p style={{ fontSize: "0.75rem", color: "var(--dojo-vermilion)", opacity: 0.8, marginTop: "0.75rem", letterSpacing: "0.02em" }}>
                  {error}
                </p>
                {isRally && conversation.length === 0 && (
                  <button
                    onClick={loadOpening}
                    style={{
                      marginTop: "0.5rem",
                      background: "none",
                      border: "1px solid var(--dojo-border)",
                      borderRadius: "4px",
                      padding: "0.4rem 0.9rem",
                      fontSize: "0.72rem",
                      color: "var(--dojo-muted)",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      letterSpacing: "0.04em",
                    }}
                  >
                    再試行
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Notification Settings Modal */}
      <NotificationSettings
        isOpen={showNotificationSettings}
        onClose={() => setShowNotificationSettings(false)}
      />
    </div>
  );
}
