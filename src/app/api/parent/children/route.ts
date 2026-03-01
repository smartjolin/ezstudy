import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parentRelations = await prisma.parentStudent.findMany({
      where: { parentId: session.user.id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    const childrenWithStats = await Promise.all(
      parentRelations.map(async (rel) => {
        // Total study sets accessed (via assignments)
        const totalStudySets = await prisma.assignment.count({
          where: { assignedToId: rel.studentId },
        });

        // Average quiz score
        const quizAttempts = await prisma.quizAttempt.findMany({
          where: { userId: rel.studentId },
          select: { score: true, totalQuestions: true },
        });

        let avgScore = 0;
        if (quizAttempts.length > 0) {
          const totalPercentage = quizAttempts.reduce((sum, attempt) => {
            return sum + (attempt.score / attempt.totalQuestions) * 100;
          }, 0);
          avgScore = Math.round(totalPercentage / quizAttempts.length);
        }

        // Total flashcards mastered
        const flashcardsMastered = await prisma.flashcardMastery.count({
          where: {
            userId: rel.studentId,
            mastered: true,
          },
        });

        return {
          id: rel.student.id,
          name: rel.student.name,
          email: rel.student.email,
          image: rel.student.image,
          stats: {
            totalStudySets,
            avgQuizScore: avgScore,
            flashcardsMastered,
            totalQuizAttempts: quizAttempts.length,
          },
        };
      })
    );

    return NextResponse.json(childrenWithStats);
  } catch (error) {
    console.error("Error fetching children:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
