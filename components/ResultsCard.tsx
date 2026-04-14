"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Heart,
  AlertCircle,
  Stethoscope,
  ClipboardList,
  FileDown,
  Volume2,
  Pause,
  Square,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { ReportRecord } from "@/lib/types";
import AbnormalValuesTable from "@/components/AbnormalValuesTable";
import ReportVisualization from "@/components/ReportVisualization";

interface ResultsCardProps {
  record: ReportRecord;
  onExportPdf: (record: ReportRecord) => void | Promise<void>;
}

export default function ResultsCard({ record, onExportPdf }: ResultsCardProps) {
  const report = record.report;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voicesReady, setVoicesReady] = useState(false);
  const stopRequestedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const labels = useMemo(
    () =>
      report.language === "hi"
        ? {
            title: "मेडिकल रिपोर्ट विश्लेषण",
            file: "फ़ाइल",
            generated: "समय",
            readAloud: "आवाज़ में सुनें",
            pause: "रोकें",
            resume: "फिर शुरू करें",
            stop: "बंद करें",
            speed: "गति",
            ttsHelp: "Hindi read aloud Google Translate voice के जरिए चलाया जाता है।",
            ttsUnsupported: "आपका ब्राउज़र Text-to-Speech सपोर्ट नहीं करता।",
            abnormalValues: "असामान्य मान",
            detailedAnalysis: "विस्तृत विश्लेषण",
            urgentRedFlags: "तत्काल चेतावनी संकेत",
            exportPdf: "डॉक्टर-रेडी PDF निर्यात करें",
          }
        : {
            title: "Medical Report Analysis",
            file: "File",
            generated: "Generated",
            readAloud: "Read Aloud",
            pause: "Pause",
            resume: "Resume",
            stop: "Stop",
            speed: "Speed",
            ttsHelp: "Text-to-speech uses your browser voices and automatically selects language.",
            ttsUnsupported: "Your browser does not support Text-to-Speech.",
            abnormalValues: "Abnormal Values",
            detailedAnalysis: "Detailed Analysis",
            urgentRedFlags: "Urgent Red Flags",
            exportPdf: "Export Doctor-ready PDF",
          },
    [report.language]
  );

  const ttsText = useMemo(() => {
    const recommendations = report.recommendations.length
      ? report.recommendations.map((item) => `- ${item}`).join("\n")
      : "No recommendations extracted.";

    return [
      report.overview,
      report.simplifiedExplanation,
      report.healthStatus,
      report.implications,
      recommendations,
      report.disclaimer,
    ]
      .filter(Boolean)
      .join("\n\n");
  }, [
    report.disclaimer,
    report.healthStatus,
    report.implications,
    report.overview,
    report.recommendations,
    report.simplifiedExplanation,
  ]);

  useEffect(() => {
    setSpeechSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          setVoicesReady(true);
        }
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const getLangCode = () => {
    if (report.language === "hi") {
      return "hi-IN";
    }
    return "en-US";
  };

  const speakViaGoogleHindi = async () => {
    const chunks = ttsText.match(/[\s\S]{1,180}/g) ?? [ttsText];
    setIsSpeaking(true);
    setIsPaused(false);
    for (const chunk of chunks) {
      if (stopRequestedRef.current) {
        break;
      }
      const audio = new Audio(`/api/tts?lang=hi&text=${encodeURIComponent(chunk)}`);
      audioRef.current = audio;
      await new Promise<void>((resolve) => {
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
        audio.play().catch(() => resolve());
      });
    }
    setIsSpeaking(false);
    setIsPaused(false);
  };

  const speakAnalysis = () => {
    if (!ttsText.trim()) {
      return;
    }

    if (report.language === "hi") {
      stopRequestedRef.current = false;
      void speakViaGoogleHindi();
      return;
    }
    if (!speechSupported) {
      return;
    }

    stopRequestedRef.current = false;
    window.speechSynthesis.cancel();
    const chunks = ttsText.match(/[\s\S]{1,250}/g) ?? [ttsText];
    let chunkIndex = 0;

    const speakNextChunk = () => {
      if (chunkIndex >= chunks.length) {
        setIsSpeaking(false);
        setIsPaused(false);
        return;
      }
      if (stopRequestedRef.current) {
        setIsSpeaking(false);
        setIsPaused(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunks[chunkIndex]);
      utterance.lang = getLangCode();
      utterance.rate = speed;

      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find((voice) =>
        voice.lang.toLowerCase().startsWith(utterance.lang.split("-")[0].toLowerCase())
      );
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
      };
      utterance.onend = () => {
        if (stopRequestedRef.current) {
          setIsSpeaking(false);
          setIsPaused(false);
          return;
        }
        chunkIndex += 1;
        speakNextChunk();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };

      window.speechSynthesis.speak(utterance);
    };

    speakNextChunk();
  };

  const pauseOrResume = () => {
    if (audioRef.current) {
      if (isPaused) {
        void audioRef.current.play();
        setIsPaused(false);
      } else {
        audioRef.current.pause();
        setIsPaused(true);
      }
      return;
    }
    if (!("speechSynthesis" in window)) {
      return;
    }
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      return;
    }
    window.speechSynthesis.pause();
    setIsPaused(true);
  };

  const stopSpeech = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    stopRequestedRef.current = true;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-8">
      <Card className="overflow-hidden rounded-3xl border border-emerald-100 bg-white/95 shadow-2xl">
        <CardHeader className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-cyan-50 p-7">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center space-x-4">
              <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 p-2 shadow-md">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl font-extrabold tracking-tight text-emerald-900">
                {labels.title}
              </CardTitle>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm">
              {record.language === "hi" ? "Hindi" : "English"}
            </span>
          </div>
          <p className="text-sm text-slate-600">
            {labels.file}: <strong>{record.fileName}</strong> | {labels.generated}:{" "}
            {new Date(record.createdAt).toLocaleString()}
          </p>
        </CardHeader>

        <CardContent className="space-y-8 p-7">
          <section className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-white to-emerald-50/40 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={speakAnalysis}
                disabled={!ttsText.trim()}
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white hover:from-emerald-700 hover:to-cyan-700"
              >
                <Volume2 className="mr-2 h-4 w-4" />
                {labels.readAloud}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={pauseOrResume}
                disabled={!isSpeaking}
                className="rounded-xl border-emerald-200 hover:bg-emerald-50"
              >
                <Pause className="mr-2 h-4 w-4" />
                {isPaused ? labels.resume : labels.pause}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={stopSpeech}
                disabled={!isSpeaking}
                className="rounded-xl border-emerald-200 hover:bg-emerald-50"
              >
                <Square className="mr-2 h-4 w-4" />
                {labels.stop}
              </Button>
              <label className="ml-auto flex items-center gap-2 text-sm text-slate-700">
                {labels.speed}
                <input
                  type="range"
                  min="0.7"
                  max="1.3"
                  step="0.1"
                  value={speed}
                  onChange={(event) => setSpeed(Number(event.target.value))}
                />
                <span className="w-8 text-right">{speed.toFixed(1)}x</span>
              </label>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {labels.ttsHelp}
            </p>
            {!speechSupported && (
              <p className="mt-1 text-xs text-red-600">
                {labels.ttsUnsupported}
              </p>
            )}
          </section>

          <section>
            <h2 className="mb-5 flex items-center text-xl font-bold text-emerald-900">
              <ClipboardList className="mr-3 h-6 w-6 text-emerald-600" />
              {labels.abnormalValues}
            </h2>
            <AbnormalValuesTable values={report.abnormalValues} language={report.language} />
          </section>

          <Separator className="my-6 bg-emerald-200" />

          <section>
            <ReportVisualization values={report.abnormalValues} language={report.language} />
          </section>

          <Separator className="my-6 bg-emerald-200" />

          <section>
            <h2 className="mb-5 flex items-center text-xl font-bold text-emerald-900">
              <Heart className="mr-3 h-6 w-6 text-emerald-600" />
              {labels.detailedAnalysis}
            </h2>
            <div className="prose max-w-full space-y-4 text-slate-700 prose-headings:text-emerald-800 prose-strong:text-slate-900">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                }}
              >
                {report.analysisMarkdown}
              </ReactMarkdown>
            </div>
          </section>

          {report.redFlags.length > 0 && (
            <section className="rounded-lg border border-red-200 bg-red-50 p-4">
              <h3 className="mb-2 flex items-center text-base font-semibold text-red-700">
                <AlertCircle className="mr-2 h-4 w-4" />
                {labels.urgentRedFlags}
              </h3>
              <ul className="list-disc space-y-1 pl-6 text-sm text-red-700">
                {report.redFlags.map((flag) => (
                  <li key={flag}>{flag}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
            <p>{report.disclaimer}</p>
          </section>

          <Button
            type="button"
            className="h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white hover:from-emerald-700 hover:to-cyan-700"
            onClick={() => onExportPdf(record)}
          >
            <FileDown className="mr-2 h-4 w-4" />
            {labels.exportPdf}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
