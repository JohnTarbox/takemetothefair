import Link from "next/link";
import { formatDateRange, formatPrice } from "@/lib/utils";
import { parseJsonArray } from "@/types";
import { Badge } from "@/components/ui/badge";
import type { Event, Venue, Promoter } from "@prisma/client";

interface EventTableProps {
  events: (Event & { venue: Venue; promoter: Promoter })[];
}

export function EventTable({ events }: EventTableProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No events match your filters. Try adjusting your search.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categories</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {events.map((event) => {
            const categories = parseJsonArray(event.categories);
            return (
              <tr key={event.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/events/${event.slug}`} className="text-blue-600 hover:underline font-medium">
                    {event.name}
                  </Link>
                  {event.featured && <Badge variant="warning" className="ml-2">Featured</Badge>}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                  {formatDateRange(event.startDate, event.endDate)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {event.venue.name}, {event.venue.city}, {event.venue.state}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                  {formatPrice(event.ticketPriceMin, event.ticketPriceMax)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {categories.slice(0, 3).map((cat) => (
                      <Badge key={cat} variant="default">{cat}</Badge>
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
