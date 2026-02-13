"use client";
import { useState, useEffect, useCallback } from "react";
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
  // Split only on "------" that appears as its own line, not inside tables
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

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDbModal, setShowDbModal] = useState(false);
  const [dbForm, setDbForm] = useState({ host: "", port: "3306", user: "", password: "", database: "" });
  const [dbSaving, setDbSaving] = useState(false);
  const [dbError, setDbError] = useState("");
  const limit = 20;

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/sessions?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
    const data = await res.json();
    setSessions(data.sessions);
    setTotal(data.total);
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const selectSession = async (id: string) => {
    setActiveId(id);
    const res = await fetch(`/api/session/${encodeURIComponent(id)}`);
    const data = await res.json();
    setMessages(data.messages);
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
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Left: Session List */}
      <div className="w-[380px] flex-shrink-0 bg-white/80 backdrop-blur-sm border-r border-slate-200/60 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200/60">
          <h1 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>
            灵狐聊天记录
            <button onClick={openDbModal} className="ml-auto text-slate-400 hover:text-indigo-500 transition-colors" title="数据库配置">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </h1>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                placeholder="搜索问题或应用名..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <button onClick={handleSearch} className="bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-600 active:scale-95 transition-all shadow-sm shadow-indigo-200">
              搜索
            </button>
          </div>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-slate-400 mt-2">加载中...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <svg className="w-12 h-12 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              暂无数据
            </div>
          ) : (
            sessions.map((s) => (
              <div
                key={s.session_id}
                onClick={() => selectSession(s.session_id)}
                className={`group p-3.5 mx-2 my-1 rounded-xl cursor-pointer transition-all duration-150 ${
                  activeId === s.session_id
                    ? "bg-indigo-50 shadow-sm ring-1 ring-indigo-200"
                    : "hover:bg-slate-50"
                }`}
              >
                <div className="flex justify-between items-center mb-1.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    activeId === s.session_id
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                  } transition-colors`}>
                    {s.app_name}
                  </span>
                  <span className="text-xs text-slate-400">{s.msg_count} 轮</span>
                </div>
                <div className="text-sm text-slate-700 truncate leading-relaxed">{s.first_query}</div>
                <div className="text-xs text-slate-400 mt-1">{new Date(s.last_time).toLocaleString("zh-CN")}</div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-200/60 flex items-center justify-between text-sm">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              ← 上一页
            </button>
            <span className="text-slate-400 text-xs">{page} / {totalPages}（共 {total} 条）</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              下一页 →
            </button>
          </div>
        )}
      </div>

      {/* Right: Chat Detail */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
            <svg className="w-16 h-16 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm">选择左侧会话查看聊天详情</p>
          </div>
        ) : (
          <>
            {/* Meta bar */}
            {messages.length > 0 && (
              <div className="px-6 py-3 bg-white/70 backdrop-blur-sm border-b border-slate-200/60 flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  {messages[0].app_name}
                </span>
                {messages[0].store && (
                  <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">{messages[0].store}</span>
                )}
                {messages[0].region && (
                  <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">{messages[0].region}</span>
                )}
                <span className="text-xs text-slate-400 ml-auto">{messages.length} 条记录</span>
              </div>
            )}

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="max-w-4xl mx-auto space-y-5">
                {messages.map((m) =>
                  parseTurns(m).map((turn, i) => (
                    <div key={`${m.id}-${i}`} className="space-y-4">
                      {turn.user && (
                        <div className="flex justify-end">
                          <div className="max-w-[75%] bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm shadow-indigo-200">
                            {turn.user}
                          </div>
                        </div>
                      )}
                      {turn.assistant && (
                        <div className="flex justify-start">
                          <div className="max-w-[75%] bg-white rounded-2xl rounded-tl-sm px-5 py-3 text-sm shadow-sm ring-1 ring-slate-200/60 prose max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{turn.assistant}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* DB Config Modal */}
      {showDbModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowDbModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-[420px] p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-semibold text-slate-800 mb-4">数据库配置</h2>
            <div className="space-y-3">
              {([["host", "主机地址"], ["port", "端口"], ["user", "用户名"], ["password", "密码"], ["database", "数据库名"]] as const).map(([key, label]) => (
                <div key={key}>
                  <label className="text-xs text-slate-500 mb-1 block">{label}</label>
                  <input
                    type={key === "password" ? "password" : "text"}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                    value={dbForm[key]}
                    onChange={(e) => setDbForm({ ...dbForm, [key]: e.target.value })}
                    placeholder={key === "password" ? "留空则保持不变" : ""}
                  />
                </div>
              ))}
            </div>
            {dbError && <p className="text-xs text-red-500 mt-3">{dbError}</p>}
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowDbModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                取消
              </button>
              <button onClick={saveDbConfig} disabled={dbSaving} className="px-4 py-2 text-sm bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 transition-all shadow-sm shadow-indigo-200">
                {dbSaving ? "连接中..." : "保存并连接"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
