import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "TUTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const studentRelations = await prisma.studentTutor.findMany({
      where: { tutorId: session.user.id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            updatedAt: true,
          },
        },
      },
    });

    // Get assignment counts and last activity for each student
    const studentsWithStats = await Promise.all(
      studentRelations.map(async (rel) => {
        const assignmentCount = await prisma.assignment.count({
          where: {
            assignedToId: rel.studentId,
            assignedById: session.user.id,
          },
        });

        const lastActivity = await prisma.quizAttempt.findFirst({
          where: { userId: rel.studentId },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        });

        return {
          id: rel.student.id,
          name: rel.student.name,
          email: rel.student.email,
          image: rel.student.image,
          subject: rel.subject,
          notes: rel.notes,
          relationId: rel.id,
          assignmentCount,
          lastActivity: lastActivity?.createdAt || rel.student.updatedAt,
          createdAt: rel.createdAt,
        };
      })
    );

    return NextResponse.json(studentsWithStats);
  } catch (error) {
    console.error("Error fetching students:", error);
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

    const { email, name, subject } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if the student already exists
    let student = await prisma.user.findUnique({
      where: { email },
    });

    if (!student) {
      // Create a new student user with a random password
      const randomPassword = nanoid(16);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      student = await prisma.user.create({
        data: {
          email,
          name: name || email.split("@")[0],
          password: hashedPassword,
          role: "STUDENT",
        },
      });
    }

    // Check if relation already exists
    const existingRelation = await prisma.studentTutor.findUnique({
      where: {
        tutorId_studentId: {
          tutorId: session.user.id,
          studentId: student.id,
        },
      },
    });

    if (existingRelation) {
      return NextResponse.json(
        { error: "Student is already in your roster" },
        { status: 409 }
      );
    }

    // Create the StudentTutor relation
    const relation = await prisma.studentTutor.create({
      data: {
        tutorId: session.user.id,
        studentId: student.id,
        subject,
      },
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

    return NextResponse.json(
      {
        id: relation.student.id,
        name: relation.student.name,
        email: relation.student.email,
        image: relation.student.image,
        subject: relation.subject,
        relationId: relation.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding student:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
