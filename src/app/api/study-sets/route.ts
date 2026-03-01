import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const shared = searchParams.get("shared") === "true";

    const ownedSets = await prisma.studySet.findMany({
      where: { creatorId: session.user.id },
      include: {
        _count: {
          select: {
            flashcards: true,
            quizQuestions: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    if (!shared) {
      return NextResponse.json(ownedSets);
    }

    // Also include sets shared with user via assignments
    const assignedSets = await prisma.studySet.findMany({
      where: {
        assignments: {
          some: {
            assignedToId: session.user.id,
          },
        },
        creatorId: { not: session.user.id },
      },
      include: {
        _count: {
          select: {
            flashcards: true,
            quizQuestions: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json([...ownedSets, ...assignedSets]);
  } catch (error) {
    console.error("Error fetching study sets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      title,
      description,
      gradeLevel,
      difficulty,
      curriculum,
      customInstructions,
      flashcards,
      quizQuestions,
      notes,
    } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const shareCode = nanoid(10);

    const studySet = await prisma.studySet.create({
      data: {
        title,
        description,
        gradeLevel,
        difficulty,
        curriculum,
        customInstructions,
        shareCode,
        creatorId: session.user.id,
        flashcards: flashcards?.length
          ? {
              create: flashcards.map(
                (fc: { front: string; back: string }, index: number) => ({
                  front: fc.front,
                  back: fc.back,
                  order: index,
                })
              ),
            }
          : undefined,
        quizQuestions: quizQuestions?.length
          ? {
              create: quizQuestions.map(
                (
                  q: {
                    question: string;
                    type?: string;
                    options?: string[];
                    correctIndex?: number;
                    correctAnswer?: string;
                    explanation?: string;
                  },
                  index: number
                ) => ({
                  question: q.question,
                  type: q.type || "MULTIPLE_CHOICE",
                  options: q.options,
                  correctIndex: q.correctIndex,
                  correctAnswer: q.correctAnswer,
                  explanation: q.explanation,
                  order: index,
                })
              ),
            }
          : undefined,
        notes: notes?.length
          ? {
              create: notes.map(
                (
                  n: { title: string; content: string },
                  index: number
                ) => ({
                  title: n.title,
                  content: n.content,
                  order: index,
                })
              ),
            }
          : undefined,
      },
      include: {
        flashcards: true,
        quizQuestions: true,
        notes: true,
      },
    });

    return NextResponse.json(studySet, { status: 201 });
  } catch (error) {
    console.error("Error creating study set:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
