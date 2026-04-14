"use client";

import { useState, useCallback } from "react";
import { Activity, FileText, Languages, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AnalysisLanguage, ReportRecord } from "@/lib/types";

interface UploadCardProps {
  isAnalyzing: boolean;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  language: AnalysisLanguage;
  setLanguage: (language: AnalysisLanguage) => void;
  onAnalyzeSuccess: (record: ReportRecord) => void;
}

export default function UploadCard({
  isAnalyzing,
  setIsAnalyzing,
  language,
  setLanguage,
  onAnalyzeSuccess,
}: UploadCardProps) {
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        setFile(selectedFile);
      }
    },
    []
  );

  const removeFile = useCallback(() => {
    setFile(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (file) {
      setIsAnalyzing(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("language", language);

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "File upload failed");
        }

        toast({
          title: "File processed successfully",
          description: "Your medical report has been analyzed.",
        });
        const record: ReportRecord = {
          id: result.requestId ?? window.crypto.randomUUID(),
          fileName: file.name,
          createdAt: new Date().toISOString(),
          language,
          report: result.report.structured,
        };
        onAnalyzeSuccess(record);
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "There was a problem processing your file.",
          variant: "destructive",
        });
      } finally {
        setIsAnalyzing(false);
      }
    } else {
      toast({
        title: "File missing",
        description: "Please select a medical report to analyze.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card className="mx-auto mb-10 max-w-3xl rounded-3xl border border-emerald-100 bg-white/90 shadow-2xl">
        <CardHeader className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-cyan-50">
          <CardTitle className="text-xl text-emerald-800 md:text-2xl">
            Upload Your Medical Report
          </CardTitle>
          <CardDescription className="text-slate-600">
            Upload your medical report and choose language for the explanation
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <form onSubmit={handleSubmit}>
            <div className="mb-5 flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
              <p className="flex items-center text-sm font-medium text-emerald-800">
                <Languages className="mr-2 h-4 w-4 text-emerald-700" />
                Output Language
              </p>
              <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={language === "en" ? "default" : "outline"}
                onClick={() => setLanguage("en")}
                className="h-9 rounded-xl"
              >
                English
              </Button>
              <Button
                type="button"
                variant={language === "hi" ? "default" : "outline"}
                onClick={() => setLanguage("hi")}
                className="h-9 rounded-xl"
              >
                Hindi
              </Button>
              </div>
            </div>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => document.getElementById("file-upload")?.click()}
              className="group cursor-pointer rounded-2xl border-2 border-dashed border-emerald-200 bg-gradient-to-b from-white to-emerald-50/50 p-10 text-center transition-all hover:border-cyan-400 hover:shadow-lg"
            >
              {file ? (
                <div className="flex items-center justify-center space-x-2">
                  <FileText className="h-8 w-8 text-emerald-600" />
                  <span className="font-medium text-emerald-800">
                    {file.name}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-emerald-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile();
                    }}
                  >
                    <X className="h-4 w-4 text-emerald-700" />
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto mb-4 h-9 w-9 text-emerald-500 transition-transform group-hover:scale-110" />
                  <p className="flex flex-col text-base font-medium text-slate-700">
                    Drag and drop files here, or click to select files.
                    <span className="text-slate-600">
                      You can upload a file up to 15 MB.
                    </span>
                    <span className="mt-1 text-sm text-slate-500">
                      Supported file types: PDF, JPEG, PNG.
                    </span>
                  </p>
                </>
              )}
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.png,.jpeg"
                id="file-upload"
                onChange={handleFileChange}
              />
            </div>

            {/* Tooltip for better file quality */}
            <div className="relative mt-3">
              <span className="mt-1 text-sm text-slate-500">
                For better analysis, please upload clear and high-quality files.
                Avoid blurry or incomplete documents.
              </span>
            </div>

            <Button
              className="mt-6 h-12 w-full rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-lg hover:from-emerald-700 hover:to-cyan-700"
              disabled={isAnalyzing || !file}
            >
              {isAnalyzing ? (
                <>
                  <Activity className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Analyze Report
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
