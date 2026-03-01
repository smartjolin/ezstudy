import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDeepseek } from "@/lib/deepseek";

export async function POST(
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

    const tutoringSession = await prisma.tutoringSession.findUnique({
      where: { id },
      include: {
        student: { select: { name: true } },
        tutor: { select: { name: true } },
      },
    });

    if (!tutoringSession) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    if (tutoringSession.tutorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Accept notes from request body or use stored notes
    const body = await request.json().catch(() => ({}));
    const notes = body.notes || tutoringSession.notes;

    if (!notes) {
      return NextResponse.json(
        { error: "No notes available to generate recap" },
        { status: 400 }
      );
    }

    const completion = await getDeepseek().chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: `You are a helpful tutoring assistant. Generate a clear, concise, and parent-friendly recap of a tutoring session. The recap should:
- Summarize what topics were covered
- Highlight the student's progress and achievements
- Note any areas that need more practice
- Suggest follow-up activities or homework
- Be written in a warm, encouraging tone suitable for parents to read

Keep the recap to 3-5 paragraphs.`,
        },
        {
          role: "user",
          content: `Please generate a recap for this tutoring session:

Student: ${tutoringSession.student.name || "Student"}
Tutor: ${tutoringSession.tutor.name || "Tutor"}
Date: ${tutoringSession.scheduledAt.toLocaleDateString()}
Duration: ${tutoringSession.duration ? `${tutoringSession.duration} minutes` : "Not specified"}

Session Notes:
${notes}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const recap = completion.choices[0]?.message?.content || "";

    // Save recap to the session
    const updated = await prisma.tutoringSession.update({
      where: { id },
      data: { recap },
    });

    return NextResponse.json({ recap: updated.recap });
  } catch (error) {
    console.error("Error generating recap:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
