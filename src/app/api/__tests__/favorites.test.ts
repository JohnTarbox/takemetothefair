import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock the auth module
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock the favorites module
vi.mock("@/lib/favorites", () => ({
  toggleFavorite: vi.fn(),
}));

// Import after mocks are set up
import { POST } from "../favorites/route";
import { auth } from "@/lib/auth";
import { toggleFavorite } from "@/lib/favorites";

const mockAuth = vi.mocked(auth);
const mockToggleFavorite = vi.mocked(toggleFavorite);

describe("POST /api/favorites", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/favorites", {
      method: "POST",
      body: JSON.stringify({ type: "event", id: "event-1" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 400 when type is missing", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", email: "test@example.com", role: "USER" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    });

    const request = new NextRequest("http://localhost:3000/api/favorites", {
      method: "POST",
      body: JSON.stringify({ id: "event-1" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing type or id");
  });

  it("returns 400 when id is missing", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", email: "test@example.com", role: "USER" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    });

    const request = new NextRequest("http://localhost:3000/api/favorites", {
      method: "POST",
      body: JSON.stringify({ type: "event" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing type or id");
  });

  it("returns 400 for invalid type", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", email: "test@example.com", role: "USER" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    });

    const request = new NextRequest("http://localhost:3000/api/favorites", {
      method: "POST",
      body: JSON.stringify({ type: "invalid", id: "event-1" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid type. Must be event, venue, or vendor");
  });

  it("successfully toggles favorite for event", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", email: "test@example.com", role: "USER" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    });
    mockToggleFavorite.mockResolvedValue({ isFavorited: true });

    const request = new NextRequest("http://localhost:3000/api/favorites", {
      method: "POST",
      body: JSON.stringify({ type: "event", id: "event-1" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.isFavorited).toBe(true);
    expect(mockToggleFavorite).toHaveBeenCalledWith("user-1", "event", "event-1");
  });

  it("successfully toggles favorite for venue", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", email: "test@example.com", role: "USER" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    });
    mockToggleFavorite.mockResolvedValue({ isFavorited: false });

    const request = new NextRequest("http://localhost:3000/api/favorites", {
      method: "POST",
      body: JSON.stringify({ type: "venue", id: "venue-1" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.isFavorited).toBe(false);
    expect(mockToggleFavorite).toHaveBeenCalledWith("user-1", "venue", "venue-1");
  });

  it("successfully toggles favorite for vendor", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", email: "test@example.com", role: "USER" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    });
    mockToggleFavorite.mockResolvedValue({ isFavorited: true });

    const request = new NextRequest("http://localhost:3000/api/favorites", {
      method: "POST",
      body: JSON.stringify({ type: "vendor", id: "vendor-1" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.isFavorited).toBe(true);
    expect(mockToggleFavorite).toHaveBeenCalledWith("user-1", "vendor", "vendor-1");
  });

  it("returns 500 when database error occurs", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", email: "test@example.com", role: "USER" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    });
    mockToggleFavorite.mockRejectedValue(new Error("Database error"));

    const request = new NextRequest("http://localhost:3000/api/favorites", {
      method: "POST",
      body: JSON.stringify({ type: "event", id: "event-1" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to toggle favorite");
  });
});
