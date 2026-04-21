import Groq from "groq-sdk";
import endent from "endent";
import { AnalysisLanguage, MarkerStatus, StructuredReport } from "@/lib/types";

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

interface ProcessMedicalReportInput {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  documents: any[];
  language: AnalysisLanguage;
}

function getLanguageLabel(language: AnalysisLanguage) {
  return language === "hi" ? "Hindi" : "English";
}

const sectionHeadings = {
  en: {
    overview: "Report Overview",
    explanation: "Simplified Medical Explanation",
    status: "Health Status Assessment",
    implications: "Potential Health Implications",
    recommendations: "Personalized Improvement Recommendations",
    redFlags: "Urgent Red Flags",
    abnormalTable: "Abnormal Values Table",
  },
  hi: {
    overview: "रिपोर्ट का सारांश",
    explanation: "सरल चिकित्सा व्याख्या",
    status: "स्वास्थ्य स्थिति आकलन",
    implications: "संभावित स्वास्थ्य प्रभाव",
    recommendations: "व्यक्तिगत सुधार सुझाव",
    redFlags: "तत्काल चेतावनी संकेत",
    abnormalTable: "असामान्य मान तालिका",
  },
} as const;

function detectStatus(value: string, range: string): MarkerStatus {
  const numbers = value.match(/-?\d+(\.\d+)?/g);
  const rangeMatch = range.match(/(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)/);

  if (!numbers || !rangeMatch) {
    return "normal";
  }

  const observed = parseFloat(numbers[0]);
  const min = parseFloat(rangeMatch[1]);
  const max = parseFloat(rangeMatch[2]);
  if (Number.isNaN(observed) || Number.isNaN(min) || Number.isNaN(max)) {
    return "normal";
  }

  if (observed < min) {
    return observed < min * 0.8 ? "critical" : "low";
  }
  if (observed > max) {
    return observed > max * 1.2 ? "critical" : "high";
  }

  return "normal";
}

function extractSection(content: string, headings: string[]) {
  for (const heading of headings) {
    const pattern = new RegExp(`##\\s*${heading}\\s*([\\s\\S]*?)(?=\\n##\\s|$)`, "i");
    const match = content.match(pattern);
    if (match?.[1]?.trim()) {
      return match[1].trim();
    }
  }
  return "";
}

function extractRecommendations(content: string, language: AnalysisLanguage) {
  const section = extractSection(content, [
    sectionHeadings[language].recommendations,
    sectionHeadings.en.recommendations,
  ]);
  if (!section) {
    return [];
  }

  return section
    .split("\n")
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
}

function extractRedFlags(content: string, language: AnalysisLanguage) {
  const section = extractSection(content, [
    sectionHeadings[language].redFlags,
    sectionHeadings.en.redFlags,
  ]);
  if (!section) {
    return [];
  }
  return section
    .split("\n")
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
}

function extractAbnormalValues(content: string): StructuredReport["abnormalValues"] {
  const tableRegex = /\|([^|\n]+)\|([^|\n]+)\|([^|\n]+)\|([^|\n]+)\|([^|\n]+)\|/g;
  const abnormalValues: StructuredReport["abnormalValues"] = [];
  let match: RegExpExecArray | null = null;

  while ((match = tableRegex.exec(content)) !== null) {
    const marker = match[1].trim();
    const observedValue = match[2].trim();
    const referenceRange = match[3].trim();
    const rawStatus = match[4].trim().toLowerCase();
    const note = match[5].trim();

    const markerLower = marker.toLowerCase();
    const observedLower = observedValue.toLowerCase();

    // Skip table header rows in English/Hindi and separator rows.
    if (
      marker.startsWith("---") ||
      markerLower === "marker/test" ||
      markerLower === "marker" ||
      markerLower === "parameter" ||
      marker === "सूचक/टेस्ट" ||
      marker === "सूचक / टेस्ट" ||
      marker === "पैरामीटर" ||
      observedLower === "observed value" ||
      observedLower === "value" ||
      observedValue === "वर्तमान मान" ||
      observedValue === "मान"
    ) {
      continue;
    }

    const normalizedStatus =
      rawStatus
        .replace("अधिक", "high")
        .replace("कम", "low")
        .replace("सामान्य", "normal")
        .replace("गंभीर", "critical")
        .replace("क्रिटिकल", "critical")
        .replace("उच्च", "high")
        .replace("निम्न", "low")
        .trim();

    const mappedStatus: MarkerStatus =
      normalizedStatus === "low" ||
      normalizedStatus === "high" ||
      normalizedStatus === "critical" ||
      normalizedStatus === "normal"
        ? (normalizedStatus as MarkerStatus)
        : detectStatus(observedValue, referenceRange);

    abnormalValues.push({
      marker,
      observedValue,
      referenceRange,
      status: mappedStatus,
      note,
    });
  }

  return abnormalValues;
}

function extractAbnormalValuesFromDocument(documentText: string): StructuredReport["abnormalValues"] {
  const rowRegex = /\|([^|\n]+)\|([^|\n]+)\|([^|\n]+)\|/g;
  const values: StructuredReport["abnormalValues"] = [];
  let match: RegExpExecArray | null = null;

  while ((match = rowRegex.exec(documentText)) !== null) {
    const marker = match[1].trim();
    const observedValue = match[2].trim();
    const referenceRange = match[3].trim();

    const markerLower = marker.toLowerCase();
    if (
      marker.startsWith("---") ||
      markerLower === "parameter" ||
      markerLower === "marker/test" ||
      markerLower === "test" ||
      marker === "सूचक/टेस्ट" ||
      marker === "पैरामीटर"
    ) {
      continue;
    }

    const status = detectStatus(observedValue, referenceRange);
    if (status === "normal") {
      continue;
    }

    values.push({
      marker,
      observedValue,
      referenceRange,
      status,
      note: "",
    });
  }

  return values;
}

function extractAbnormalValuesFromRanges(documentText: string): StructuredReport["abnormalValues"] {
  const values: StructuredReport["abnormalValues"] = [];
  const lines = documentText.split("\n").map((line) => line.trim()).filter(Boolean);

  for (const line of lines) {
    // Example matches:
    // Hemoglobin (Hb) 11.2 g/dL 13.0 - 17.0
    // LDL Cholesterol 162 mg/dL < 100 (won't match range form)
    const rangeMatch = line.match(
      /^(.+?)\s+(-?\d+(?:\.\d+)?)\s*[A-Za-z%\/\^\d.-]*\s+(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)/i
    );
    if (!rangeMatch) {
      continue;
    }

    const marker = rangeMatch[1].trim().replace(/[:|-]+$/, "").trim();
    const observedValue = rangeMatch[2].trim();
    const min = rangeMatch[3].trim();
    const max = rangeMatch[4].trim();
    const referenceRange = `${min} - ${max}`;

    if (!marker || marker.length < 2) {
      continue;
    }

    const status = detectStatus(observedValue, referenceRange);
    if (status === "normal") {
      continue;
    }

    values.push({
      marker,
      observedValue,
      referenceRange,
      status,
      note: "",
    });
  }

  return values;
}

function uniqueByMarker(values: StructuredReport["abnormalValues"]) {
  const map = new Map<string, StructuredReport["abnormalValues"][number]>();
  for (const value of values) {
    const key = value.marker.toLowerCase().trim();
    if (!map.has(key)) {
      map.set(key, value);
    }
  }
  return Array.from(map.values());
}

function normalizeReport(
  documentText: string,
  analysis: string,
  language: AnalysisLanguage
): StructuredReport {
  const extractedFromAnalysis = extractAbnormalValues(analysis);
  const extractedFromDocument = extractAbnormalValuesFromDocument(documentText);
  const extractedFromRanges = extractAbnormalValuesFromRanges(documentText);
  const merged = uniqueByMarker([
    ...extractedFromAnalysis,
    ...extractedFromDocument,
    ...extractedFromRanges,
  ]);
  const abnormalValues =
    merged.length > 0 ? merged : extractedFromAnalysis;

  return {
    title: "Medical Report Analysis",
    language,
    generatedAt: new Date().toISOString(),
    overview: extractSection(analysis, [
      sectionHeadings[language].overview,
      sectionHeadings.en.overview,
    ]),
    simplifiedExplanation: extractSection(analysis, [
      sectionHeadings[language].explanation,
      sectionHeadings.en.explanation,
    ]),
    healthStatus: extractSection(analysis, [
      sectionHeadings[language].status,
      sectionHeadings.en.status,
    ]),
    implications: extractSection(analysis, [
      sectionHeadings[language].implications,
      sectionHeadings.en.implications,
    ]),
    recommendations: extractRecommendations(analysis, language),
    redFlags: extractRedFlags(analysis, language),
    disclaimer:
      language === "hi"
        ? "यह रिपोर्ट केवल जानकारी के लिए है, चिकित्सीय निदान के लिए नहीं। गंभीर लक्षण होने पर तुरंत डॉक्टर से संपर्क करें।"
        : "This report is for informational purposes only and not a medical diagnosis. Contact your doctor immediately for severe symptoms.",
    abnormalValues,
    analysisMarkdown: analysis,
    originalDocument: documentText,
  };
}

function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    const objectLike = raw.match(/\{[\s\S]*\}/);
    if (objectLike?.[0]) {
      try {
        return JSON.parse(objectLike[0]) as T;
      } catch {
        // continue to fenced-json fallback
      }
    }
    const fenced = raw.match(/```json\s*([\s\S]*?)```/i);
    if (!fenced?.[1]) {
      return null;
    }
    try {
      return JSON.parse(fenced[1]) as T;
    } catch {
      return null;
    }
  }
}

interface TranslationPayload {
  title: string;
  overview: string;
  simplifiedExplanation: string;
  healthStatus: string;
  implications: string;
  recommendations: string[];
  redFlags: string[];
  disclaimer: string;
  abnormalValues: Array<{
    marker: string;
    observedValue: string;
    referenceRange: string;
    status: string;
    note: string;
  }>;
}

function hasHindiScript(text: string) {
  return /[\u0900-\u097F]/.test(text);
}

async function translateTextToHindi(text: string): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) {
    return "";
  }
  if (hasHindiScript(trimmed)) {
    return trimmed;
  }

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "Translate the given medical text to natural Hindi. Preserve numbers, ranges, units, and medicine names exactly. Return plain text only.",
        },
        {
          role: "user",
          content: trimmed,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      max_tokens: 800,
    });
    return completion.choices[0]?.message?.content?.trim() || trimmed;
  } catch {
    return trimmed;
  }
}

async function translateListToHindi(items: string[]): Promise<string[]> {
  if (items.length === 0) {
    return [];
  }
  const translated = await Promise.all(items.map((item) => translateTextToHindi(item)));
  return translated.map((item, index) => item || items[index]);
}

async function translateAbnormalValuesToHindi(
  values: StructuredReport["abnormalValues"]
): Promise<StructuredReport["abnormalValues"]> {
  if (values.length === 0) {
    return values;
  }

  const translated = await Promise.all(
    values.map(async (value) => ({
      ...value,
      marker: await translateTextToHindi(value.marker),
      note: value.note ? await translateTextToHindi(value.note) : "",
    }))
  );

  return translated;
}

function normalizeStatusToken(rawStatus: string): MarkerStatus {
  const normalized = rawStatus
    .toLowerCase()
    .replace("अधिक", "high")
    .replace("कम", "low")
    .replace("सामान्य", "normal")
    .replace("गंभीर", "critical")
    .replace("क्रिटिकल", "critical")
    .replace("उच्च", "high")
    .replace("निम्न", "low")
    .trim();

  if (normalized === "low" || normalized === "high" || normalized === "critical") {
    return normalized;
  }
  return "normal";
}

function buildAnalysisMarkdown(report: StructuredReport): string {
  const headings = sectionHeadings[report.language];
  const recommendations = report.recommendations.length
    ? report.recommendations.map((item) => `- ${item}`).join("\n")
    : report.language === "hi"
      ? "- कोई अतिरिक्त सुझाव नहीं मिला।"
      : "- No additional recommendations were extracted.";
  const redFlags = report.redFlags.length
    ? report.redFlags.map((item) => `- ${item}`).join("\n")
    : report.language === "hi"
      ? "- उपलब्ध डेटा के आधार पर कोई तत्काल चेतावनी संकेत नहीं मिला।"
      : "- No urgent red flags were detected from the available data.";
  const tableHeader =
    report.language === "hi"
      ? "| सूचक/टेस्ट | वर्तमान मान | सामान्य सीमा | स्थिति | टिप्पणी |\n|---|---|---|---|---|"
      : "| Marker/Test | Observed Value | Reference Range | Status | Note |\n|---|---|---|---|---|";
  const tableRows = report.abnormalValues
    .map(
      (value) =>
        `| ${value.marker} | ${value.observedValue} | ${value.referenceRange} | ${value.status} | ${value.note || ""} |`
    )
    .join("\n");

  return endent`## ${headings.overview}
  ${report.overview}

  ## ${headings.explanation}
  ${report.simplifiedExplanation}

  ## ${headings.status}
  ${report.healthStatus}

  ## ${headings.implications}
  ${report.implications}

  ## ${headings.recommendations}
  ${recommendations}

  ## ${headings.redFlags}
  ${redFlags}

  ## ${headings.abnormalTable}
  ${tableHeader}
  ${tableRows}`.trim();
}

async function translateStructuredToHindi(base: StructuredReport): Promise<TranslationPayload | null> {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "Translate medical content from English to Hindi. Keep all numbers, medical values, units, and ranges unchanged. Return valid JSON only.",
        },
        {
          role: "user",
          content: endent`Translate this JSON payload to Hindi and return the same keys only.
          Keep recommendations/redFlags as arrays.
          Preserve numerical data exactly.
          In abnormalValues: translate marker and note to Hindi, keep observedValue and referenceRange unchanged.
          For abnormalValues.status, use only one of: low, normal, high, critical.

          ${JSON.stringify(
            {
              title: base.title,
              overview: base.overview,
              simplifiedExplanation: base.simplifiedExplanation,
              healthStatus: base.healthStatus,
              implications: base.implications,
              recommendations: base.recommendations,
              redFlags: base.redFlags,
              disclaimer:
                "This report is for informational purposes only and not a medical diagnosis. Contact your doctor immediately for severe symptoms.",
              abnormalValues: base.abnormalValues,
            },
            null,
            2
          )}`,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      max_tokens: 2200,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return null;
    }
    return safeJsonParse<TranslationPayload>(content);
  } catch {
    return null;
  }
}

export async function processMedicalReport({
  documents,
  language,
}: ProcessMedicalReportInput) {
  const documentText = documents.map((doc) => doc.text).join("\n");

  const medicalKeywords = [
    "blood",
    "test",
    "diagnosis",
    "report",
    "health",
    "scan",
    "medical",
    "doctor",
  ];
  const containsMedicalContent = medicalKeywords.some((keyword) =>
    documentText.toLowerCase().includes(keyword)
  );

  if (!containsMedicalContent) {
    return {
      originalDocument: documentText,
      analysis:
        language === "hi"
          ? "कृपया विश्लेषण के लिए एक सही मेडिकल रिपोर्ट अपलोड करें।"
          : "Please provide a proper medical report for analysis.",
      structured: normalizeReport(
        documentText,
        language === "hi"
          ? "## रिपोर्ट का सारांश\nपर्याप्त चिकित्सीय जानकारी नहीं मिली।"
          : "## Report Overview\nNot enough medical information was detected.",
        language
      ),
    };
  }

  try {
    // Keep canonical generation in English for stable abnormal-value parsing.
    // Hindi output is produced from the structured translation step below.
    const generationLanguage: AnalysisLanguage = "en";

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: endent`You are a compassionate and knowledgeable medical report interpreter designed to transform complex medical documents into clear, understandable insights.

          Respond ONLY in ${getLanguageLabel(generationLanguage)}.
          Keep output in markdown with these sections and exact headings:
          ## ${sectionHeadings[generationLanguage].overview}
          ## ${sectionHeadings[generationLanguage].explanation}
          ## ${sectionHeadings[generationLanguage].status}
          ## ${sectionHeadings[generationLanguage].implications}
          ## ${sectionHeadings[generationLanguage].recommendations}
          ## ${sectionHeadings[generationLanguage].redFlags}
          ## ${sectionHeadings[generationLanguage].abnormalTable}

          Under "${sectionHeadings[generationLanguage].abnormalTable}", include a markdown table with headers:
          | Marker/Test | Observed Value | Reference Range | Status | Note |

          IMPORTANT: The "Status" / "स्थिति" column MUST be exactly one of these lowercase values (even in Hindi output):
          low | normal | high | critical
          Do not use any other words in that column.

          Example row:
          | Hemoglobin | 11.2 g/dL | 13.0 - 17.0 | low | Mild anemia |

          Also include a short non-diagnostic sentence in the ${sectionHeadings[generationLanguage].redFlags} section if no urgent issue is found.
          Be empathetic, practical, and avoid panic-inducing language.`,
        },
        {
          role: "user",
          content: endent`Analyze this medical report and create a comprehensive, patient-friendly breakdown:

          Medical Report Content:
          ${documentText}

          Please provide a detailed analysis structured as follows:

          Personalized Greeting(don't inlclude this line in response)
          - Address the patient by name
          - Acknowledge the purpose of the report

          Report Overview
          - Identify the type of medical test/report
          - Specify the key health areas examined
          - Provide context about the test's significance

          Simplified Medical Explanation
          - Break down medical terminology
          - Explain each significant finding in plain language
          - Use analogies or simple comparisons if helpful

          Health Status Assessment
          - Highlight positive indicators
          - Identify potential areas of concern
          - Quantify results in relation to standard healthy ranges

          Potential Health Implications
          - Discuss possible underlying reasons for abnormal results
          - Explain potential short-term and long-term health impacts
          - Provide context without causing unnecessary anxiety

          Personalized Improvement Recommendations
          - Suggest specific dietary modifications
          - Recommend tailored exercise routines
          - Propose lifestyle changes based on report findings
          - Include stress management techniques if relevant

          Urgent Red Flags
          - Mention any values that may require urgent clinical attention
          - If none, explicitly state no urgent red flags detected based on available data

          Tone: Supportive, informative, and empowering
          Language: Clear, simple, and encouraging
          Goal: Help the patient understand their health comprehensively and positively`,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      max_tokens: 1024,
    });

    // Extract the AI-generated analysis
    const reportAnalysis =
      chatCompletion.choices[0]?.message?.content || "Unable to process report";

    const baseStructured = normalizeReport(documentText, reportAnalysis, "en");
    let structured: StructuredReport = baseStructured;

    if (language === "hi") {
      const translated = await translateStructuredToHindi(baseStructured);
      if (translated) {
        const translatedAbnormalValues =
          translated.abnormalValues?.length
            ? translated.abnormalValues.map((value) => ({
                marker: value.marker || "",
                observedValue: value.observedValue || "",
                referenceRange: value.referenceRange || "",
                status: normalizeStatusToken(value.status),
                note: value.note || "",
              }))
            : baseStructured.abnormalValues;

        const forcedOverview = await translateTextToHindi(
          translated.overview || baseStructured.overview
        );
        const forcedExplanation = await translateTextToHindi(
          translated.simplifiedExplanation || baseStructured.simplifiedExplanation
        );
        const forcedHealthStatus = await translateTextToHindi(
          translated.healthStatus || baseStructured.healthStatus
        );
        const forcedImplications = await translateTextToHindi(
          translated.implications || baseStructured.implications
        );
        const forcedRecommendations = await translateListToHindi(
          translated.recommendations?.length
            ? translated.recommendations
            : baseStructured.recommendations
        );
        const forcedRedFlags = await translateListToHindi(
          translated.redFlags?.length ? translated.redFlags : baseStructured.redFlags
        );
        const forcedAbnormalValues = await translateAbnormalValuesToHindi(translatedAbnormalValues);

        structured = {
          ...baseStructured,
          language: "hi",
          title: translated.title || "मेडिकल रिपोर्ट विश्लेषण",
          overview: forcedOverview,
          simplifiedExplanation: forcedExplanation,
          healthStatus: forcedHealthStatus,
          implications: forcedImplications,
          recommendations: forcedRecommendations,
          redFlags: forcedRedFlags,
          disclaimer:
            (await translateTextToHindi(translated.disclaimer || "")) ||
            "यह रिपोर्ट केवल जानकारी के लिए है, चिकित्सीय निदान के लिए नहीं। गंभीर लक्षण होने पर तुरंत डॉक्टर से संपर्क करें।",
          abnormalValues: forcedAbnormalValues,
        };
        structured.analysisMarkdown = buildAnalysisMarkdown(structured);
      } else {
        const translatedFallbackAbnormalValues = await translateAbnormalValuesToHindi(
          baseStructured.abnormalValues
        );
        structured = {
          ...baseStructured,
          language: "hi",
          title: await translateTextToHindi(baseStructured.title),
          overview: await translateTextToHindi(baseStructured.overview),
          simplifiedExplanation: await translateTextToHindi(baseStructured.simplifiedExplanation),
          healthStatus: await translateTextToHindi(baseStructured.healthStatus),
          implications: await translateTextToHindi(baseStructured.implications),
          recommendations: await translateListToHindi(baseStructured.recommendations),
          redFlags: await translateListToHindi(baseStructured.redFlags),
          abnormalValues: translatedFallbackAbnormalValues,
          disclaimer:
            "यह रिपोर्ट केवल जानकारी के लिए है, चिकित्सीय निदान के लिए नहीं। गंभीर लक्षण होने पर तुरंत डॉक्टर से संपर्क करें।",
        };
        structured.analysisMarkdown = buildAnalysisMarkdown(structured);
      }
    }

    return {
      originalDocument: documentText,
      analysis: structured.analysisMarkdown,
      structured,
    };
  } catch (error) {
    console.error("Error processing medical report:", error);
    throw new Error("Failed to analyze medical report");
  }
}
