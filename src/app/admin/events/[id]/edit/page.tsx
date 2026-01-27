"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface Venue {
  id: string;
  name: string;
  city: string;
  state: string;
}

interface Event {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  venueId: string;
  startDate: string;
  endDate: string;
  categories: string;
  tags: string;
  ticketUrl: string | null;
  ticketPriceMin: number | null;
  ticketPriceMax: number | null;
  imageUrl: string | null;
  featured: boolean;
  status: string;
}

function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

function formatDateForInput(dateString: string): string {
  return new Date(dateString).toISOString().split("T")[0];
}

function formatTimeForInput(dateString: string): string {
  const date = new Date(dateString);
  return date.toTimeString().slice(0, 5);
}

export default function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    venueId: "",
    startDate: "",
    startTime: "09:00",
    endDate: "",
    endTime: "17:00",
    categories: "",
    tags: "",
    ticketUrl: "",
    ticketPriceMin: "",
    ticketPriceMax: "",
    imageUrl: "",
    featured: false,
    status: "DRAFT",
  });

  useEffect(() => {
    Promise.all([fetchEvent(), fetchVenues()]);
  }, [id]);

  const fetchEvent = async () => {
    try {
      const res = await fetch(`/api/admin/events/${id}`);
      if (!res.ok) {
        setError("Event not found");
        return;
      }
      const event: Event = await res.json();
      setFormData({
        name: event.name,
        description: event.description || "",
        venueId: event.venueId,
        startDate: formatDateForInput(event.startDate),
        startTime: formatTimeForInput(event.startDate),
        endDate: formatDateForInput(event.endDate),
        endTime: formatTimeForInput(event.endDate),
        categories: parseJsonArray(event.categories).join(", "),
        tags: parseJsonArray(event.tags).join(", "),
        ticketUrl: event.ticketUrl || "",
        ticketPriceMin: event.ticketPriceMin?.toString() || "",
        ticketPriceMax: event.ticketPriceMax?.toString() || "",
        imageUrl: event.imageUrl || "",
        featured: event.featured,
        status: event.status,
      });
    } catch (error) {
      console.error("Failed to fetch event:", error);
      setError("Failed to load event");
    } finally {
      setLoading(false);
    }
  };

  const fetchVenues = async () => {
    try {
      const res = await fetch("/api/venues");
      const data = await res.json();
      setVenues(data);
    } catch (error) {
      console.error("Failed to fetch venues:", error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const startDateTime = new Date(
        `${formData.startDate}T${formData.startTime}`
      );
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

      const res = await fetch(`/api/admin/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          venueId: formData.venueId,
          startDate: startDateTime.toISOString(),
          endDate: endDateTime.toISOString(),
          categories: JSON.stringify(
            formData.categories
              .split(",")
              .map((c) => c.trim())
              .filter(Boolean)
          ),
          tags: JSON.stringify(
            formData.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          ),
          ticketUrl: formData.ticketUrl || null,
          ticketPriceMin: formData.ticketPriceMin
            ? parseFloat(formData.ticketPriceMin)
            : null,
          ticketPriceMax: formData.ticketPriceMax
            ? parseFloat(formData.ticketPriceMax)
            : null,
          imageUrl: formData.imageUrl || null,
          featured: formData.featured,
          status: formData.status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update event");
        return;
      }

      router.push("/admin/events");
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-96 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href="/admin/events"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Events
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">Edit Event</h1>

      <Card>
        <CardHeader>
          <p className="text-sm text-gray-600">Update event details</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <Input
              label="Event Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Venue
              </label>
              <select
                name="venueId"
                value={formData.venueId}
                onChange={handleChange}
                required
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select a venue</option>
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name} - {venue.city}, {venue.state}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
              <Input
                label="Start Time"
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="End Date"
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
              />
              <Input
                label="End Time"
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                required
              />
            </div>

            <Input
              label="Categories (comma-separated)"
              name="categories"
              value={formData.categories}
              onChange={handleChange}
              placeholder="Fair, Festival, Food"
            />

            <Input
              label="Tags (comma-separated)"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="family-friendly, outdoor, music"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Min Ticket Price"
                type="number"
                name="ticketPriceMin"
                value={formData.ticketPriceMin}
                onChange={handleChange}
                min="0"
                step="0.01"
              />
              <Input
                label="Max Ticket Price"
                type="number"
                name="ticketPriceMax"
                value={formData.ticketPriceMax}
                onChange={handleChange}
                min="0"
                step="0.01"
              />
            </div>

            <Input
              label="Ticket URL"
              type="url"
              name="ticketUrl"
              value={formData.ticketUrl}
              onChange={handleChange}
            />

            <Input
              label="Image URL"
              type="url"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="DRAFT">Draft</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="featured"
                checked={formData.featured}
                onChange={handleChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Featured Event</span>
            </label>

            <div className="flex gap-3">
              <Button type="submit" isLoading={saving} disabled={saving}>
                Save Changes
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
