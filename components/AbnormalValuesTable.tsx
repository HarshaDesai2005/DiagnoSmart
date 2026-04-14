import { AbnormalValue } from "@/lib/types";

const statusStyles: Record<AbnormalValue["status"], string> = {
  low: "text-blue-700 bg-blue-50",
  normal: "text-green-700 bg-green-50",
  high: "text-orange-700 bg-orange-50",
  critical: "text-red-700 bg-red-50",
};

interface AbnormalValuesTableProps {
  values: AbnormalValue[];
  language: "en" | "hi";
}

export default function AbnormalValuesTable({ values, language }: AbnormalValuesTableProps) {
  if (values.length === 0) {
    return (
      <p className="text-sm text-gray-600">
        {language === "hi" ? "कोई असामान्य मान नहीं मिला।" : "No abnormal values were extracted."}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-green-100">
      <table className="w-full text-sm">
        <thead className="bg-green-50 text-left text-green-800">
          <tr>
            <th className="px-3 py-2">{language === "hi" ? "सूचक/टेस्ट" : "Marker/Test"}</th>
            <th className="px-3 py-2">{language === "hi" ? "वर्तमान मान" : "Observed"}</th>
            <th className="px-3 py-2">{language === "hi" ? "सामान्य सीमा" : "Reference"}</th>
            <th className="px-3 py-2">{language === "hi" ? "स्थिति" : "Status"}</th>
            <th className="px-3 py-2">{language === "hi" ? "टिप्पणी" : "Note"}</th>
          </tr>
        </thead>
        <tbody>
          {values.map((value) => (
            <tr key={`${value.marker}-${value.observedValue}`} className="border-t border-green-100">
              <td className="px-3 py-2 font-medium">{value.marker}</td>
              <td className="px-3 py-2">{value.observedValue}</td>
              <td className="px-3 py-2">{value.referenceRange}</td>
              <td className="px-3 py-2">
                <span className={`rounded px-2 py-1 text-xs font-semibold ${statusStyles[value.status]}`}>
                  {value.status.toUpperCase()}
                </span>
              </td>
              <td className="px-3 py-2">{value.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
