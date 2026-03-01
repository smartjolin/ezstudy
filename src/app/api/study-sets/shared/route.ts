import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Share code is required" },
        { status: 400 }
      );
    }

    const studySet = await prisma.studySet.findUnique({
      where: { shareCode: code },
      include: {
        flashcards: { orderBy: { order: "asc" } },
        quizQuestions: { orderBy: { order: "asc" } },
        notes: { orderBy: { order: "asc" } },
        creator: {
          select: {
            businessName: true,
            brandColor: true,
            logoUrl: true,
            name: true,
          },
        },
      },
    });

    if (!studySet) {
      return NextResponse.json(
        { error: "Study set not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(studySet);
  } catch (error) {
    console.error("Error fetching shared study set:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
