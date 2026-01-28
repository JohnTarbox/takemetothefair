"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Event, Venue, Promoter } from "@prisma/client";

type EventWithRelations = Event & { venue: Venue; promoter: Promoter };

interface EventCalendarProps {
  events: EventWithRelations[];
}

export function EventCalendar({ events }: EventCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventWithRelations[]>();
    for (const event of events) {
      const start = new Date(event.startDate);
      const end = new Date(event.endDate);
      const d = new Date(start);
      while (d <= end) {
        const key = d.toISOString().slice(0, 10);
        const list = map.get(key) || [];
        list.push(event);
        map.set(key, list);
        d.setDate(d.getDate() + 1);
      }
    }
    return map;
  }, [events]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().slice(0, 10);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function prev() {
    setCurrentMonth(new Date(year, month - 1, 1));
  }
  function next() {
    setCurrentMonth(new Date(year, month + 1, 1));
  }

  const monthName = currentMonth.toLocaleString("default", { month: "long", year: "numeric" });

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No events match your filters. Try adjusting your search.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={prev} className="p-2 hover:bg-gray-100 rounded-lg">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold">{monthName}</h2>
        <button onClick={next} className="p-2 hover:bg-gray-100 rounded-lg">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 border border-gray-200 rounded-lg overflow-hidden">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="bg-gray-50 px-2 py-2 text-center text-xs font-medium text-gray-500 border-b border-gray-200">
            {day}
          </div>
        ))}
        {cells.map((day, i) => {
          const dateKey = day ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : null;
          const dayEvents = dateKey ? eventsByDate.get(dateKey) || [] : [];
          const isToday = dateKey === today;
          return (
            <div
              key={i}
              className={`min-h-[80px] p-1 border-b border-r border-gray-200 ${day ? "bg-white" : "bg-gray-50"}`}
            >
              {day && (
                <>
                  <span className={`text-xs font-medium ${isToday ? "bg-blue-600 text-white rounded-full w-6 h-6 inline-flex items-center justify-center" : "text-gray-700"}`}>
                    {day}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 2).map((event) => (
                      <Link
                        key={event.id}
                        href={`/events/${event.slug}`}
                        className="block text-xs truncate px-1 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
                      >
                        {event.name}
                      </Link>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-xs text-gray-500 px-1">+{dayEvents.length - 2} more</span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
