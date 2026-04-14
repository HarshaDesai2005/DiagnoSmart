// @vitest-environment node

import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/upload/route";

vi.mock("llamaindex", () => ({
  LlamaParseReader: vi.fn().mockImplementation(() => ({
    loadData: vi.fn(),
  })),
}));

vi.mock("@/lib/groq-service", () => ({
  processMedicalReport: vi.fn(),
}));

describe("upload route", () => {
  beforeEach(() => {
    process.env.GROQ_API_KEY = "test-key";
  });

  it("returns 400 when file is missing", async () => {
    const req = new NextRequest("http://localhost/api/upload", {
      method: "POST",
      body: new FormData(),
    });

    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.code).toBe("FILE_REQUIRED");
  });

  it("rejects unsupported file type", async () => {
    const formData = new FormData();
    const file = new File(["abc"], "notes.txt", { type: "text/plain" });
    formData.append("file", file);

    const req = new NextRequest("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.code).toBe("INVALID_FILE_TYPE");
  });
});
