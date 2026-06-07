import { useState, useEffect, useCallback } from "react";

const API = "http://localhost:5000";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const levelColor = {
  HTTP:  { bg: "bg-blue-500/15",   text: "text-blue-400",   dot: "bg-blue-400"   },
  INFO:  { bg: "bg-emerald-500/15", text: "text-emerald-400", dot: "bg-emerald-400" },
  ERROR: { bg: "bg-red-500/15",    text: "text-red-400",    dot: "bg-red-400"    },
  WARN:  { bg: "bg-amber-500/15",  text: "text-amber-400",  dot: "bg-amber-400"  },
};

const statusColor = (status) => {
  if (!status) return "text-slate-400";
  if (status < 300) return "text-emerald-400";
  if (status < 400) return "text-blue-400";
  if (status < 500) return "text-amber-400";
  return "text-red-400";
};

const fmt = (ts) => {
  if (!ts) return "";
  const [date, time] = ts.split(" ");
  return `${date} ${time}`;
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color = "blue" }) {
  const colors = {
    blue:    "from-blue-500/20 to-blue-600/5 border-blue-500/20",
    red:     "from-red-500/20 to-red-600/5 border-red-500/20",
    emerald: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20",
    amber:   "from-amber-500/20 to-amber-600/5 border-amber-500/20",
  };
  const textColors = {
    blue: "text-blue-400", red: "text-red-400",
    emerald: "text-emerald-400", amber: "text-amber-400",
  };
  return (
    <div className={`relative rounded-2xl border bg-gradient-to-br ${colors[color]} p-5 overflow-hidden`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {sub && <span className="text-xs text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full">{sub}</span>}
      </div>
      <div className={`text-3xl font-bold ${textColors[color]} mb-1`}>{value ?? "—"}</div>
      <div className="text-sm text-slate-400">{label}</div>
    </div>
  );
}

function MiniBar({ label, value, max, color = "blue" }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const barColors = {
    blue: "bg-blue-500", emerald: "bg-emerald-500",
    red: "bg-red-500", amber: "bg-amber-500", purple: "bg-purple-500",
  };
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="w-36 text-xs text-slate-400 truncate text-right">{label}</div>
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColors[color]} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="w-8 text-xs text-slate-300 text-left">{value}</div>
    </div>
  );
}

function ActivityChart({ data }) {
  if (!data?.length) return <div className="text-slate-500 text-sm text-center py-4">لا توجد بيانات</div>;
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-1.5 h-20">
      {data.map((d) => {
        const pct = Math.round((d.count / max) * 100);
        const day = d.date.slice(5); // MM-DD
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="relative w-full">
              <div
                className="w-full bg-blue-500/30 hover:bg-blue-500/60 rounded-sm transition-all duration-300 cursor-default"
                style={{ height: `${Math.max(pct * 0.6, 4)}px` }}
                title={`${d.date}: ${d.count} حدث`}
              />
            </div>
            <span className="text-[9px] text-slate-500">{day}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminDashboard({ onBack }) {
  const [stats, setStats]       = useState(null);
  const [logs, setLogs]         = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [filter, setFilter]     = useState("all");   // all | HTTP | INFO | ERROR
  const [search, setSearch]     = useState("");
  const [page, setPage]         = useState(1);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingLogs, setLoadingLogs]   = useState(true);
  const [error, setError]       = useState(null);

  // fetch stats
  useEffect(() => {
    (async () => {
      try {
        setLoadingStats(true);
        const res = await fetch(`${API}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const json = await res.json();
        if (json.success) setStats(json.data);
      } catch (e) {
        setError("تعذّر تحميل الإحصائيات");
      } finally {
        setLoadingStats(false);
      }
    })();
  }, []);

  // fetch logs
  const fetchLogs = useCallback(async () => {
    try {
      setLoadingLogs(true);
      const type = filter === "ERROR" ? "error" : "combined";
      const res = await fetch(
        `${API}/api/admin/logs?type=${type}&page=${page}&limit=50`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      const json = await res.json();
      if (json.success) {
        setLogs(json.data.logs);
        setPagination(json.data.pagination);
      }
    } catch (e) {
      setError("تعذّر تحميل السجلات");
    } finally {
      setLoadingLogs(false);
    }
  }, [filter, page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // filtered display
  const displayed = logs.filter((l) => {
    const matchLevel = filter === "all" || l.level === filter;
    const matchSearch =
      !search ||
      l.message?.toLowerCase().includes(search.toLowerCase()) ||
      l.path?.toLowerCase().includes(search.toLowerCase());
    return matchLevel && matchSearch;
  });

  const lvl = stats?.levelCounts || {};
  const sc  = stats?.statusCodes  || {};

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 overflow-y-auto" dir="rtl">
        {/* زر الرجوع */}
<button
  onClick={onBack}
  className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
>
  ← رجوع للشات
</button>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🛡️</span> لوحة التحكم
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">مراقبة النظام والسجلات — Pallaw</p>
        </div>
        <button
          onClick={() => { fetchLogs(); }}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 rounded-xl text-sm transition-colors"
        >
          🔄 تحديث
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* ── Stats cards ── */}
      {loadingStats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-800 bg-slate-900 h-28 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon="📋" label="إجمالي السجلات" value={stats?.totalLogs?.toLocaleString()} color="blue" />
          <StatCard icon="🚨" label="الأخطاء" value={stats?.totalErrors?.toLocaleString()} color="red" />
          <StatCard icon="⚡" label="متوسط زمن الاستجابة" value={stats?.avgDuration ? `${stats.avgDuration} ms` : "—"} color="amber" />
          <StatCard icon="✅" label="نجاح الطلبات" value={sc["2xx"] ?? "—"} sub={`${sc["3xx"] ?? 0} تحويل`} color="emerald" />
        </div>
      )}

      {/* ── Charts row ── */}
      {!loadingStats && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          {/* Activity */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-slate-300 mb-4">📈 النشاط اليومي (آخر 7 أيام)</h2>
            <ActivityChart data={stats.dailyActivity} />
          </div>

          {/* Status codes */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-slate-300 mb-4">📊 رموز الحالة</h2>
            <div className="space-y-1">
              {[
                { label: "2xx نجاح", value: sc["2xx"] || 0, color: "emerald" },
                { label: "3xx تحويل", value: sc["3xx"] || 0, color: "blue" },
                { label: "4xx خطأ عميل", value: sc["4xx"] || 0, color: "amber" },
                { label: "5xx خطأ سيرفر", value: sc["5xx"] || 0, color: "red" },
              ].map((item) => (
                <MiniBar
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  max={Math.max(sc["2xx"] || 0, sc["3xx"] || 0, sc["4xx"] || 0, sc["5xx"] || 0, 1)}
                  color={item.color}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Top endpoints ── */}
      {!loadingStats && stats?.topEndpoints?.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-8">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">🔗 أكثر الـ Endpoints استخداماً</h2>
          <div className="space-y-1">
            {stats.topEndpoints.map((ep, i) => (
              <MiniBar
                key={ep.endpoint}
                label={ep.endpoint}
                value={ep.count}
                max={stats.topEndpoints[0]?.count || 1}
                color={["blue","purple","emerald","amber","red"][i % 5]}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Logs table ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {/* Table header */}
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-slate-300 ml-2">📜 سجل الأحداث</h2>

          {/* Filter tabs */}
          <div className="flex gap-1 bg-slate-800 rounded-xl p-1">
            {["all", "HTTP", "INFO", "ERROR"].map((f) => (
              <button
                key={f}
                onClick={() => { setFilter(f); setPage(1); }}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  filter === f
                    ? "bg-slate-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {f === "all" ? "الكل" : f}
              </button>
            ))}
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="بحث..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[160px] bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
          />

          <span className="text-xs text-slate-500 mr-auto">
            {pagination.total.toLocaleString()} سجل
          </span>
        </div>

        {/* Table */}
        {loadingLogs ? (
          <div className="p-8 text-center text-slate-500 text-sm">جارٍ تحميل السجلات...</div>
        ) : displayed.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">لا توجد سجلات</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500">
                  <th className="text-right px-4 py-2.5 font-medium w-36">التوقيت</th>
                  <th className="text-right px-3 py-2.5 font-medium w-20">النوع</th>
                  <th className="text-right px-3 py-2.5 font-medium w-16">الحالة</th>
                  <th className="text-right px-3 py-2.5 font-medium w-16">المدة</th>
                  <th className="text-right px-3 py-2.5 font-medium">الرسالة</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((log, i) => {
                  const lc = levelColor[log.level] || levelColor["INFO"];
                  return (
                    <tr
                      key={i}
                      className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-4 py-2.5 text-slate-500 font-mono whitespace-nowrap">
                        {fmt(log.timestamp)}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${lc.bg} ${lc.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${lc.dot}`} />
                          {log.level}
                        </span>
                      </td>
                      <td className={`px-3 py-2.5 font-mono font-bold ${statusColor(log.status)}`}>
                        {log.status || "—"}
                      </td>
                      <td className="px-3 py-2.5 text-slate-400 font-mono whitespace-nowrap">
                        {log.duration ? `${log.duration}ms` : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-slate-300 max-w-md">
                        <div className="truncate" title={log.message}>
                          {log.method && (
                            <span className="text-slate-500 ml-1">{log.method}</span>
                          )}
                          {log.path && (
                            <span className="text-blue-400 ml-1">{log.path}</span>
                          )}
                          {log.message}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs transition-colors"
            >
              ← السابق
            </button>
            <span className="text-xs text-slate-400">
              صفحة {page} من {pagination.pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs transition-colors"
            >
              التالي →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}