import { vi } from "vitest";

/**
 * Creates a mock Prisma client for testing
 * Usage: vi.mock('@/lib/prisma', () => ({ default: createMockPrisma() }))
 */
export function createMockPrisma() {
  return {
    user: createMockModel(),
    event: createMockModel(),
    venue: createMockModel(),
    vendor: createMockModel(),
    promoter: createMockModel(),
    userFavorite: createMockModel(),
    eventVendor: createMockModel(),
    notification: createMockModel(),
    $transaction: vi.fn((callback) => {
      if (typeof callback === "function") {
        return callback(createMockPrisma());
      }
      return Promise.all(callback);
    }),
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  };
}

function createMockModel() {
  return {
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    findFirst: vi.fn(),
    findFirstOrThrow: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    groupBy: vi.fn(),
  };
}

/**
 * Helper to create mock user data
 */
export function createMockUser(overrides = {}) {
  return {
    id: "user-1",
    email: "test@example.com",
    name: "Test User",
    role: "USER",
    passwordHash: "$2a$12$hashedpassword",
    image: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  };
}

/**
 * Helper to create mock event data
 */
export function createMockEvent(overrides = {}) {
  return {
    id: "event-1",
    name: "Test Fair",
    slug: "test-fair",
    description: "A test fair event",
    startDate: new Date("2024-06-01"),
    endDate: new Date("2024-06-03"),
    venueId: "venue-1",
    promoterId: "promoter-1",
    status: "APPROVED",
    viewCount: 0,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  };
}

/**
 * Helper to create mock venue data
 */
export function createMockVenue(overrides = {}) {
  return {
    id: "venue-1",
    name: "Test Fairgrounds",
    slug: "test-fairgrounds",
    address: "123 Fair St",
    city: "Fairville",
    state: "CA",
    zip: "12345",
    status: "ACTIVE",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  };
}

/**
 * Helper to create mock vendor data
 */
export function createMockVendor(overrides = {}) {
  return {
    id: "vendor-1",
    userId: "user-1",
    businessName: "Test Vendor Co",
    vendorType: "FOOD",
    description: "Test vendor description",
    status: "APPROVED",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  };
}

/**
 * Helper to create mock favorite data
 */
export function createMockFavorite(overrides = {}) {
  return {
    id: "favorite-1",
    userId: "user-1",
    favoritableType: "event",
    favoritableId: "event-1",
    createdAt: new Date("2024-01-01"),
    ...overrides,
  };
}
