import { NextResponse } from "next/server";
import { analyzeScene } from "@/lib/scenefinder";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const url = typeof body.url === "string" ? body.url.trim() : "";
    const imageDataUrl = typeof body.imageDataUrl === "string" ? body.imageDataUrl : undefined;

    const analysis = await analyzeScene({ url, imageDataUrl });
    return NextResponse.json(analysis);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "解析に失敗しました。",
      },
      { status: 400 },
    );
  }
}
