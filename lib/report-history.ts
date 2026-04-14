"use client";

import { ReportRecord } from "@/lib/types";

const MAX_HISTORY = 15;
let inMemoryHistory: ReportRecord[] = [];

export function loadHistory(): ReportRecord[] {
  return inMemoryHistory;
}

export function saveToHistory(record: ReportRecord): ReportRecord[] {
  const updated = [record, ...inMemoryHistory.filter((item) => item.id !== record.id)].slice(
    0,
    MAX_HISTORY
  );
  inMemoryHistory = updated;
  return updated;
}

export function clearHistory() {
  inMemoryHistory = [];
}
