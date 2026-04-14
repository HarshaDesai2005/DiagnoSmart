import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get("text")?.trim();
  const lang = req.nextUrl.searchParams.get("lang")?.trim() || "hi";

  if (!text) {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }

  const url = new URL("https://translate.google.com/translate_tts");
  url.searchParams.set("ie", "UTF-8");
  url.searchParams.set("client", "tw-ob");
  url.searchParams.set("tl", lang);
  url.searchParams.set("q", text);

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Referer: "https://translate.google.com/",
    },
  });

  if (!response.ok) {
    return NextResponse.json({ error: "TTS provider error" }, { status: 502 });
  }

  const audio = await response.arrayBuffer();
  return new NextResponse(audio, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
