import { describe, it, expect } from "vitest";
import { getCloseCountdown } from "@/lib/utils/date";

const now = new Date("2026-10-19T10:00:00Z");
const at = (ms: number) => new Date(now.getTime() + ms);

describe("getCloseCountdown", () => {
  it("reports closed when the close date has passed", () => {
    expect(getCloseCountdown(at(-1), now)).toEqual({ label: "PO sudah tutup", urgent: false, closed: true });
  });

  it("uses minutes (rounded up) under an hour and marks urgent", () => {
    expect(getCloseCountdown(at(10 * 60_000 + 1), now)).toMatchObject({ label: "Tutup dalam 11 menit", urgent: true });
    expect(getCloseCountdown(at(5_000), now).label).toBe("Tutup dalam 1 menit");
  });

  it("uses whole hours under a day", () => {
    expect(getCloseCountdown(at(5.5 * 3_600_000), now)).toMatchObject({ label: "Tutup dalam 5 jam", urgent: true });
  });

  it("uses whole days from one day on", () => {
    expect(getCloseCountdown(at(3 * 86_400_000 + 3_600_000), now)).toMatchObject({
      label: "Tutup dalam 3 hari",
      urgent: false,
    });
  });
});
