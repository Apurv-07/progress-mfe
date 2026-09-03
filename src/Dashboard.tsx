import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import "./App.css";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, Flame, TrendingUp } from "lucide-react";

interface Progress {
  _id: string;
  userId: string;
  day: string;
  completed: number;
  status: boolean;
  attempted: boolean;
}

const IST_TIMEZONE = "Asia/Kolkata";

function getISTDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIMEZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);

  return {
    year: Number(parts.find((p) => p.type === "year")?.value),
    month: Number(parts.find((p) => p.type === "month")?.value),
    day: Number(parts.find((p) => p.type === "day")?.value),
  };
}

function isSameISTDay(calendarDate: Date, progressDate: Date) {
  const calendarParts = {
    year: calendarDate.getFullYear(),
    month: calendarDate.getMonth() + 1,
    day: calendarDate.getDate(),
  };

  const progressParts = getISTDateParts(progressDate);

  return (
    calendarParts.year === progressParts.year &&
    calendarParts.month === progressParts.month &&
    calendarParts.day === progressParts.day
  );
}

function formatISTDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIMEZONE,
    day: "2-digit",
    month: "short",
  }).format(new Date(date));
}

function Dashboard() {
  const [progressData, setProgressData] = useState<Progress[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);

  const { year, month } = getISTDateParts(currentMonth);

  useEffect(() => {
    const getProgress = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `https://todo-mfe-be.onrender.com/todo-calendar/progress?year=${year}&month=${month}`,
          {
            method: "GET",
            credentials: "include",
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        setProgressData(data.results ?? []);
      } catch (error) {
        console.error("Error fetching progress:", error);
        setProgressData([]);
      } finally {
        setLoading(false);
      }
    };

    getProgress();
  }, [year, month]);

  const totalCompleted = useMemo(() => {
    return progressData.reduce((total, item) => total + item.completed, 0);
  }, [progressData]);

  const chartData = useMemo(() => {
    return [...progressData]
      .sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime())
      .map((item) => ({
        date: formatISTDate(item.day),
        completed: item.completed,
      }));
  }, [progressData]);

  const metrics = useMemo(() => {
    const activeDays = progressData.filter((item) => item.completed > 0).length;
    const bestDay = progressData.reduce(
      (max, item) => (item.completed > max ? item.completed : max),
      0,
    );
    const average = activeDays > 0 ? totalCompleted / activeDays : 0;
    return {
      activeDays,
      bestDay,
      average: Math.round(average * 10) / 10,
    };
  }, [progressData, totalCompleted]);

  const handleMonthChange = ({
    activeStartDate,
  }: {
    activeStartDate: Date | null;
  }) => {
    if (!activeStartDate) return;

    setCurrentMonth(activeStartDate);
  };

  return (
    <div className="min-h-full w-full bg-slate-950 text-slate-100 p-6 lg:p-12 relative overflow-x-hidden progress-dashboard">
      {/* Background Aurora Glow Orbs */}
      <div className="absolute top-10 left-10 w-[500px] h-[500px] bg-indigo-500/15 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div
        className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-fuchsia-500/15 rounded-full blur-[120px] pointer-events-none animate-pulse"
        style={{ animationDuration: "4s" }}
      />

      {/* Main Container Wrapper */}
      <div className="max-w-7xl mx-auto space-y-10 relative z-10">
        {/* Top Summary Card */}
        <div className="progress-card p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-2xl shadow-2xl flex items-center justify-between gap-4 relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br from-indigo-500/20 to-pink-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />

          <div>
            <p className="progress-card-label text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-2">
              Tasks Completed This Month
            </p>

            <p className="progress-total text-5xl sm:text-6xl font-black tracking-tight text-white">
              {totalCompleted}
            </p>
          </div>

          {loading && (
            <span className="progress-loading px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold animate-pulse">
              Loading...
            </span>
          )}
        </div>

        {/* Grid Container for Calendar & Graph */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Calendar Card (Span 5 cols) */}
          <div className="progress-card calendar-card lg:col-span-5 p-5 sm:p-8 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-2xl shadow-2xl flex flex-col items-center">
            <Calendar
              className="progress-calendar bg-transparent text-slate-100 border-none w-full font-sans"
              onActiveStartDateChange={handleMonthChange}
              tileContent={({ date, view }) => {
                if (view !== "month") {
                  return null;
                }

                const dayProgress = progressData.find((item) =>
                  isSameISTDay(date, new Date(item.day)),
                );

                if (!dayProgress || dayProgress.attempted === false) {
                  return (
                    <span className="mt-1 block text-lg font-bold text-red-400">
                      ×
                    </span>
                  );
                }

                return (
                  <span
                    className={
                      dayProgress.status
                        ? "calendar-progress calendar-progress-complete inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold mt-1 shadow-sm"
                        : "calendar-progress calendar-progress-incomplete inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold mt-1 shadow-sm"
                    }
                  >
                    {dayProgress.completed}
                  </span>
                );
              }}
            />
          </div>

          {/* Graph Card (Span 7 cols) */}
          <div className="progress-card graph-card lg:col-span-7 p-5 sm:p-8 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-2xl shadow-2xl flex flex-col">
            <div className="graph-header flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-300 shrink-0">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white leading-tight">
                    Tasks Completed
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Daily completion across the month
                  </p>
                </div>
              </div>

              <span className="self-start text-sm font-medium px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-indigo-300 whitespace-nowrap">
                {new Intl.DateTimeFormat("en-IN", {
                  timeZone: IST_TIMEZONE,
                  month: "long",
                  year: "numeric",
                }).format(new Date(Date.UTC(year, month - 1, 1)))}
              </span>
            </div>

            {/* Metric summary row */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
              <MetricStat
                icon={<TrendingUp className="w-4 h-4" />}
                label="Active Days"
                value={metrics.activeDays}
                accent="text-cyan-300 bg-cyan-500/10 border-cyan-500/20"
              />
              <MetricStat
                icon={<Flame className="w-4 h-4" />}
                label="Best Day"
                value={metrics.bestDay}
                accent="text-amber-300 bg-amber-500/10 border-amber-500/20"
              />
              <MetricStat
                icon={<BarChart3 className="w-4 h-4" />}
                label="Avg / Day"
                value={metrics.average}
                accent="text-indigo-300 bg-indigo-500/10 border-indigo-500/20"
              />
            </div>

            <div className="graph-container w-full h-[320px]">
              {chartData.length === 0 ? (
                <div className="graph-empty w-full h-full flex items-center justify-center text-slate-500 text-sm font-medium border border-dashed border-white/10 rounded-2xl">
                  No progress data for this month
                </div>
              ) : (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  minWidth={0}
                  minHeight={0}
                >
                  <BarChart
                    data={chartData}
                    margin={{
                      top: 10,
                      right: 20,
                      left: 0,
                      bottom: 10,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#334155"
                      opacity={0.4}
                    />

                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: "#94a3b8" }}
                      stroke="#475569"
                    />

                    <YAxis
                      allowDecimals={false}
                      width={35}
                      tick={{ fontSize: 12, fill: "#94a3b8" }}
                      stroke="#475569"
                    />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "rgba(255,255,255,0.1)",
                        borderRadius: "0.75rem",
                        color: "#f8fafc",
                        boxShadow: "0 20px 25px -5px rgb(0 0 / 0.5)",
                      }}
                    />

                    <Bar
                      dataKey="completed"
                      name="Tasks Completed"
                      fill="url(#colorGradient)"
                      radius={[6, 6, 0, 0]}
                    />

                    <defs>
                      <linearGradient
                        id="colorGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#818cf8" />
                        <stop offset="100%" stopColor="#c084fc" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricStat({
  icon,
  label,
  value,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className={`rounded-2xl border px-3 py-2.5 sm:px-4 sm:py-3 ${accent}`}>
      <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider opacity-80">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <p className="text-xl sm:text-2xl font-black mt-1 text-white leading-none">
        {value}
      </p>
    </div>
  );
}

export default Dashboard;
