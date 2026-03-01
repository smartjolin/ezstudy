import { NextRequest, NextResponse } from "next/server";

// pdf-parse v1 tries to load a test file on import, so we use the lib directly
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require("pdf-parse/lib/pdf-parse");

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Only PDF files are supported" },
        { status: 400 }
      );
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await pdf(buffer);

    if (!data.text || data.text.trim().length === 0) {
      return NextResponse.json(
        { error: "Could not extract text from this PDF. It may be image-based." },
        { status: 422 }
      );
    }

    // Truncate to ~8000 chars to stay within AI prompt limits
    const text = data.text.trim().slice(0, 8000);

    return NextResponse.json({
      text,
      pages: data.numpages,
      truncated: data.text.trim().length > 8000,
    });
  } catch (error) {
    console.error("PDF extraction error:", error);
    return NextResponse.json(
      { error: "Failed to extract text from PDF" },
      { status: 500 }
    );
  }
}
