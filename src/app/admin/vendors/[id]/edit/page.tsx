"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface Vendor {
  id: string;
  businessName: string;
  slug: string;
  description: string | null;
  vendorType: string | null;
  products: string;
  website: string | null;
  socialLinks: string | null;
  logoUrl: string | null;
  verified: boolean;
  user: { name: string | null; email: string };
}

function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

export default function EditVendorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [userInfo, setUserInfo] = useState({ name: "", email: "" });
  const [formData, setFormData] = useState({
    businessName: "",
    description: "",
    vendorType: "",
    products: "",
    website: "",
    socialLinks: "",
    logoUrl: "",
    verified: false,
  });

  useEffect(() => {
    fetchVendor();
  }, [id]);

  const fetchVendor = async () => {
    try {
      const res = await fetch(`/api/admin/vendors/${id}`);
      if (!res.ok) {
        setError("Vendor not found");
        return;
      }
      const vendor: Vendor = await res.json();
      setUserInfo({
        name: vendor.user.name || "",
        email: vendor.user.email,
      });
      setFormData({
        businessName: vendor.businessName,
        description: vendor.description || "",
        vendorType: vendor.vendorType || "",
        products: parseJsonArray(vendor.products).join(", "),
        website: vendor.website || "",
        socialLinks: vendor.socialLinks || "",
        logoUrl: vendor.logoUrl || "",
        verified: vendor.verified,
      });
    } catch (error) {
      console.error("Failed to fetch vendor:", error);
      setError("Failed to load vendor");
    } finally {
      setLoading(false);
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
      const res = await fetch(`/api/admin/vendors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: formData.businessName,
          description: formData.description || null,
          vendorType: formData.vendorType || null,
          products: JSON.stringify(
            formData.products
              .split(",")
              .map((p) => p.trim())
              .filter(Boolean)
          ),
          website: formData.website || null,
          socialLinks: formData.socialLinks || null,
          logoUrl: formData.logoUrl || null,
          verified: formData.verified,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update vendor");
        return;
      }

      router.push("/admin/vendors");
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
          href="/admin/vendors"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Vendors
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">Edit Vendor</h1>

      <Card>
        <CardHeader>
          <p className="text-sm text-gray-600">Update vendor details</p>
          <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
            <p className="text-gray-600">
              <span className="font-medium">Account Owner:</span> {userInfo.name || "N/A"} ({userInfo.email})
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <Input
              label="Business Name"
              name="businessName"
              value={formData.businessName}
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
              label="Vendor Type"
              name="vendorType"
              value={formData.vendorType}
              onChange={handleChange}
              placeholder="Food, Crafts, Merchandise, etc."
            />

            <Input
              label="Products/Services (comma-separated)"
              name="products"
              value={formData.products}
              onChange={handleChange}
              placeholder="Handmade Jewelry, Pottery, Art"
            />

            <Input
              label="Website"
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
            />

            <Input
              label="Logo URL"
              type="url"
              name="logoUrl"
              value={formData.logoUrl}
              onChange={handleChange}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Social Links (JSON format)
              </label>
              <textarea
                name="socialLinks"
                value={formData.socialLinks}
                onChange={handleChange}
                rows={3}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder='{"facebook": "https://...", "instagram": "https://..."}'
              />
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="verified"
                checked={formData.verified}
                onChange={handleChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Verified Vendor</span>
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
