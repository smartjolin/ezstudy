import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isTutor = session.user.role === "TUTOR";

    const assignments = await prisma.assignment.findMany({
      where: isTutor
        ? { assignedById: session.user.id }
        : { assignedToId: session.user.id },
      include: {
        studySet: {
          select: { id: true, title: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        assignedBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
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

    const { studySetId, studentId, dueDate } = await request.json();

    if (!studySetId || !studentId) {
      return NextResponse.json(
        { error: "studySetId and studentId are required" },
        { status: 400 }
      );
    }

    // Validate the student is in the tutor's roster
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

    const assignment = await prisma.assignment.create({
      data: {
        studySetId,
        assignedById: session.user.id,
        assignedToId: studentId,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        studySet: {
          select: { id: true, title: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error("Error creating assignment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
