import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const upcoming = searchParams.get("upcoming") === "true";

    const isTutor = session.user.role === "TUTOR";

    const where: Record<string, unknown> = isTutor
      ? { tutorId: session.user.id }
      : { studentId: session.user.id };

    if (upcoming) {
      where.scheduledAt = { gte: new Date() };
      where.status = { in: ["SCHEDULED", "IN_PROGRESS"] };
    }

    const sessions = await prisma.tutoringSession.findMany({
      where,
      include: {
        tutor: {
          select: { id: true, name: true, email: true },
        },
        student: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { scheduledAt: upcoming ? "asc" : "desc" },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
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

    if (session.user.role !== "TUTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { studentId, title, scheduledAt, duration } = await request.json();

    if (!studentId || !scheduledAt) {
      return NextResponse.json(
        { error: "studentId and scheduledAt are required" },
        { status: 400 }
      );
    }

    // Validate student is in tutor's roster
    const relation = await prisma.studentTutor.findUnique({
      where: {
        tutorId_studentId: {
          tutorId: session.user.id,
          studentId,
        },
      },
    });

    if (!relation) {
      return NextResponse.json(
        { error: "Student is not in your roster" },
        { status: 400 }
      );
    }

    const tutoringSession = await prisma.tutoringSession.create({
      data: {
        title,
        scheduledAt: new Date(scheduledAt),
        duration,
        tutorId: session.user.id,
        studentId,
      },
      include: {
        tutor: {
          select: { id: true, name: true, email: true },
        },
        student: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(tutoringSession, { status: 201 });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
