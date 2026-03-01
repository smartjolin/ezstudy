import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studySetId, score, totalQuestions, timeSpent, timeLimitSec, answers } =
      await request.json();

    if (!studySetId || score === undefined || !totalQuestions) {
      return NextResponse.json(
        { error: "studySetId, score, and totalQuestions are required" },
        { status: 400 }
      );
    }

    // Validate study set exists
    const studySet = await prisma.studySet.findUnique({
      where: { id: studySetId },
    });

    if (!studySet) {
      return NextResponse.json(
        { error: "Study set not found" },
        { status: 404 }
      );
    }

    const attempt = await prisma.quizAttempt.create({
      data: {
        score,
        totalQuestions,
        timeSpent,
        timeLimitSec,
        userId: session.user.id,
        studySetId,
        answers: answers?.length
          ? {
              create: answers.map(
                (a: {
                  questionId: string;
                  selectedIndex?: number;
                  textAnswer?: string;
                  isCorrect: boolean;
                }) => ({
                  questionId: a.questionId,
                  selectedIndex: a.selectedIndex,
                  textAnswer: a.textAnswer,
                  isCorrect: a.isCorrect,
                })
              ),
            }
          : undefined,
      },
      include: {
        answers: true,
      },
    });

    return NextResponse.json(attempt, { status: 201 });
  } catch (error) {
    console.error("Error creating quiz attempt:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studySetId = searchParams.get("studySetId");
    const studentId = searchParams.get("studentId");

    if (!studySetId) {
      return NextResponse.json(
        { error: "studySetId query param is required" },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { studySetId };

    if (session.user.role === "TUTOR" && studentId) {
      // Tutors can filter by student
      where.userId = studentId;
    } else {
      // Students see their own attempts
      where.userId = session.user.id;
    }

    const attempts = await prisma.quizAttempt.findMany({
      where,
      include: {
        answers: {
          include: {
            question: {
              select: { question: true, type: true },
            },
          },
        },
        user: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(attempts);
  } catch (error) {
    console.error("Error fetching quiz attempts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
