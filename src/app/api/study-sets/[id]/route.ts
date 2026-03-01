import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    const studySet = await prisma.studySet.findUnique({
      where: { id },
      include: {
        flashcards: { orderBy: { order: "asc" } },
        quizQuestions: { orderBy: { order: "asc" } },
        notes: { orderBy: { order: "asc" } },
      },
    });

    if (!studySet) {
      return NextResponse.json(
        { error: "Study set not found" },
        { status: 404 }
      );
    }

    // Check access: creator, assigned student, or valid share code
    const isCreator = studySet.creatorId === session.user.id;

    const hasAssignment = await prisma.assignment.findFirst({
      where: {
        studySetId: id,
        assignedToId: session.user.id,
      },
    });

    const hasValidCode = code && studySet.shareCode === code;

    if (!isCreator && !hasAssignment && !hasValidCode) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(studySet);
  } catch (error) {
    console.error("Error fetching study set:", error);
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

    const { id } = await params;

    const studySet = await prisma.studySet.findUnique({
      where: { id },
    });

    if (!studySet) {
      return NextResponse.json(
        { error: "Study set not found" },
        { status: 404 }
      );
    }

    if (studySet.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const {
      title,
      description,
      gradeLevel,
      difficulty,
      curriculum,
      customInstructions,
      isPublic,
    } = await request.json();

    const updated = await prisma.studySet.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(gradeLevel !== undefined && { gradeLevel }),
        ...(difficulty !== undefined && { difficulty }),
        ...(curriculum !== undefined && { curriculum }),
        ...(customInstructions !== undefined && { customInstructions }),
        ...(isPublic !== undefined && { isPublic }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating study set:", error);
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

    const { id } = await params;

    const studySet = await prisma.studySet.findUnique({
      where: { id },
    });

    if (!studySet) {
      return NextResponse.json(
        { error: "Study set not found" },
        { status: 404 }
      );
    }

    if (studySet.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.studySet.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting study set:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
