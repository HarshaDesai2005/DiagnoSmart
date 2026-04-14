import { ReportRecord } from "@/lib/types";

interface ReportComparisonProps {
  left: ReportRecord;
  right: ReportRecord;
}

function toMap(record: ReportRecord) {
  return new Map(record.report.abnormalValues.map((value) => [value.marker.toLowerCase(), value]));
}

export default function ReportComparison({ left, right }: ReportComparisonProps) {
  const leftMap = toMap(left);
  const rightMap = toMap(right);
  const markers = Array.from(new Set([...leftMap.keys(), ...rightMap.keys()])).sort();

  return (
    <div className="rounded-xl border border-green-100 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-green-800">Report Comparison</h3>
      <p className="mb-3 text-sm text-gray-600">
        Comparing <strong>{left.fileName}</strong> with <strong>{right.fileName}</strong>
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-green-50 text-green-800">
            <tr>
              <th className="px-3 py-2 text-left">Marker</th>
              <th className="px-3 py-2 text-left">Earlier</th>
              <th className="px-3 py-2 text-left">Latest</th>
              <th className="px-3 py-2 text-left">Change</th>
            </tr>
          </thead>
          <tbody>
            {markers.map((marker) => {
              const prev = leftMap.get(marker);
              const next = rightMap.get(marker);
              return (
                <tr key={marker} className="border-t border-green-100">
                  <td className="px-3 py-2 font-medium">{prev?.marker ?? next?.marker}</td>
                  <td className="px-3 py-2">
                    {prev ? `${prev.observedValue} (${prev.status})` : "Not available"}
                  </td>
                  <td className="px-3 py-2">
                    {next ? `${next.observedValue} (${next.status})` : "Not available"}
                  </td>
                  <td className="px-3 py-2">
                    {!prev || !next
                      ? "New/Missing"
                      : prev.status === next.status
                        ? "No status change"
                        : `${prev.status} -> ${next.status}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
