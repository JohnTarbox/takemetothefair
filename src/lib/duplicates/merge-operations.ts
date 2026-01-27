import { prisma } from "@/lib/prisma";
import type {
  DuplicateEntityType,
  MergePreviewResponse,
  MergeResponse,
  RelationshipCounts,
} from "./types";

/**
 * Get merge preview for two entities
 * Returns what will happen if they are merged
 */
export async function getMergePreview(
  type: DuplicateEntityType,
  primaryId: string,
  duplicateId: string
): Promise<MergePreviewResponse> {
  switch (type) {
    case "venues":
      return getVenueMergePreview(primaryId, duplicateId);
    case "events":
      return getEventMergePreview(primaryId, duplicateId);
    case "vendors":
      return getVendorMergePreview(primaryId, duplicateId);
    case "promoters":
      return getPromoterMergePreview(primaryId, duplicateId);
    default:
      throw new Error(`Unknown entity type: ${type}`);
  }
}

/**
 * Execute merge operation
 */
export async function executeMerge(
  type: DuplicateEntityType,
  primaryId: string,
  duplicateId: string
): Promise<MergeResponse> {
  switch (type) {
    case "venues":
      return mergeVenues(primaryId, duplicateId);
    case "events":
      return mergeEvents(primaryId, duplicateId);
    case "vendors":
      return mergeVendors(primaryId, duplicateId);
    case "promoters":
      return mergePromoters(primaryId, duplicateId);
    default:
      throw new Error(`Unknown entity type: ${type}`);
  }
}

// =============================================================================
// VENUE MERGE OPERATIONS
// =============================================================================

async function getVenueMergePreview(
  primaryId: string,
  duplicateId: string
): Promise<MergePreviewResponse> {
  const [primary, duplicate] = await Promise.all([
    prisma.venue.findUnique({
      where: { id: primaryId },
      include: { _count: { select: { events: true } } },
    }),
    prisma.venue.findUnique({
      where: { id: duplicateId },
      include: { _count: { select: { events: true } } },
    }),
  ]);

  if (!primary || !duplicate) {
    throw new Error("One or both venues not found");
  }

  // Count favorites to transfer
  const favoritesCount = await prisma.userFavorite.count({
    where: {
      favoritableType: "venue",
      favoritableId: duplicateId,
    },
  });

  const relationshipsToTransfer: RelationshipCounts = {
    events: duplicate._count.events,
    favorites: favoritesCount,
  };

  return {
    primary: { ...primary, _count: primary._count },
    duplicate: { ...duplicate, _count: duplicate._count },
    relationshipsToTransfer,
    warnings: [],
    canMerge: true,
  };
}

async function mergeVenues(
  primaryId: string,
  duplicateId: string
): Promise<MergeResponse> {
  const transferred: RelationshipCounts = { events: 0, favorites: 0 };

  await prisma.$transaction(async (tx) => {
    // Transfer events from duplicate to primary
    const eventUpdate = await tx.event.updateMany({
      where: { venueId: duplicateId },
      data: { venueId: primaryId },
    });
    transferred.events = eventUpdate.count;

    // Transfer favorites (delete duplicates first)
    const existingFavorites = await tx.userFavorite.findMany({
      where: {
        favoritableType: "venue",
        favoritableId: primaryId,
      },
      select: { userId: true },
    });
    const existingUserIds = new Set(existingFavorites.map((f) => f.userId));

    // Get favorites to transfer (excluding users who already have the primary favorited)
    const favoritesToTransfer = await tx.userFavorite.findMany({
      where: {
        favoritableType: "venue",
        favoritableId: duplicateId,
        userId: { notIn: Array.from(existingUserIds) },
      },
    });

    // Update favorites to point to primary
    if (favoritesToTransfer.length > 0) {
      await tx.userFavorite.updateMany({
        where: {
          id: { in: favoritesToTransfer.map((f) => f.id) },
        },
        data: { favoritableId: primaryId },
      });
      transferred.favorites = favoritesToTransfer.length;
    }

    // Delete remaining duplicate favorites (users who already have primary favorited)
    await tx.userFavorite.deleteMany({
      where: {
        favoritableType: "venue",
        favoritableId: duplicateId,
      },
    });

    // Delete duplicate venue
    await tx.venue.delete({ where: { id: duplicateId } });
  });

  const mergedEntity = await prisma.venue.findUnique({
    where: { id: primaryId },
    include: { _count: { select: { events: true } } },
  });

  return {
    success: true,
    mergedEntity: mergedEntity!,
    transferredRelationships: transferred,
    deletedId: duplicateId,
  };
}

// =============================================================================
// PROMOTER MERGE OPERATIONS
// =============================================================================

async function getPromoterMergePreview(
  primaryId: string,
  duplicateId: string
): Promise<MergePreviewResponse> {
  const [primary, duplicate] = await Promise.all([
    prisma.promoter.findUnique({
      where: { id: primaryId },
      include: { _count: { select: { events: true } } },
    }),
    prisma.promoter.findUnique({
      where: { id: duplicateId },
      include: { _count: { select: { events: true } } },
    }),
  ]);

  if (!primary || !duplicate) {
    throw new Error("One or both promoters not found");
  }

  const warnings: string[] = [];
  const canMerge = true;

  // Check if they have different user accounts
  if (primary.userId !== duplicate.userId) {
    warnings.push(
      "These promoters are linked to different user accounts. Merging will only transfer events and favorites, not the user account."
    );
    // We can still merge, just need to warn
  }

  // Count favorites to transfer
  const favoritesCount = await prisma.userFavorite.count({
    where: {
      favoritableType: "promoter",
      favoritableId: duplicateId,
    },
  });

  const relationshipsToTransfer: RelationshipCounts = {
    events: duplicate._count.events,
    favorites: favoritesCount,
  };

  return {
    primary: { ...primary, _count: primary._count },
    duplicate: { ...duplicate, _count: duplicate._count },
    relationshipsToTransfer,
    warnings,
    canMerge,
  };
}

async function mergePromoters(
  primaryId: string,
  duplicateId: string
): Promise<MergeResponse> {
  const transferred: RelationshipCounts = { events: 0, favorites: 0 };

  await prisma.$transaction(async (tx) => {
    // Transfer events from duplicate to primary
    const eventUpdate = await tx.event.updateMany({
      where: { promoterId: duplicateId },
      data: { promoterId: primaryId },
    });
    transferred.events = eventUpdate.count;

    // Transfer favorites (same pattern as venues)
    const existingFavorites = await tx.userFavorite.findMany({
      where: {
        favoritableType: "promoter",
        favoritableId: primaryId,
      },
      select: { userId: true },
    });
    const existingUserIds = new Set(existingFavorites.map((f) => f.userId));

    const favoritesToTransfer = await tx.userFavorite.findMany({
      where: {
        favoritableType: "promoter",
        favoritableId: duplicateId,
        userId: { notIn: Array.from(existingUserIds) },
      },
    });

    if (favoritesToTransfer.length > 0) {
      await tx.userFavorite.updateMany({
        where: {
          id: { in: favoritesToTransfer.map((f) => f.id) },
        },
        data: { favoritableId: primaryId },
      });
      transferred.favorites = favoritesToTransfer.length;
    }

    await tx.userFavorite.deleteMany({
      where: {
        favoritableType: "promoter",
        favoritableId: duplicateId,
      },
    });

    // Delete duplicate promoter
    await tx.promoter.delete({ where: { id: duplicateId } });
  });

  const mergedEntity = await prisma.promoter.findUnique({
    where: { id: primaryId },
    include: { _count: { select: { events: true } } },
  });

  return {
    success: true,
    mergedEntity: mergedEntity!,
    transferredRelationships: transferred,
    deletedId: duplicateId,
  };
}

// =============================================================================
// VENDOR MERGE OPERATIONS
// =============================================================================

async function getVendorMergePreview(
  primaryId: string,
  duplicateId: string
): Promise<MergePreviewResponse> {
  const [primary, duplicate] = await Promise.all([
    prisma.vendor.findUnique({
      where: { id: primaryId },
      include: { _count: { select: { eventVendors: true } } },
    }),
    prisma.vendor.findUnique({
      where: { id: duplicateId },
      include: { _count: { select: { eventVendors: true } } },
    }),
  ]);

  if (!primary || !duplicate) {
    throw new Error("One or both vendors not found");
  }

  const warnings: string[] = [];
  const canMerge = true;

  // Check if they have different user accounts
  if (primary.userId !== duplicate.userId) {
    warnings.push(
      "These vendors are linked to different user accounts. Merging will only transfer event participations and favorites, not the user account."
    );
  }

  // Count favorites to transfer
  const favoritesCount = await prisma.userFavorite.count({
    where: {
      favoritableType: "vendor",
      favoritableId: duplicateId,
    },
  });

  // Check for overlapping events (vendor in same event as both)
  const duplicateEventIds = await prisma.eventVendor.findMany({
    where: { vendorId: duplicateId },
    select: { eventId: true },
  });

  const primaryEventIds = await prisma.eventVendor.findMany({
    where: { vendorId: primaryId },
    select: { eventId: true },
  });

  const primaryEventSet = new Set(primaryEventIds.map((e) => e.eventId));
  const overlappingEvents = duplicateEventIds.filter((e) =>
    primaryEventSet.has(e.eventId)
  );

  if (overlappingEvents.length > 0) {
    warnings.push(
      `${overlappingEvents.length} event(s) have both vendors assigned. Duplicate assignments will be removed.`
    );
  }

  const relationshipsToTransfer: RelationshipCounts = {
    eventVendors: duplicate._count.eventVendors - overlappingEvents.length,
    favorites: favoritesCount,
  };

  return {
    primary: { ...primary, _count: primary._count },
    duplicate: { ...duplicate, _count: duplicate._count },
    relationshipsToTransfer,
    warnings,
    canMerge,
  };
}

async function mergeVendors(
  primaryId: string,
  duplicateId: string
): Promise<MergeResponse> {
  const transferred: RelationshipCounts = { eventVendors: 0, favorites: 0 };

  await prisma.$transaction(async (tx) => {
    // Get events where primary vendor is already assigned
    const primaryEvents = await tx.eventVendor.findMany({
      where: { vendorId: primaryId },
      select: { eventId: true },
    });
    const primaryEventIds = new Set(primaryEvents.map((e) => e.eventId));

    // Delete overlapping event_vendor records (where both vendors are in same event)
    await tx.eventVendor.deleteMany({
      where: {
        vendorId: duplicateId,
        eventId: { in: Array.from(primaryEventIds) },
      },
    });

    // Transfer remaining event_vendors
    const eventVendorUpdate = await tx.eventVendor.updateMany({
      where: { vendorId: duplicateId },
      data: { vendorId: primaryId },
    });
    transferred.eventVendors = eventVendorUpdate.count;

    // Transfer favorites (same pattern)
    const existingFavorites = await tx.userFavorite.findMany({
      where: {
        favoritableType: "vendor",
        favoritableId: primaryId,
      },
      select: { userId: true },
    });
    const existingUserIds = new Set(existingFavorites.map((f) => f.userId));

    const favoritesToTransfer = await tx.userFavorite.findMany({
      where: {
        favoritableType: "vendor",
        favoritableId: duplicateId,
        userId: { notIn: Array.from(existingUserIds) },
      },
    });

    if (favoritesToTransfer.length > 0) {
      await tx.userFavorite.updateMany({
        where: {
          id: { in: favoritesToTransfer.map((f) => f.id) },
        },
        data: { favoritableId: primaryId },
      });
      transferred.favorites = favoritesToTransfer.length;
    }

    await tx.userFavorite.deleteMany({
      where: {
        favoritableType: "vendor",
        favoritableId: duplicateId,
      },
    });

    // Delete duplicate vendor
    await tx.vendor.delete({ where: { id: duplicateId } });
  });

  const mergedEntity = await prisma.vendor.findUnique({
    where: { id: primaryId },
    include: { _count: { select: { eventVendors: true } } },
  });

  return {
    success: true,
    mergedEntity: mergedEntity!,
    transferredRelationships: transferred,
    deletedId: duplicateId,
  };
}

// =============================================================================
// EVENT MERGE OPERATIONS
// =============================================================================

async function getEventMergePreview(
  primaryId: string,
  duplicateId: string
): Promise<MergePreviewResponse> {
  const [primary, duplicate] = await Promise.all([
    prisma.event.findUnique({
      where: { id: primaryId },
      include: {
        venue: { select: { name: true } },
        promoter: { select: { companyName: true } },
        _count: { select: { eventVendors: true } },
      },
    }),
    prisma.event.findUnique({
      where: { id: duplicateId },
      include: {
        venue: { select: { name: true } },
        promoter: { select: { companyName: true } },
        _count: { select: { eventVendors: true } },
      },
    }),
  ]);

  if (!primary || !duplicate) {
    throw new Error("One or both events not found");
  }

  const warnings: string[] = [];

  // Warn if different promoters
  if (primary.promoterId !== duplicate.promoterId) {
    warnings.push(
      `Events have different promoters: "${primary.promoter?.companyName}" vs "${duplicate.promoter?.companyName}"`
    );
  }

  // Warn if different venues
  if (primary.venueId !== duplicate.venueId) {
    warnings.push(
      `Events have different venues: "${primary.venue?.name}" vs "${duplicate.venue?.name}"`
    );
  }

  // Count favorites to transfer
  const favoritesCount = await prisma.userFavorite.count({
    where: {
      favoritableType: "event",
      favoritableId: duplicateId,
    },
  });

  // Check for overlapping vendors
  const duplicateVendorIds = await prisma.eventVendor.findMany({
    where: { eventId: duplicateId },
    select: { vendorId: true },
  });

  const primaryVendorIds = await prisma.eventVendor.findMany({
    where: { eventId: primaryId },
    select: { vendorId: true },
  });

  const primaryVendorSet = new Set(primaryVendorIds.map((v) => v.vendorId));
  const overlappingVendors = duplicateVendorIds.filter((v) =>
    primaryVendorSet.has(v.vendorId)
  );

  if (overlappingVendors.length > 0) {
    warnings.push(
      `${overlappingVendors.length} vendor(s) are assigned to both events. Duplicate assignments will be removed.`
    );
  }

  const relationshipsToTransfer: RelationshipCounts = {
    eventVendors: duplicate._count.eventVendors - overlappingVendors.length,
    favorites: favoritesCount,
  };

  return {
    primary: { ...primary, _count: primary._count },
    duplicate: { ...duplicate, _count: duplicate._count },
    relationshipsToTransfer,
    warnings,
    canMerge: true,
  };
}

async function mergeEvents(
  primaryId: string,
  duplicateId: string
): Promise<MergeResponse> {
  const transferred: RelationshipCounts = { eventVendors: 0, favorites: 0 };

  await prisma.$transaction(async (tx) => {
    // Get vendors already assigned to primary event
    const primaryVendors = await tx.eventVendor.findMany({
      where: { eventId: primaryId },
      select: { vendorId: true },
    });
    const primaryVendorIds = new Set(primaryVendors.map((v) => v.vendorId));

    // Delete overlapping event_vendor records
    await tx.eventVendor.deleteMany({
      where: {
        eventId: duplicateId,
        vendorId: { in: Array.from(primaryVendorIds) },
      },
    });

    // Transfer remaining event_vendors
    const eventVendorUpdate = await tx.eventVendor.updateMany({
      where: { eventId: duplicateId },
      data: { eventId: primaryId },
    });
    transferred.eventVendors = eventVendorUpdate.count;

    // Combine view counts
    const duplicate = await tx.event.findUnique({
      where: { id: duplicateId },
      select: { viewCount: true },
    });

    if (duplicate) {
      await tx.event.update({
        where: { id: primaryId },
        data: { viewCount: { increment: duplicate.viewCount } },
      });
    }

    // Transfer favorites (same pattern)
    const existingFavorites = await tx.userFavorite.findMany({
      where: {
        favoritableType: "event",
        favoritableId: primaryId,
      },
      select: { userId: true },
    });
    const existingUserIds = new Set(existingFavorites.map((f) => f.userId));

    const favoritesToTransfer = await tx.userFavorite.findMany({
      where: {
        favoritableType: "event",
        favoritableId: duplicateId,
        userId: { notIn: Array.from(existingUserIds) },
      },
    });

    if (favoritesToTransfer.length > 0) {
      await tx.userFavorite.updateMany({
        where: {
          id: { in: favoritesToTransfer.map((f) => f.id) },
        },
        data: { favoritableId: primaryId },
      });
      transferred.favorites = favoritesToTransfer.length;
    }

    await tx.userFavorite.deleteMany({
      where: {
        favoritableType: "event",
        favoritableId: duplicateId,
      },
    });

    // Delete duplicate event
    await tx.event.delete({ where: { id: duplicateId } });
  });

  const mergedEntity = await prisma.event.findUnique({
    where: { id: primaryId },
    include: {
      venue: { select: { name: true } },
      promoter: { select: { companyName: true } },
      _count: { select: { eventVendors: true } },
    },
  });

  return {
    success: true,
    mergedEntity: mergedEntity!,
    transferredRelationships: transferred,
    deletedId: duplicateId,
  };
}
