"use client";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { ReportRecord } from "@/lib/types";

export async function exportReportPdf(record: ReportRecord) {
  const labels =
    record.language === "hi"
      ? {
          title: "डॉक्टर-रेडी रिपोर्ट सारांश",
          generated: "समय",
          file: "फ़ाइल",
          language: "भाषा",
          overview: "रिपोर्ट का सारांश",
          status: "स्वास्थ्य स्थिति",
          recommendations: "सुझाव",
          disclaimer: "अस्वीकरण",
        }
      : {
          title: "Doctor-ready Report Summary",
          generated: "Generated",
          file: "File",
          language: "Language",
          overview: "Overview",
          status: "Health Status",
          recommendations: "Recommendations",
          disclaimer: "Disclaimer",
        };

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "0";
  container.style.width = "794px";
  container.style.padding = "32px";
  container.style.fontFamily = "Arial, sans-serif";
  container.style.background = "#ffffff";
  container.style.color = "#111827";
  container.style.lineHeight = "1.5";
  container.innerHTML = `
    <h1 style="font-size:24px;margin:0 0 12px;">${labels.title}</h1>
    <p><strong>${labels.generated}:</strong> ${new Date(record.createdAt).toLocaleString()}</p>
    <p><strong>${labels.file}:</strong> ${record.fileName}</p>
    <p><strong>${labels.language}:</strong> ${record.language === "hi" ? "Hindi" : "English"}</p>
    <h2 style="margin-top:18px;">${labels.overview}</h2>
    <p>${record.report.overview || ""}</p>
    <h2 style="margin-top:18px;">${labels.status}</h2>
    <p>${record.report.healthStatus || ""}</p>
    <h2 style="margin-top:18px;">${labels.recommendations}</h2>
    <ul>${record.report.recommendations.map((item) => `<li>${item}</li>`).join("")}</ul>
    <h2 style="margin-top:18px;">${labels.disclaimer}</h2>
    <p>${record.report.disclaimer || ""}</p>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = 210;
    const pageHeight = 297;
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`medical-report-summary-${record.id}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}
