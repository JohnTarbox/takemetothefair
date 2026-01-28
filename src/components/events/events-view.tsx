"use client";

import { LayoutGrid, Table, Calendar as CalendarIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { EventList } from "./event-list";
import { EventTable } from "./event-table";
import { EventCalendar } from "./event-calendar";
import type { Event, Venue, Promoter } from "@prisma/client";

type EventWithRelations = Event & { venue: Venue; promoter: Promoter };

interface EventsViewProps {
  events: EventWithRelations[];
  view: "cards" | "table" | "calendar";
}

const views = [
  { key: "cards" as const, label: "Cards", icon: LayoutGrid },
  { key: "table" as const, label: "Table", icon: Table },
  { key: "calendar" as const, label: "Calendar", icon: CalendarIcon },
];

export function EventsView({ events, view }: EventsViewProps) {
  const searchParams = useSearchParams();

  function switchView(newView: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", newView);
    params.delete("page");
    window.location.href = `/events?${params.toString()}`;
  }

  return (
    <div>
      <div className="mb-4 flex gap-1 border border-gray-200 rounded-lg p-1 w-fit">
        {views.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => switchView(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === key
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {view === "cards" && <EventList events={events} emptyMessage="No events match your filters. Try adjusting your search." />}
      {view === "table" && <EventTable events={events} />}
      {view === "calendar" && <EventCalendar events={events} />}
    </div>
  );
}
