import { FileUp, Search, Clipboard, Zap } from "lucide-react";

const steps = [
  { icon: FileUp, label: "Upload" },
  { icon: Search, label: "Analyze" },
  { icon: Clipboard, label: "Results" },
  { icon: Zap, label: "Action" },
];

export default function AnalysisSteps() {
  return (
    <div className="mx-auto flex w-full max-w-3xl items-center justify-center rounded-2xl border border-emerald-100 bg-white/80 px-3 py-4 shadow-sm backdrop-blur">
      {steps.map((step, index) => (
        <div key={step.label} className="flex items-center">
          <div className="mx-4 flex flex-col items-center">
            <div className="mb-2 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 p-2.5 shadow-md">
              <step.icon className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700 md:text-sm">
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className="mx-2 h-0.5 w-8 bg-gradient-to-r from-emerald-300 to-cyan-300 md:w-16" />
          )}
        </div>
      ))}
    </div>
  );
}
