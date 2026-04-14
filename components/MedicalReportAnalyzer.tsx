"use client";

import { useState } from "react";
import { Stethoscope } from "lucide-react";
import AnalysisSteps from "./AnalysisSteps";
import UploadCard from "./UploadCard";
import ResultsCard from "./ResultsCard";
import { AnalysisLanguage, ReportRecord } from "@/lib/types";
import { exportReportPdf } from "@/lib/pdf-export";
import { useToast } from "@/hooks/use-toast";

export default function MedicalReportAnalyzer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [language, setLanguage] = useState<AnalysisLanguage>("en");
  const [currentRecord, setCurrentRecord] = useState<ReportRecord | null>(null);
  const { toast } = useToast();

  const handleAnalyzeSuccess = (record: ReportRecord) => {
    setCurrentRecord(record);
  };

  const handleExportPdf = async (record: ReportRecord) => {
    try {
      await exportReportPdf(record);
      toast({
        title: "PDF exported",
        description: "Doctor-ready PDF summary has been downloaded.",
      });
    } catch {
      toast({
        title: "Export failed",
        description: "Unable to export PDF for this report.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="relative mx-auto mb-10 max-w-3xl overflow-hidden rounded-3xl border border-emerald-100 bg-white/80 p-8 text-emerald-800 shadow-xl backdrop-blur">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="relative mb-4 flex items-center justify-center">
          <div className="mr-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 p-3 shadow-lg">
            <Stethoscope className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-4xl font-black tracking-tight">DiagnoSmart AI</h1>
        </div>
        <p className="mb-5 text-center text-sm text-slate-600 md:text-base">
          Intelligent medical report insights with multilingual analysis, voice narration, and polished doctor-ready exports.
        </p>
        <AnalysisSteps />
      </div>

      <UploadCard
        isAnalyzing={isAnalyzing}
        language={language}
        setLanguage={setLanguage}
        onAnalyzeSuccess={handleAnalyzeSuccess}
        setIsAnalyzing={setIsAnalyzing}
      />

      {currentRecord && <ResultsCard record={currentRecord} onExportPdf={handleExportPdf} />}
    </div>
  );
}
