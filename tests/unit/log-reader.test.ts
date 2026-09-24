import { describe, it, expect } from "vitest";
import { parseLogContent, filterLogRecords } from "@/lib/utils/log-reader";

// Fixture mirrors the exact output shape of createLogger()'s formatEntry()
// in src/lib/logger.ts: a header line, optionally followed by 4-space
// indented "data:" or stack-trace continuation lines.
const SAMPLE_LOG = `[2026-09-19T10:00:00.000Z] [DEBUG] [action:auth] called
[2026-09-19T10:00:01.000Z] [ERROR] [action:orders] createPublicOrder failed
    Error: Produk tidak ditemukan
        at createPublicOrder (/app/src/actions/orders.ts:127:19)
[2026-09-19T10:00:02.000Z] [WARN ] [route:export/csv] CSV export failed
    data: {
      "type": "production"
    }
[2026-09-19T10:00:03.000Z] [INFO ] [action:store] createOrUpdateStore ok
`;

describe("parseLogContent", () => {
  it("parses each header line into a record", () => {
    const records = parseLogContent(SAMPLE_LOG);
    expect(records).toHaveLength(4);
    expect(records[0]).toMatchObject({
      level: "debug",
      context: "action:auth",
      message: "called",
    });
  });

  it("attaches indented continuation lines to the preceding record as details", () => {
    const records = parseLogContent(SAMPLE_LOG);
    const errorRecord = records.find((r) => r.context === "action:orders");
    expect(errorRecord?.details).toContain("Error: Produk tidak ditemukan");
    expect(errorRecord?.details).toContain("at createPublicOrder");
  });

  it("handles the padded level format ('[WARN ]') the same as unpadded ('[INFO]')", () => {
    const records = parseLogContent(SAMPLE_LOG);
    const warnRecord = records.find((r) => r.context === "route:export/csv");
    expect(warnRecord?.level).toBe("warn");
    const infoRecord = records.find((r) => r.context === "action:store");
    expect(infoRecord?.level).toBe("info");
  });

  it("returns an empty array for empty content", () => {
    expect(parseLogContent("")).toEqual([]);
  });
});

describe("filterLogRecords", () => {
  const records = parseLogContent(SAMPLE_LOG);

  it("returns records newest-first by default", () => {
    const result = filterLogRecords(records);
    expect(result[0].context).toBe("action:store");
    expect(result[result.length - 1].context).toBe("action:auth");
  });

  it("filters by level", () => {
    const result = filterLogRecords(records, { level: "error" });
    expect(result).toHaveLength(1);
    expect(result[0].context).toBe("action:orders");
  });

  it("filters by a case-insensitive search across message/context/details", () => {
    const byMessage = filterLogRecords(records, { search: "createpublicorder" });
    expect(byMessage).toHaveLength(1);

    const byDetails = filterLogRecords(records, { search: "produk tidak ditemukan" });
    expect(byDetails).toHaveLength(1);
    expect(byDetails[0].context).toBe("action:orders");
  });

  it("respects a limit after filtering", () => {
    const result = filterLogRecords(records, { limit: 2 });
    expect(result).toHaveLength(2);
  });
});
