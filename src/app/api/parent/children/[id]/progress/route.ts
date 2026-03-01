import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Verify parent-child relationship
    const relation = await prisma.parentStudent.findUnique({
      where: {
        parentId_studentId: {
          parentId: session.user.id,
          studentId: id,
        },
      },
    });

    if (!relation) {
      return NextResponse.json(
        { error: "Child not found" },
        { status: 404 }
      );
    }

    // Get student info
    const student = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    // Recent quiz attempts
    const recentQuizAttempts = await prisma.quizAttempt.findMany({
      where: { userId: id },
      include: {
        studySet: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Assignment completion
    const assignments = await prisma.assignment.findMany({
      where: { assignedToId: id },
      include: {
        studySet: { select: { id: true, title: true } },
        assignedBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const completedAssignments = assignments.filter(
      (a) => a.status === "COMPLETED"
    ).length;

    // Study time (sum of timeSpent from quiz attempts)
    const totalStudyTime = await prisma.quizAttempt.aggregate({
      where: { userId: id },
      _sum: { timeSpent: true },
    });

    // Flashcard mastery
    const flashcardStats = await prisma.flashcardMastery.groupBy({
      by: ["mastered"],
      where: { userId: id },
      _count: true,
    });

    const masteredCount =
      flashcardStats.find((g) => g.mastered)?._count || 0;
    const totalFlashcards = flashcardStats.reduce(
      (sum, g) => sum + g._count,
      0
    );

    return NextResponse.json({
      student,
      recentQuizAttempts,
      assignments: {
        total: assignments.length,
        completed: completedAssignments,
        pending: assignments.filter((a) => a.status === "PENDING").length,
        inProgress: assignments.filter((a) => a.status === "IN_PROGRESS")
          .length,
        list: assignments,
      },
      studyTime: {
        totalSeconds: totalStudyTime._sum.timeSpent || 0,
      },
      flashcardMastery: {
        mastered: masteredCount,
        total: totalFlashcards,
      },
    });
  } catch (error) {
    console.error("Error fetching child progress:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
