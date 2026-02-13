"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Session {
  session_id: string;
  app_name: string;
  last_time: string;
  first_query: string;
  msg_count: number;
}

interface Message {
  id: number;
  session_id: string;
  app_name: string;
  query_text: string;
  user_question: string;
  assistant_answer: string;
  store: string;
  region: string;
  created_at: string;
  response_time?: number;
}

interface ChatTurn {
  user: string;
  assistant: string;
}

function parseTurns(m: Message): ChatTurn[] {
  const parts = m.user_question?.split(/\n------\n/).map((s) => s.trim()).filter(Boolean);
  if (!parts || parts.length <= 1) {
    return [{ user: m.query_text || parts?.[0] || "", assistant: m.assistant_answer || "" }];
  }
  const turns: ChatTurn[] = [];
  for (let i = 0; i < parts.length; i += 2) {
    turns.push({
      user: parts[i] || "",
      assistant: parts[i + 1] || "",
    });
  }
  if (turns.length > 0) {
    turns[turns.length - 1].assistant = m.assistant_answer || turns[turns.length - 1].assistant;
  }
  return turns;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

/* ====== Icon Components ====== */
const IconSearch = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const IconSettings = () => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const IconChat = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
  </svg>
);
const IconEmpty = () => (
  <svg className="w-20 h-20" fill="none" viewBox="0 0 80 80">
    <defs>
      <linearGradient id="emptyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#c7d2fe"/>
        <stop offset="100%" stopColor="#e9d5ff"/>
      </linearGradient>
    </defs>
    <circle cx="40" cy="40" r="36" fill="url(#emptyGrad)" opacity="0.3"/>
    <path d="M28 35h.01M40 35h.01M52 35h.01" stroke="#6366f1" strokeWidth="3" strokeLinecap="round"/>
    <path d="M56 40c0 8.837-7.163 16-16 16s-16-7.163-16-16 7.163-16 16-16 16 7.163 16 16z" stroke="#6366f1" strokeWidth="1.5" fill="none" opacity="0.4"/>
    <path d="M24 48l-4 8 6-2 2 6" stroke="#a5b4fc" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
  </svg>
);
const IconFox = () => (
  <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none">
    <defs>
      <linearGradient id="foxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6366f1"/>
        <stop offset="100%" stopColor="#8b5cf6"/>
      </linearGradient>
    </defs>
    <path d="M6 4l6 8H6l2 8-5 6h26l-5-6 2-8h-6l6-8-7 4-4-5-4 5-7-4z" fill="url(#foxGrad)" opacity="0.9"/>
    <circle cx="12" cy="16" r="1.5" fill="white"/>
    <circle cx="20" cy="16" r="1.5" fill="white"/>
    <path d="M14 20q2 2 4 0" stroke="white" strokeWidth="1" fill="none" strokeLinecap="round"/>
  </svg>
);

/* ====== Loading Skeletons ====== */
function SessionSkeleton() {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="p-3.5 rounded-2xl" style={{ animationDelay: `${i * 0.1}s` }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="shimmer w-16 h-5 rounded-full"></div>
            <div className="shimmer w-10 h-4 rounded-full ml-auto"></div>
          </div>
          <div className="shimmer w-full h-4 rounded-lg mb-2"></div>
          <div className="shimmer w-1/3 h-3 rounded-lg"></div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);
  const [showDbModal, setShowDbModal] = useState(false);
  const [dbForm, setDbForm] = useState({ host: "", port: "3306", user: "", password: "", database: "" });
  const [dbSaving, setDbSaving] = useState(false);
  const [dbError, setDbError] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const limit = 20;

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sessions?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      setSessions(data.sessions);
      setTotal(data.total);
    } catch { /* ignore */ }
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const selectSession = async (id: string) => {
    setActiveId(id);
    setMsgLoading(true);
    const res = await fetch(`/api/session/${encodeURIComponent(id)}`);
    const data = await res.json();
    setMessages(data.messages);
    setMsgLoading(false);
  };

  const totalPages = Math.ceil(total / limit);

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput);
  };

  const openDbModal = async () => {
    setDbError("");
    const res = await fetch("/api/db-config");
    const data = await res.json();
    setDbForm({ host: data.host, port: String(data.port), user: data.user, password: "", database: data.database });
    setShowDbModal(true);
  };

  const saveDbConfig = async () => {
    setDbSaving(true);
    setDbError("");
    try {
      const res = await fetch("/api/db-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dbForm),
      });
      const data = await res.json();
      if (!data.ok) { setDbError(data.error); return; }
      setShowDbModal(false);
      setPage(1);
      setSearch("");
      setSearchInput("");
      setActiveId(null);
      fetchSessions();
    } catch { setDbError("请求失败"); }
    finally { setDbSaving(false); }
  };

  return (
    <div className="flex h-screen animated-bg overflow-hidden relative">
      {/* Floating background orbs */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>

      {/* ====== LEFT SIDEBAR ====== */}
      <div
        className={`${sidebarCollapsed ? "w-0 opacity-0" : "w-[400px] opacity-100"} flex-shrink-0 sidebar-panel flex flex-col transition-all duration-300 relative z-10 overflow-hidden`}
      >
        {/* Brand Header */}
        <div className="p-5 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200/50">
              <IconFox />
            </div>
            <div className="flex-1">
              <h1 className="text-base font-bold text-slate-800 tracking-tight">灵狐聊天记录</h1>
              <p className="text-[11px] text-slate-400 font-medium">Fox Chat History Viewer</p>
            </div>
            <button
              onClick={openDbModal}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all duration-200 tooltip-trigger"
              data-tooltip="数据库配置"
            >
              <IconSettings />
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="flex-1 relative group">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                <IconSearch />
              </div>
              <input
                className="w-full border border-slate-200/80 rounded-xl pl-10 pr-4 py-2.5 text-sm bg-white/60 focus:bg-white focus:outline-none focus:border-indigo-400 search-glow transition-all placeholder:text-slate-400"
                placeholder="搜索问题或应用名..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <button
              onClick={handleSearch}
              className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:from-indigo-600 hover:to-indigo-700 active:scale-[0.97] transition-all shadow-md shadow-indigo-200/50 btn-shine"
            >
              搜索
            </button>
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-3 mt-3 px-1">
            <span className="text-[11px] text-slate-400">
              共 <span className="font-semibold text-slate-600">{total}</span> 个会话
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span className="text-[11px] text-slate-400">
              第 <span className="font-semibold text-slate-600">{page}</span> / {totalPages || 1} 页
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {loading ? (
            <SessionSkeleton />
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 fade-in">
              <IconEmpty />
              <p className="text-sm text-slate-400 font-medium">暂无聊天会话</p>
              <p className="text-xs text-slate-300">试试搜索其他关键词</p>
            </div>
          ) : (
            <div className="space-y-1">
              {sessions.map((s) => (
                <div
                  key={s.session_id}
                  onClick={() => selectSession(s.session_id)}
                  className={`session-card p-3.5 rounded-2xl cursor-pointer ${
                    activeId === s.session_id ? "active" : ""
                  }`}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <span className={`tag-badge ${
                      activeId === s.session_id
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-slate-100/80 text-slate-500"
                    }`}>
                      {s.app_name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <IconChat />
                        {s.msg_count}
                      </span>
                    </div>
                  </div>
                  <div className="text-[13px] text-slate-700 truncate leading-relaxed font-medium mt-1">
                    {s.first_query}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatTime(s.last_time)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 mx-3 mb-2 rounded-2xl bg-white/40 flex items-center justify-between text-sm">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 rounded-xl text-slate-600 hover:bg-white/80 disabled:opacity-30 disabled:hover:bg-transparent transition-all text-[13px] font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              上一页
            </button>

            <div className="flex items-center gap-2 text-[12px] text-slate-400">
              <button
                onClick={() => page > 1 && setPage(page - 1)}
                className="w-7 h-7 rounded-lg hover:bg-white/60 transition-colors flex items-center justify-center"
                disabled={page <= 1}
              >
                {page > 1 ? page - 1 : ""}
              </button>
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-[13px] shadow-sm">
                {page}
              </span>
              <button
                onClick={() => page < totalPages && setPage(page + 1)}
                className="w-7 h-7 rounded-lg hover:bg-white/60 transition-colors flex items-center justify-center"
                disabled={page >= totalPages}
              >
                {page < totalPages ? page + 1 : ""}
              </button>
            </div>

            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 rounded-xl text-slate-600 hover:bg-white/80 disabled:opacity-30 disabled:hover:bg-transparent transition-all text-[13px] font-medium flex items-center gap-1"
            >
              下一页
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Sidebar toggle (visible when collapsed) */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="absolute left-2 top-4 z-20 w-8 h-8 rounded-xl glass-panel flex items-center justify-center text-slate-400 hover:text-indigo-500 transition-all hover:shadow-md"
        style={{ display: sidebarCollapsed ? "flex" : "none" }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* ====== RIGHT: CHAT DETAIL ====== */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {!activeId ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center gap-5 fade-in">
            <div className="relative">
              <div className="w-28 h-28 rounded-[2rem] bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                <svg className="w-14 h-14 text-indigo-300" fill="none" viewBox="0 0 56 56">
                  <path d="M14 21l7 7H14l2.5 9-6 7h35l-6-7 2.5-9h-7l7-9-8.5 5L28 14l-5.5 6L14 15v6z" fill="currentColor" opacity="0.5"/>
                  <circle cx="22" cy="28" r="2" fill="white" opacity="0.8"/>
                  <circle cx="34" cy="28" r="2" fill="white" opacity="0.8"/>
                </svg>
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white text-xs shadow-lg pulse-ring">
                ?
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-slate-600 mb-1">选择一个会话</h2>
              <p className="text-sm text-slate-400">从左侧列表选择会话以查看聊天详情</p>
            </div>
            <div className="flex items-center gap-6 mt-4">
              {[
                { icon: "💬", label: "多轮对话" },
                { icon: "📊", label: "Markdown 渲染" },
                { icon: "🔍", label: "全文搜索" },
              ].map((f) => (
                <div key={f.label} className="flex flex-col items-center gap-2 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-white/80 shadow-sm flex items-center justify-center text-xl">
                    {f.icon}
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Top bar */}
            {messages.length > 0 && (
              <div className="px-6 py-3.5 glass-panel border-b border-white/20 flex items-center gap-3 flex-wrap fade-in">
                {/* Sidebar toggle */}
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-500 hover:bg-indigo-50/60 transition-all mr-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={sidebarCollapsed ? "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" : "M3.75 6.75h16.5M3.75 12h16.5M12.75 17.25h7.5"} />
                  </svg>
                </button>

                <span className="tag-badge bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-100 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 pulse-ring"></span>
                  {messages[0].app_name}
                </span>
                {messages[0].store && (
                  <span className="tag-badge bg-slate-50 text-slate-500 border border-slate-200/60">
                    🏪 {messages[0].store}
                  </span>
                )}
                {messages[0].region && (
                  <span className="tag-badge bg-slate-50 text-slate-500 border border-slate-200/60">
                    📍 {messages[0].region}
                  </span>
                )}
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 bg-slate-50/80 px-3 py-1 rounded-full">
                    {messages.length} 条记录 · {messages.reduce((acc, m) => acc + parseTurns(m).length, 0)} 轮对话
                  </span>
                </div>
              </div>
            )}

            {/* Chat messages */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-6 py-6">
              {msgLoading ? (
                <div className="max-w-4xl mx-auto space-y-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-4">
                      <div className="flex justify-end">
                        <div className="shimmer w-1/3 h-12 rounded-2xl rounded-tr-sm"></div>
                      </div>
                      <div className="flex justify-start">
                        <div className="shimmer w-2/3 h-24 rounded-2xl rounded-tl-sm"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="max-w-4xl mx-auto space-y-6">
                  {/* Date header */}
                  {messages.length > 0 && (
                    <div className="flex items-center justify-center mb-4 fade-in">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                      <span className="text-[11px] text-slate-400 px-4 py-1 bg-white/60 rounded-full border border-slate-100/80 font-medium">
                        {new Date(messages[0].created_at).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}
                      </span>
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                    </div>
                  )}

                  {messages.map((m, mIdx) =>
                    parseTurns(m).map((turn, i) => (
                      <div key={`${m.id}-${i}`} className="space-y-5 chat-bubble" style={{ animationDelay: `${(mIdx * 2 + i) * 0.05}s` }}>
                        {/* User message */}
                        {turn.user && (
                          <div className="flex justify-end items-end gap-2.5">
                            <div className="max-w-[72%]">
                              <div className="user-bubble text-white rounded-2xl rounded-tr-md px-5 py-3.5 text-[14px] leading-relaxed whitespace-pre-wrap">
                                {turn.user}
                              </div>
                            </div>
                            <div className="avatar avatar-user flex-shrink-0">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                              </svg>
                            </div>
                          </div>
                        )}
                        {/* Assistant message */}
                        {turn.assistant && (
                          <div className="flex justify-start items-start gap-2.5">
                            <div className="avatar avatar-bot flex-shrink-0 mt-0.5">
                              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M5 2l4 5H5l1.5 5.5L3 16h14l-3.5-3.5L15 7h-4l4-5-5 3-3-3-3 3L5 2z" opacity="0.85"/>
                              </svg>
                            </div>
                            <div className="max-w-[75%]">
                              <div className="assistant-bubble rounded-2xl rounded-tl-md px-5 py-4 text-sm prose max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{turn.assistant}</ReactMarkdown>
                              </div>
                              {/* Timestamp & response time */}
                              <div className="flex items-center gap-2 mt-1.5 ml-1">
                                <span className="text-[10px] text-slate-300">
                                  {new Date(m.created_at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                                {m.response_time && (
                                  <span className="text-[10px] text-slate-300">
                                    · {(m.response_time / 1000).toFixed(1)}s
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}

                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ====== DB CONFIG MODAL ====== */}
      {showDbModal && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50" onClick={() => setShowDbModal(false)}>
          <div className="modal-content bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-[440px] p-7 border border-white/50" onClick={(e) => e.stopPropagation()}>
            {/* Modal header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200/50">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">数据库配置</h2>
                <p className="text-[11px] text-slate-400">修改 MySQL 连接参数</p>
              </div>
              <button
                onClick={() => setShowDbModal(false)}
                className="ml-auto w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form fields */}
            <div className="space-y-3.5">
              {([
                ["host", "主机地址", "localhost", "🖥️"],
                ["port", "端口号", "3306", "🔌"],
                ["user", "用户名", "root", "👤"],
                ["password", "密码", "留空保持不变", "🔑"],
                ["database", "数据库", "fox_chat", "📦"],
              ] as const).map(([key, label, placeholder, icon]) => (
                <div key={key}>
                  <label className="text-[12px] text-slate-500 mb-1.5 block font-medium flex items-center gap-1.5">
                    <span>{icon}</span> {label}
                  </label>
                  <input
                    type={key === "password" ? "password" : "text"}
                    className="w-full border border-slate-200/80 rounded-xl px-4 py-2.5 text-sm bg-white/60 focus:bg-white focus:outline-none focus:border-indigo-400 search-glow transition-all placeholder:text-slate-300"
                    value={dbForm[key]}
                    onChange={(e) => setDbForm({ ...dbForm, [key]: e.target.value })}
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>

            {dbError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-100 flex items-center gap-2">
                <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <p className="text-xs text-red-600">{dbError}</p>
              </div>
            )}

            <div className="flex justify-end gap-2.5 mt-6">
              <button
                onClick={() => setShowDbModal(false)}
                className="px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-all font-medium"
              >
                取消
              </button>
              <button
                onClick={saveDbConfig}
                disabled={dbSaving}
                className="px-6 py-2.5 text-sm bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-md shadow-indigo-200/50 font-medium btn-shine flex items-center gap-2"
              >
                {dbSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    连接中...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.07-9.07l4.5-4.5a4.5 4.5 0 016.364 6.364l-1.757 1.757" />
                    </svg>
                    保存并连接
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
