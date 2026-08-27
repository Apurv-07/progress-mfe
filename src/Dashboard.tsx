import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useEffect, useMemo, useState } from "react";
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

interface Progress {
  _id: string;
  userId: string;
  day: string;
  completed: number;
  status: boolean;
  attempted: boolean;
}

function Dashboard() {
  const [progressData, setProgressData] = useState<Progress[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth() + 1;

  useEffect(() => {
    const getProgress = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `https://todo-mfe-be.onrender.com/todo-calendar/progress?year=${year}&month=${month}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        console.log(`Progress for ${year}-${month}:`, data);

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

  function isSameDay(date1: Date, date2: Date) {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  const totalCompleted = useMemo(() => {
    return progressData.reduce(
      (total, item) => total + item.completed,
      0
    );
  }, [progressData]);

  const chartData = useMemo(() => {
    return [...progressData]
      .sort(
        (a, b) =>
          new Date(a.day).getTime() -
          new Date(b.day).getTime()
      )
      .map((item) => ({
        date: new Date(item.day).toLocaleDateString(
          "en-IN",
          {
            day: "2-digit",
            month: "short",
          }
        ),
        completed: item.completed,
      }));
  }, [progressData]);

  const handleMonthChange = ({
    activeStartDate,
  }: {
    activeStartDate: Date | null;
  }) => {
    if (!activeStartDate) return;

    setCurrentMonth(activeStartDate);
  };

  return (
    <div className="progress-dashboard">

      {/* =========================
          SUMMARY
      ========================= */}

      <div className="progress-card">
        <div>
          <p className="progress-card-label">
            Tasks Completed This Month
          </p>

          <p className="progress-total">
            {totalCompleted}
          </p>
        </div>

        {loading && (
          <span className="progress-loading">
            Loading...
          </span>
        )}
      </div>


      {/* =========================
          CALENDAR
      ========================= */}

      <div className="progress-card calendar-card">
        <Calendar
          className="progress-calendar"
          onActiveStartDateChange={handleMonthChange}
          tileContent={({ date, view }) => {
            if (view !== "month") {
              return null;
            }

            const dayProgress = progressData.find(
              (item) =>
                isSameDay(
                  date,
                  new Date(item.day)
                )
            );

            /*
             * No progress record:
             * show cross.
             */
            if (!dayProgress || dayProgress.attempted === false) {
    return (
        <span className="mt-1 block text-lg font-bold text-red-500">
            ×
        </span>
    );
}

            /*
             * Progress exists.
             *
             * Green  = all tasks completed
             * Orange = attempted but not everything completed
             */
            return (
              <span
                className={
                  dayProgress.status
                    ? "calendar-progress calendar-progress-complete"
                    : "calendar-progress calendar-progress-incomplete"
                }
              >
                {dayProgress.completed}
              </span>
            );
          }}
        />
      </div>


      {/* =========================
          GRAPH
      ========================= */}

      <div className="progress-card graph-card">

        <div className="graph-header">
          <h2>Tasks Completed</h2>

          <span>
            {new Date(year, month - 1).toLocaleDateString(
              "en-IN",
              {
                month: "long",
                year: "numeric",
              }
            )}
          </span>
        </div>

        <div className="graph-container">
          {chartData.length === 0 ? (
            <div className="graph-empty">
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
                />

                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                />

                <YAxis
                  allowDecimals={false}
                  width={35}
                />

                <Tooltip />

                <Bar
                  dataKey="completed"
                  name="Tasks Completed"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>

    </div>
  );
}

export default Dashboard;