import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  findDuplicatePairs,
  getVenueComparisonString,
  getEventComparisonString,
  getVendorComparisonString,
  getPromoterComparisonString,
} from "@/lib/duplicates/similarity";
import type { DuplicateEntityType, FindDuplicatesResponse } from "@/lib/duplicates/types";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type") as DuplicateEntityType | null;
  const threshold = parseFloat(searchParams.get("threshold") || "0.7");

  if (!type || !["venues", "events", "vendors", "promoters"].includes(type)) {
    return NextResponse.json(
      { error: "Invalid or missing type parameter" },
      { status: 400 }
    );
  }

  if (isNaN(threshold) || threshold < 0 || threshold > 1) {
    return NextResponse.json(
      { error: "Threshold must be between 0 and 1" },
      { status: 400 }
    );
  }

  try {
    let duplicates;
    let totalEntities = 0;

    switch (type) {
      case "venues": {
        const venues = await prisma.venue.findMany({
          select: {
            id: true,
            name: true,
            slug: true,
            address: true,
            city: true,
            state: true,
            zip: true,
            latitude: true,
            longitude: true,
            capacity: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            _count: { select: { events: true } },
          },
          orderBy: { name: "asc" },
        });
        totalEntities = venues.length;
        duplicates = findDuplicatePairs(
          venues,
          getVenueComparisonString,
          threshold
        );
        break;
      }

      case "events": {
        const events = await prisma.event.findMany({
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            promoterId: true,
            venueId: true,
            startDate: true,
            endDate: true,
            status: true,
            viewCount: true,
            createdAt: true,
            updatedAt: true,
            venue: { select: { name: true } },
            promoter: { select: { companyName: true } },
            _count: { select: { eventVendors: true } },
          },
          orderBy: { name: "asc" },
        });
        totalEntities = events.length;
        duplicates = findDuplicatePairs(
          events,
          getEventComparisonString,
          threshold
        );
        break;
      }

      case "vendors": {
        const vendors = await prisma.vendor.findMany({
          select: {
            id: true,
            userId: true,
            businessName: true,
            slug: true,
            description: true,
            vendorType: true,
            website: true,
            verified: true,
            createdAt: true,
            updatedAt: true,
            _count: { select: { eventVendors: true } },
          },
          orderBy: { businessName: "asc" },
        });
        totalEntities = vendors.length;
        duplicates = findDuplicatePairs(
          vendors,
          getVendorComparisonString,
          threshold
        );
        break;
      }

      case "promoters": {
        const promoters = await prisma.promoter.findMany({
          select: {
            id: true,
            userId: true,
            companyName: true,
            slug: true,
            description: true,
            website: true,
            verified: true,
            createdAt: true,
            updatedAt: true,
            _count: { select: { events: true } },
          },
          orderBy: { companyName: "asc" },
        });
        totalEntities = promoters.length;
        duplicates = findDuplicatePairs(
          promoters,
          getPromoterComparisonString,
          threshold
        );
        break;
      }
    }

    const response: FindDuplicatesResponse = {
      type,
      threshold,
      duplicates: duplicates.map((pair) => ({
        entity1: pair.entity1,
        entity2: pair.entity2,
        similarity: pair.similarity,
        matchedFields: ["name"], // Simplified for now
      })),
      totalEntities,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to find duplicates:", error);
    return NextResponse.json(
      { error: "Failed to find duplicates" },
      { status: 500 }
    );
  }
}
