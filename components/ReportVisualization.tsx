"use client";

import React, { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AbnormalValue, MarkerStatus } from "@/lib/types";

const statusColor: Record<MarkerStatus, string> = {
  low: "#2563eb",
  normal: "#16a34a",
  high: "#f97316",
  critical: "#dc2626",
};

function statusLabel(status: MarkerStatus, language: "en" | "hi") {
  if (language === "hi") {
    if (status === "low") return "कम";
    if (status === "normal") return "सामान्य";
    if (status === "high") return "अधिक";
    return "गंभीर";
  }
  return status.toUpperCase();
}

function toChartScore(status: MarkerStatus) {
  if (status === "critical") return 4;
  if (status === "high" || status === "low") return 3;
  return 1;
}

function barColor(status: MarkerStatus) {
  return statusColor[status];
}

interface ReportVisualizationProps {
  values: AbnormalValue[];
  language: "en" | "hi";
}

export default function ReportVisualization({ values, language }: ReportVisualizationProps) {
  const { summary, data } = useMemo(() => {
    const summaryCounts: Record<MarkerStatus, number> = {
      low: 0,
      normal: 0,
      high: 0,
      critical: 0,
    };

    values.forEach((v) => {
      summaryCounts[v.status] += 1;
    });

    const chartData = values.map((v) => ({
      marker: v.marker,
      status: v.status,
      score: toChartScore(v.status),
      observed: v.observedValue,
      reference: v.referenceRange,
      note: v.note,
    }));

    return { summary: summaryCounts, data: chartData };
  }, [values]);

  if (values.length === 0) {
    return null;
  }

  const labels =
    language === "hi"
      ? {
          title: "विज़ुअल सारांश",
          subtitle: "असामान्य/महत्वपूर्ण मानों का त्वरित दृश्य",
          low: "कम",
          normal: "सामान्य",
          high: "अधिक",
          critical: "गंभीर",
        }
      : {
          title: "Visual Summary",
          subtitle: "Quick view of extracted markers and their status",
          low: "LOW",
          normal: "NORMAL",
          high: "HIGH",
          critical: "CRITICAL",
        };

  const pill = (status: MarkerStatus, text: string) => (
    <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-white px-3 py-2 shadow-sm">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: statusColor[status] }}
      />
      <span className="text-xs font-semibold text-slate-700">{text}</span>
      <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
        {summary[status]}
      </span>
    </div>
  );

  return (
    <div className="rounded-3xl border border-emerald-100 bg-white/95 p-5 shadow-xl">
      <div className="mb-4">
        <h3 className="text-lg font-extrabold tracking-tight text-emerald-900">
          {labels.title}
        </h3>
        <p className="text-sm text-slate-600">{labels.subtitle}</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {pill("critical", labels.critical)}
        {pill("high", labels.high)}
        {pill("low", labels.low)}
        {pill("normal", labels.normal)}
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" domain={[0, 4]} tick={{ fill: "#64748b", fontSize: 12 }} />
            <YAxis
              type="category"
              dataKey="marker"
              width={language === "hi" ? 200 : 160}
              tick={{ fill: "#0f172a", fontSize: 12 }}
              tickFormatter={(value) => {
                const text = String(value);
                return text.length > 22 ? `${text.slice(0, 22)}…` : text;
              }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                boxShadow: "0 10px 30px rgba(2,6,23,0.12)",
              }}
              formatter={(_, __, props) => {
                const p = props?.payload as (typeof data)[number] | undefined;
                if (!p) return [];
                return [
                  `${statusLabel(p.status as MarkerStatus, language)} | ${p.observed} (Ref: ${p.reference})`,
                  "Status",
                ];
              }}
              labelFormatter={(label) => String(label)}
            />
            <Bar
              dataKey="score"
              radius={[10, 10, 10, 10]}
              isAnimationActive={true}
              fill="#10b981"
              shape={(props) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const p: any = props;
                const payload = p.payload as { status: MarkerStatus } | undefined;
                const fill = payload ? barColor(payload.status) : "#10b981";
                return (
                  <rect
                    x={p.x}
                    y={p.y}
                    width={p.width}
                    height={p.height}
                    rx={10}
                    ry={10}
                    fill={fill}
                  />
                );
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        {language === "hi"
          ? "नोट: यह विज़ुअल सारांश रिपोर्ट से निकाले गए मानों पर आधारित है।"
          : "Note: This visualization is based on extracted values from the report."}
      </p>
    </div>
  );
}

