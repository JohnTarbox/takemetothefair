import { describe, it, expect } from "vitest";
import {
  createSlug,
  formatDate,
  formatDateRange,
  formatPrice,
  truncate,
  safeParseDate,
  isValidDate,
} from "../utils";

describe("createSlug", () => {
  it("converts text to lowercase slug", () => {
    expect(createSlug("Hello World")).toBe("hello-world");
  });

  it("removes special characters", () => {
    expect(createSlug("Test! Event @ Fair")).toBe("test-event-fair");
  });

  it("trims whitespace", () => {
    expect(createSlug("  Hello World  ")).toBe("hello-world");
  });

  it("handles multiple spaces", () => {
    expect(createSlug("Hello    World")).toBe("hello-world");
  });

  it("handles empty string", () => {
    expect(createSlug("")).toBe("");
  });

  it("handles accented characters", () => {
    expect(createSlug("Café René")).toBe("cafe-rene");
  });
});

describe("formatDate", () => {
  it("formats Date object correctly", () => {
    // Use explicit time to avoid timezone issues
    const date = new Date(2024, 5, 15); // June 15, 2024 (months are 0-indexed)
    const result = formatDate(date);
    expect(result).toContain("Jun");
    expect(result).toContain("15");
    expect(result).toContain("2024");
  });

  it("formats date string correctly", () => {
    // Use ISO string with explicit time
    const result = formatDate("2024-12-25T12:00:00");
    expect(result).toContain("Dec");
    expect(result).toContain("25");
    expect(result).toContain("2024");
  });

  it("includes weekday in output", () => {
    // June 15, 2024 is a Saturday - use local date construction
    const date = new Date(2024, 5, 15); // June 15, 2024
    const result = formatDate(date);
    expect(result).toContain("Sat");
  });

  it("returns formatted string with expected parts", () => {
    const date = new Date(2024, 0, 1); // Jan 1, 2024
    const result = formatDate(date);
    // Should contain weekday, month, day, and year
    expect(result).toMatch(/\w+,\s+\w+\s+\d+,\s+\d{4}/);
  });
});

describe("formatDateRange", () => {
  it("returns single date format when start equals end", () => {
    const start = new Date(2024, 5, 15); // June 15, 2024
    const end = new Date(2024, 5, 15);
    const result = formatDateRange(start, end);
    expect(result).not.toContain(" - ");
  });

  it("returns range format when dates differ", () => {
    const start = new Date(2024, 5, 15); // June 15, 2024
    const end = new Date(2024, 5, 17); // June 17, 2024
    const result = formatDateRange(start, end);
    expect(result).toContain(" - ");
    expect(result).toContain("15");
    expect(result).toContain("17");
  });

  it("handles string inputs with explicit times", () => {
    const result = formatDateRange("2024-06-15T12:00:00", "2024-06-17T12:00:00");
    expect(result).toContain(" - ");
  });

  it("shows just one date when both dates are the same day", () => {
    const date = new Date(2024, 5, 15);
    const result = formatDateRange(date, date);
    // Should be a single date, not a range
    const dashCount = (result.match(/ - /g) || []).length;
    expect(dashCount).toBe(0);
  });
});

describe("formatPrice", () => {
  it('returns "Free" when no prices provided', () => {
    expect(formatPrice()).toBe("Free");
    expect(formatPrice(null, null)).toBe("Free");
    expect(formatPrice(undefined, undefined)).toBe("Free");
  });

  it("returns single price when min equals max", () => {
    expect(formatPrice(10, 10)).toBe("$10");
  });

  it("returns single price when only min provided", () => {
    expect(formatPrice(15)).toBe("$15");
    expect(formatPrice(15, null)).toBe("$15");
  });

  it('returns "Up to" format when only max provided', () => {
    expect(formatPrice(null, 25)).toBe("Up to $25");
    expect(formatPrice(undefined, 25)).toBe("Up to $25");
  });

  it("returns range format when both min and max differ", () => {
    expect(formatPrice(10, 25)).toBe("$10 - $25");
  });

  it("handles zero values correctly", () => {
    expect(formatPrice(0, 10)).toBe("Up to $10");
    expect(formatPrice(0, 0)).toBe("Free");
  });
});

describe("truncate", () => {
  it("returns original text when shorter than length", () => {
    expect(truncate("Hello", 10)).toBe("Hello");
  });

  it("returns original text when equal to length", () => {
    expect(truncate("Hello", 5)).toBe("Hello");
  });

  it("truncates and adds ellipsis when text is longer", () => {
    expect(truncate("Hello World", 5)).toBe("Hello...");
  });

  it("trims whitespace before adding ellipsis", () => {
    expect(truncate("Hello World", 6)).toBe("Hello...");
  });

  it("handles empty string", () => {
    expect(truncate("", 5)).toBe("");
  });
});

describe("safeParseDate", () => {
  it("returns Date for valid Date object", () => {
    const date = new Date("2024-06-15");
    const result = safeParseDate(date);
    expect(result).toBeInstanceOf(Date);
    expect(result?.getFullYear()).toBe(2024);
  });

  it("returns Date for valid date string", () => {
    const result = safeParseDate("2024-06-15");
    expect(result).toBeInstanceOf(Date);
    expect(result?.getMonth()).toBe(5); // June is month 5 (0-indexed)
  });

  it("returns Date for valid timestamp", () => {
    const timestamp = new Date("2024-06-15").getTime();
    const result = safeParseDate(timestamp);
    expect(result).toBeInstanceOf(Date);
  });

  it("returns null for invalid date string", () => {
    expect(safeParseDate("not-a-date")).toBeNull();
  });

  it("returns null for null input", () => {
    expect(safeParseDate(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(safeParseDate(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(safeParseDate("")).toBeNull();
  });
});

describe("isValidDate", () => {
  it("returns true for valid Date object", () => {
    expect(isValidDate(new Date("2024-06-15"))).toBe(true);
  });

  it("returns true for valid date string", () => {
    expect(isValidDate("2024-06-15")).toBe(true);
  });

  it("returns false for invalid date string", () => {
    expect(isValidDate("not-a-date")).toBe(false);
  });

  it("returns false for null", () => {
    expect(isValidDate(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isValidDate(undefined)).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isValidDate("")).toBe(false);
  });

  it("returns true for ISO date strings", () => {
    expect(isValidDate("2024-06-15T10:30:00Z")).toBe(true);
  });
});
