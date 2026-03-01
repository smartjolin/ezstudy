import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Level thresholds
const LEVELS = [
  { name: "Beginner", minPoints: 0 },
  { name: "Scholar", minPoints: 50 },
  { name: "Expert", minPoints: 200 },
  { name: "Master", minPoints: 500 },
];

function getLevel(points: number): string {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].minPoints) return LEVELS[i].name;
  }
  return "Beginner";
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function isYesterday(d1: Date, today: Date): boolean {
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(d1, yesterday);
}

// GET: Fetch current user's gamification stats
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        points: true,
        streak: true,
        lastStudyDate: true,
        level: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if streak is still active (studied yesterday or today)
    const today = new Date();
    let streak = user.streak;
    if (user.lastStudyDate) {
      const last = new Date(user.lastStudyDate);
      if (!isSameDay(last, today) && !isYesterday(last, today)) {
        streak = 0; // Streak broken
      }
    }

    const nextLevel = LEVELS.find((l) => l.minPoints > user.points);

    return NextResponse.json({
      points: user.points,
      streak,
      level: user.level,
      nextLevel: nextLevel
        ? { name: nextLevel.name, pointsNeeded: nextLevel.minPoints - user.points }
        : null,
      levels: LEVELS,
    });
  } catch (error) {
    console.error("Gamification GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Award points for an activity
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { activity, details } = await request.json();

    // Points map
    const pointsMap: Record<string, number> = {
      flashcard_review: 1,    // Per card reviewed
      quiz_correct: 2,        // Per correct answer
      quiz_complete: 5,       // Completing a quiz
      quiz_perfect: 10,       // Perfect score bonus
      notes_read: 3,          // Reading notes
      chat_session: 2,        // Using AI tutor
    };

    const basePoints = pointsMap[activity] || 0;
    if (basePoints === 0) {
      return NextResponse.json({ error: "Unknown activity" }, { status: 400 });
    }

    // Multiply by count if provided (e.g., 5 flashcards reviewed)
    const count = details?.count || 1;
    const earnedPoints = basePoints * count;

    // Get current user data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { points: true, streak: true, lastStudyDate: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const today = new Date();
    let newStreak = user.streak;

    if (user.lastStudyDate) {
      const last = new Date(user.lastStudyDate);
      if (isSameDay(last, today)) {
        // Already studied today, keep streak
      } else if (isYesterday(last, today)) {
        // Studied yesterday, increment streak
        newStreak += 1;
      } else {
        // Streak broken, start at 1
        newStreak = 1;
      }
    } else {
      // First time studying
      newStreak = 1;
    }

    const newPoints = user.points + earnedPoints;
    const newLevel = getLevel(newPoints);

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        points: newPoints,
        streak: newStreak,
        lastStudyDate: today,
        level: newLevel,
      },
      select: {
        points: true,
        streak: true,
        level: true,
      },
    });

    return NextResponse.json({
      ...updated,
      earnedPoints,
      activity,
    });
  } catch (error) {
    console.error("Gamification POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
