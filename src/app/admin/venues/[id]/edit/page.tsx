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
  slug: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude: number | null;
  longitude: number | null;
  capacity: number | null;
  amenities: string;
  contactEmail: string | null;
  contactPhone: string | null;
  website: string | null;
  description: string | null;
  imageUrl: string | null;
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

export default function EditVenuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    latitude: "",
    longitude: "",
    capacity: "",
    amenities: "",
    contactEmail: "",
    contactPhone: "",
    website: "",
    description: "",
    imageUrl: "",
    status: "ACTIVE",
  });

  useEffect(() => {
    fetchVenue();
  }, [id]);

  const fetchVenue = async () => {
    try {
      const res = await fetch(`/api/admin/venues/${id}`);
      if (!res.ok) {
        setError("Venue not found");
        return;
      }
      const venue: Venue = await res.json();
      setFormData({
        name: venue.name,
        address: venue.address,
        city: venue.city,
        state: venue.state,
        zip: venue.zip,
        latitude: venue.latitude?.toString() || "",
        longitude: venue.longitude?.toString() || "",
        capacity: venue.capacity?.toString() || "",
        amenities: parseJsonArray(venue.amenities).join(", "),
        contactEmail: venue.contactEmail || "",
        contactPhone: venue.contactPhone || "",
        website: venue.website || "",
        description: venue.description || "",
        imageUrl: venue.imageUrl || "",
        status: venue.status,
      });
    } catch (error) {
      console.error("Failed to fetch venue:", error);
      setError("Failed to load venue");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/venues/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
          capacity: formData.capacity ? parseInt(formData.capacity) : null,
          amenities: JSON.stringify(
            formData.amenities
              .split(",")
              .map((a) => a.trim())
              .filter(Boolean)
          ),
          contactEmail: formData.contactEmail || null,
          contactPhone: formData.contactPhone || null,
          website: formData.website || null,
          description: formData.description || null,
          imageUrl: formData.imageUrl || null,
          status: formData.status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update venue");
        return;
      }

      router.push("/admin/venues");
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
          href="/admin/venues"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Venues
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">Edit Venue</h1>

      <Card>
        <CardHeader>
          <p className="text-sm text-gray-600">Update venue details</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <Input
              label="Venue Name"
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

            <Input
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
            />

            <div className="grid grid-cols-3 gap-4">
              <Input
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
              />
              <Input
                label="State"
                name="state"
                value={formData.state}
                onChange={handleChange}
                required
              />
              <Input
                label="ZIP"
                name="zip"
                value={formData.zip}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Latitude"
                type="number"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                step="any"
              />
              <Input
                label="Longitude"
                type="number"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                step="any"
              />
            </div>

            <Input
              label="Capacity"
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              min="0"
            />

            <Input
              label="Amenities (comma-separated)"
              name="amenities"
              value={formData.amenities}
              onChange={handleChange}
              placeholder="Parking, Restrooms, Food Court"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Contact Email"
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
              />
              <Input
                label="Contact Phone"
                type="tel"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
              />
            </div>

            <Input
              label="Website"
              type="url"
              name="website"
              value={formData.website}
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
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

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
