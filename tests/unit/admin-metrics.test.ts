import { describe, it, expect } from "vitest";
import { bucketByDay } from "@/lib/utils/admin-metrics";

describe("bucketByDay", () => {
  // Constructed from local-time components (not UTC ISO strings) so this test
  // is stable regardless of the machine/CI timezone it runs in — bucketByDay
  // buckets by local calendar day via date-fns.
  const today = new Date(2026, 8, 19, 12); // 2026-09-19 12:00 local

  it("returns one bucket per day covering the requested range, ending on today", () => {
    const result = bucketByDay([], 5, today);
    expect(result.map((r) => r.date)).toEqual([
      "2026-09-15",
      "2026-09-16",
      "2026-09-17",
      "2026-09-18",
      "2026-09-19",
    ]);
  });

  it("returns all-zero counts when there is no data", () => {
    const result = bucketByDay([], 3, today);
    expect(result.every((r) => r.count === 0)).toBe(true);
  });

  it("counts multiple events landing on the same day", () => {
    const dates = [
      new Date(2026, 8, 18, 1),
      new Date(2026, 8, 18, 23),
      new Date(2026, 8, 19, 0),
    ];
    const result = bucketByDay(dates, 3, today);
    const byDate = Object.fromEntries(result.map((r) => [r.date, r.count]));
    expect(byDate["2026-09-18"]).toBe(2);
    expect(byDate["2026-09-19"]).toBe(1);
    expect(byDate["2026-09-17"]).toBe(0);
  });

  it("ignores events outside the requested day range", () => {
    const dates = [new Date(2026, 8, 1, 0)]; // way before the 3-day window
    const result = bucketByDay(dates, 3, today);
    expect(result.every((r) => r.count === 0)).toBe(true);
  });
});
