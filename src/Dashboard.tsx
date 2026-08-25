import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useEffect, useMemo, useState } from "react";
import "./App.css"

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
}

function Dashboard() {
  const [progressData, setProgressData] = useState<Progress[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);

  /*
   * Calendar's currently visible month.
   *
   * Example:
   * August 2026 -> year = 2026, month = 8
   * July 2026   -> year = 2026, month = 7
   */
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth() + 1;

  /*
   * Fetch progress whenever the calendar
   * moves to another month.
   */
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

        console.log(
          `Progress for ${year}-${month}:`,
          data
        );

        setProgressData(data.results ?? []);
      } catch (error) {
        console.error("Error fetching progress:", error);

        // Important:
        // If the selected month has no data,
        // don't keep showing the previous month's data.
        setProgressData([]);
      } finally {
        setLoading(false);
      }
    };

    getProgress();
  }, [year, month]);

  /*
   * Compare two dates ignoring time.
   */
  function isSameDay(date1: Date, date2: Date) {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  /*
   * Total tasks completed in the
   * currently selected month.
   */
  const totalCompleted = useMemo(() => {
    return progressData.reduce(
      (total, item) => total + item.completed,
      0
    );
  }, [progressData]);

  /*
   * Data used by the graph.
   */
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

  /*
   * Called whenever user clicks
   * previous/next month.
   */
  const handleMonthChange = ({
    activeStartDate,
  }: {
    activeStartDate: Date | null;
  }) => {
    if (!activeStartDate) {
      return;
    }

    setCurrentMonth(activeStartDate);
  };

  return (
    <div className="w-full space-y-6 p-6">

      {/* =========================
          MONTH SUMMARY
         ========================= */}

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-700">
          Tasks Completed This Month
        </h2>

        <p className="mt-2 text-4xl font-bold text-green-600">
          {totalCompleted}
        </p>

        {loading && (
          <p className="mt-2 text-sm text-gray-500">
            Loading...
          </p>
        )}
      </div>


      {/* =========================
          CALENDAR
         ========================= */}

      <div className="w-full rounded-xl border bg-white p-6 shadow-sm flex justify-center">
        <Calendar
          className="w-full"
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
             * No progress record for this day.
             */
            if (!dayProgress) {
              return (
                <span className="mt-1 block text-lg font-bold text-red-500">
                  ×
                </span>
              );
            }

            /*
             * Progress exists.
             */
            return (
              <span
                className={`mx-auto mt-1 block w-fit min-w-5 rounded-full px-1 text-xs font-semibold ${
                  dayProgress.status
                    ? "bg-green-500 text-white"
                    : "bg-orange-500 text-white"
                }`}
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

      <div className="h-[350px] w-full rounded-xl border bg-white p-6 shadow-sm">

        <h2 className="mb-5 text-lg font-semibold text-gray-700">
          Tasks Completed
        </h2>

        {chartData.length === 0 ? (
          <div className="flex h-[260px] items-center justify-center text-gray-500">
            No progress data for this month
          </div>
        ) : (
          <ResponsiveContainer
            width="100%"
            height="90%"
          >
            <BarChart data={chartData}>

              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="date" />

              <YAxis allowDecimals={false} />

              <Tooltip />

              <Bar
                dataKey="completed"
                name="Tasks Completed"
                radius={[4, 4, 0, 0]}
              />

            </BarChart>
          </ResponsiveContainer>
        )}

      </div>

    </div>
  );
}

export default Dashboard;