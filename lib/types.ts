export type AnalysisLanguage = "en" | "hi";

export type MarkerStatus = "low" | "normal" | "high" | "critical";

export interface AbnormalValue {
  marker: string;
  observedValue: string;
  referenceRange: string;
  status: MarkerStatus;
  note: string;
}

export interface StructuredReport {
  title: string;
  language: AnalysisLanguage;
  generatedAt: string;
  overview: string;
  simplifiedExplanation: string;
  healthStatus: string;
  implications: string;
  recommendations: string[];
  redFlags: string[];
  disclaimer: string;
  abnormalValues: AbnormalValue[];
  analysisMarkdown: string;
  originalDocument: string;
}

export interface ReportRecord {
  id: string;
  fileName: string;
  createdAt: string;
  language: AnalysisLanguage;
  report: StructuredReport;
}
