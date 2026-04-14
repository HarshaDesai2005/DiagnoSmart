import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import os from "os";
import crypto from "crypto";
import { LlamaParseReader } from "llamaindex";
import { processMedicalReport } from "@/lib/groq-service";
import { AppError, toAppError } from "@/lib/errors";
import { withRetry, withTimeout } from "@/lib/retry";
import { checkRateLimit } from "@/lib/rate-limit";
import { createRequestLogger } from "@/lib/logger";
import { AnalysisLanguage } from "@/lib/types";

export const config = {
  api: {
    bodyParser: false,
  },
};

const allowedMimeTypes = new Set(["application/pdf", "image/jpeg", "image/png"]);
const maxSizeBytes = 15 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const logger = createRequestLogger(requestId);
  const ip = req.headers.get("x-forwarded-for") || "local";

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const languageInput = formData.get("language");
  const language: AnalysisLanguage = languageInput === "hi" ? "hi" : "en";

  if (!file) {
    return NextResponse.json(
      { error: "No file uploaded", code: "FILE_REQUIRED", requestId },
      { status: 400 }
    );
  }

  let filepath: string | null = null;

  try {
    checkRateLimit(ip);

    if (!allowedMimeTypes.has(file.type)) {
      throw new AppError("Invalid file type. Please upload PDF, JPG or PNG.", "INVALID_FILE_TYPE", 400);
    }
    if (file.size > maxSizeBytes) {
      throw new AppError("File too large. Maximum file size is 15MB.", "FILE_TOO_LARGE", 400);
    }
    if (!process.env.GROQ_API_KEY) {
      throw new AppError("Missing GROQ_API_KEY configuration.", "MISSING_GROQ_KEY", 500);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name.replace(/\s/g, "-");
    filepath = join(os.tmpdir(), `${Date.now()}-${filename}`);

    await writeFile(filepath, buffer);

    const documents = await withRetry(
      () =>
        withTimeout(
          new LlamaParseReader({ resultType: "markdown" }).loadData(filepath),
          45_000
        ),
      1,
      700
    );

    await unlink(filepath);
    filepath = null;

    if (
      !documents ||
      documents.length === 0 ||
      documents[0].text === "NO_CONTENT_HERE"
    ) {
      return NextResponse.json(
        {
          error: "No content found in the document",
          code: "NO_CONTENT",
          requestId,
        },
        { status: 400 }
      );
    }

    const processedReport = await withRetry(
      () => withTimeout(processMedicalReport({ documents, language }), 40_000),
      1,
      700
    );

    logger.info("Analysis completed", {
      fileType: file.type,
      size: file.size,
      language,
    });

    return NextResponse.json({
      success: true,
      report: processedReport,
      requestId,
    });
  } catch (error) {
    const appError = toAppError(error);
    logger.error("Failed to process file", {
      code: appError.code,
      message: appError.message,
    });
    return NextResponse.json(
      { error: appError.message, code: appError.code, requestId },
      { status: appError.status }
    );
  } finally {
    if (filepath) {
      await unlink(filepath).catch(() => undefined);
    }
  }
}
