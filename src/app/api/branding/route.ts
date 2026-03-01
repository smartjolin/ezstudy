import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "TUTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        businessName: true,
        brandColor: true,
        logoUrl: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching branding:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "TUTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { businessName, brandColor, logoUrl } = await request.json();

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(businessName !== undefined && { businessName }),
        ...(brandColor !== undefined && { brandColor }),
        ...(logoUrl !== undefined && { logoUrl }),
      },
      select: {
        businessName: true,
        brandColor: true,
        logoUrl: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating branding:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
