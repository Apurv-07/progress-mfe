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
import {
  BarChart3,
  CheckCircle2,
  Circle,
  Flame,
  TrendingUp,
  X,
} from "lucide-react";

interface Progress {
  _id: string;
  userId: string;
  day: string;
  completed: number;
  status: boolean;
  attempted: boolean;
}

interface Todo {
  _id: string;
  todo: string;
  status: boolean;
  createdAt: string;
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

// Build a YYYY-MM-DD string from the calendar tile's local date parts.
function toDateParam(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatModalDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function Dashboard() {
  const [progressData, setProgressData] = useState<Progress[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayTodos, setDayTodos] = useState<Todo[]>([]);
  const [todosLoading, setTodosLoading] = useState(false);
  const [todosError, setTodosError] = useState<string | null>(null);

  const { year, month } = getISTDateParts(currentMonth);

  const handleDateClick = async (date: Date) => {
    setSelectedDate(date);
    setDayTodos([]);
    setTodosError(null);
    setTodosLoading(true);

    try {
      const response = await fetch(
        `https://todo-mfe-be.onrender.com/todo/todos/date/${toDateParam(date)}`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();
      setDayTodos(data.todos ?? []);
    } catch (error) {
      console.error("Error fetching todos for date:", error);
      setTodosError("Couldn't load todos for this day. Please try again.");
    } finally {
      setTodosLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedDate(null);
    setDayTodos([]);
    setTodosError(null);
  };

  // Lock body scroll + close on Escape while the modal is open.
  useEffect(() => {
    if (!selectedDate) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedDate]);

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
              onClickDay={handleDateClick}
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

      {selectedDate && (
        <DayTodosModal
          date={selectedDate}
          todos={dayTodos}
          loading={todosLoading}
          error={todosError}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

function DayTodosModal({
  date,
  todos,
  loading,
  error,
  onClose,
}: {
  date: Date;
  todos: Todo[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
}) {
  const completedCount = todos.filter((t) => t.status).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Todos for ${formatModalDate(date)}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="relative z-10 w-full sm:max-w-lg max-h-[85vh] sm:max-h-[80vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden animate-[modalIn_0.2s_ease-out]">
        {/* Aurora accent */}
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-white/10">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400 mb-1">
              Todos
            </p>
            <h2 className="text-lg sm:text-xl font-bold text-white leading-snug break-words">
              {formatModalDate(date)}
            </h2>
            {!loading && !error && todos.length > 0 && (
              <p className="text-xs text-slate-400 mt-1.5">
                {completedCount} of {todos.length} completed
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="relative flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {loading && (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-2xl bg-white/5 border border-white/10 animate-pulse"
                />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="py-10 text-center text-sm text-red-300">
              {error}
            </div>
          )}

          {!loading && !error && todos.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-center gap-2 text-slate-500">
              <Circle className="w-8 h-8 opacity-40" />
              <p className="text-sm font-medium">No todos for this day</p>
            </div>
          )}

          {!loading &&
            !error &&
            todos.map((item) => (
              <div
                key={item._id}
                className="flex items-start gap-3 rounded-2xl bg-white/5 border border-white/10 p-4 hover:border-white/20 transition-colors"
              >
                <span className="shrink-0 mt-0.5">
                  {item.status ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-500" />
                  )}
                </span>
                <p
                  className={`flex-1 min-w-0 text-sm sm:text-base leading-relaxed break-words whitespace-pre-wrap ${
                    item.status
                      ? "text-slate-400 line-through decoration-slate-600"
                      : "text-slate-100"
                  }`}
                >
                  {item.todo}
                </p>
              </div>
            ))}
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
