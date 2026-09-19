import fs from "fs";
import path from "path";

const LOG_DIR = path.resolve(process.cwd(), "logs");

// Matches the header line written by createLogger()'s formatEntry(), e.g.:
// [2026-09-19T10:00:00.000Z] [ERROR] [action:orders] createPublicOrder failed
const HEADER_PATTERN = /^\[(.+?)\]\s+\[(\w+)\s*\]\s+\[(.+?)\]\s+(.*)$/;

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogRecord = {
  timestamp: string;
  level: LogLevel | "unknown";
  context: string;
  message: string;
  details?: string;
};

export function listLogFiles(): string[] {
  if (!fs.existsSync(LOG_DIR)) return [];
  return fs
    .readdirSync(LOG_DIR)
    .filter((f) => f.endsWith(".log"))
    .sort()
    .reverse();
}

export function parseLogContent(content: string): LogRecord[] {
  const lines = content.split("\n");
  const records: LogRecord[] = [];
  let current: LogRecord | null = null;

  for (const line of lines) {
    const match = line.match(HEADER_PATTERN);
    if (match) {
      if (current) records.push(current);
      const [, timestamp, level, context, message] = match;
      const normalizedLevel = level.trim().toLowerCase();
      current = {
        timestamp,
        level: isLogLevel(normalizedLevel) ? normalizedLevel : "unknown",
        context,
        message,
      };
    } else if (current && line.trim()) {
      current.details = current.details ? `${current.details}\n${line}` : line;
    }
  }
  if (current) records.push(current);

  return records;
}

export function filterLogRecords(
  records: LogRecord[],
  opts?: { level?: LogLevel; search?: string; limit?: number }
): LogRecord[] {
  let filtered = records;
  if (opts?.level) {
    filtered = filtered.filter((r) => r.level === opts.level);
  }
  if (opts?.search) {
    const q = opts.search.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.message.toLowerCase().includes(q) ||
        r.context.toLowerCase().includes(q) ||
        (r.details?.toLowerCase().includes(q) ?? false)
    );
  }

  const newestFirst = [...filtered].reverse();
  return opts?.limit ? newestFirst.slice(0, opts.limit) : newestFirst;
}

export function readLogRecords(
  filename: string,
  opts?: { level?: LogLevel; search?: string; limit?: number }
): LogRecord[] {
  // Allowlist against the real directory listing rather than trusting the
  // caller's filename directly — this value comes from a query param.
  if (!listLogFiles().includes(filename)) return [];

  const filePath = path.join(LOG_DIR, filename);
  const content = fs.readFileSync(filePath, "utf8");
  return filterLogRecords(parseLogContent(content), opts);
}

function isLogLevel(value: string): value is LogLevel {
  return value === "debug" || value === "info" || value === "warn" || value === "error";
}
