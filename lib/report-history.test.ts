import { describe, expect, it, beforeEach } from "vitest";
import { clearHistory, loadHistory, saveToHistory } from "@/lib/report-history";
import { ReportRecord } from "@/lib/types";

function buildRecord(id: string): ReportRecord {
  return {
    id,
    fileName: `report-${id}.pdf`,
    createdAt: new Date().toISOString(),
    language: "en",
    report: {
      title: "Medical Report Analysis",
      language: "en",
      generatedAt: new Date().toISOString(),
      overview: "Overview",
      simplifiedExplanation: "Explanation",
      healthStatus: "Status",
      implications: "Implications",
      recommendations: ["Hydrate"],
      redFlags: [],
      disclaimer: "Disclaimer",
      abnormalValues: [],
      analysisMarkdown: "## Report Overview\nOverview",
      originalDocument: "doc",
    },
  };
}

describe("report history", () => {
  beforeEach(() => {
    clearHistory();
  });

  it("loads empty history by default", () => {
    expect(loadHistory()).toEqual([]);
  });

  it("saves newest item first", () => {
    saveToHistory(buildRecord("1"));
    const updated = saveToHistory(buildRecord("2"));
    expect(updated[0].id).toBe("2");
    expect(updated[1].id).toBe("1");
  });
});
