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

    if (session.user.role !== "TUTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Verify tutor-student relation
    const relation = await prisma.studentTutor.findUnique({
      where: {
        tutorId_studentId: {
          tutorId: session.user.id,
          studentId: id,
        },
      },
    });

    if (!relation) {
      return NextResponse.json(
        { error: "Student not found in your roster" },
        { status: 404 }
      );
    }

    const student = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Get quiz attempts
    const quizAttempts = await prisma.quizAttempt.findMany({
      where: { userId: id },
      include: {
        studySet: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Get flashcard mastery counts
    const flashcardMastery = await prisma.flashcardMastery.groupBy({
      by: ["mastered"],
      where: { userId: id },
      _count: true,
    });

    const masteredCount =
      flashcardMastery.find((g) => g.mastered)?._count || 0;
    const totalFlashcards =
      flashcardMastery.reduce((sum, g) => sum + g._count, 0);

    // Get assignment statuses
    const assignments = await prisma.assignment.findMany({
      where: {
        assignedToId: id,
        assignedById: session.user.id,
      },
      include: {
        studySet: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      ...student,
      subject: relation.subject,
      notes: relation.notes,
      quizAttempts,
      flashcardMastery: {
        mastered: masteredCount,
        total: totalFlashcards,
      },
      assignments,
    });
  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "TUTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { subject, notes } = await request.json();

    const relation = await prisma.studentTutor.findUnique({
      where: {
        tutorId_studentId: {
          tutorId: session.user.id,
          studentId: id,
        },
      },
    });

    if (!relation) {
      return NextResponse.json(
        { error: "Student not found in your roster" },
        { status: 404 }
      );
    }

    const updated = await prisma.studentTutor.update({
      where: { id: relation.id },
      data: {
        ...(subject !== undefined && { subject }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating student:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "TUTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const relation = await prisma.studentTutor.findUnique({
      where: {
        tutorId_studentId: {
          tutorId: session.user.id,
          studentId: id,
        },
      },
    });

    if (!relation) {
      return NextResponse.json(
        { error: "Student not found in your roster" },
        { status: 404 }
      );
    }

    await prisma.studentTutor.delete({ where: { id: relation.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing student:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
