import { NextRequest, NextResponse } from "next/server";
import { getDeepseek } from "@/lib/deepseek";

export const maxDuration = 60; // Allow up to 60s for AI generation

export async function POST(req: NextRequest) {
  try {
    const {
      topic,
      materialContent,
      gradeLevel = "High School",
      difficulty = "Medium",
      curriculum = "None",
      customInstructions,
      contentAmount = "standard",
    } = await req.json();

    // Determine content counts based on contentAmount
    const contentCounts: Record<string, { flashcards: number; quiz: number; notes: number }> = {
      quick: { flashcards: 5, quiz: 3, notes: 1 },
      standard: { flashcards: 8, quiz: 5, notes: 2 },
      comprehensive: { flashcards: 15, quiz: 10, notes: 3 },
    };
    const counts = contentCounts[contentAmount] || contentCounts.standard;

    // Map grade level to language complexity guidance
    const gradeLevelGuidance: Record<string, string> = {
      Elementary:
        "Use simple, age-appropriate vocabulary (grades 3-5). Explain concepts in basic terms with relatable examples. Avoid jargon.",
      "Middle School":
        "Use moderate vocabulary suitable for grades 6-8. Introduce key academic terms with clear definitions. Use everyday analogies.",
      "High School":
        "Use standard academic vocabulary appropriate for grades 9-12. Include proper subject terminology with context.",
      "AP/College":
        "Use advanced academic and technical vocabulary at the college/AP level. Assume foundational knowledge. Include nuanced, rigorous content.",
    };

    // Map difficulty to question complexity guidance
    const difficultyGuidance: Record<string, string> = {
      Easy: "Questions should test basic recall and recognition. Use straightforward wording. Incorrect options should be clearly distinguishable from the correct answer.",
      Medium:
        "Questions should test understanding and application. Include some questions that require reasoning. Incorrect options should be plausible but distinguishable.",
      Hard: "Questions should test analysis, synthesis, and evaluation. Include multi-step reasoning, tricky distractors, and edge cases. Some questions should require deep understanding.",
    };

    // Build curriculum instruction
    const curriculumInstruction =
      curriculum && curriculum !== "None"
        ? `\nCurriculum Alignment: Align all content with ${curriculum} standards. Reference relevant standards or frameworks where appropriate.`
        : "";

    // Build custom instructions section
    const customSection = customInstructions
      ? `\nAdditional Instructions from the user: ${customInstructions}`
      : "";

    const source = materialContent
      ? `the following study material:\n\n${materialContent}`
      : `the topic: "${topic}"`;

    const prompt = `You are an expert educational content creator. Generate a complete study set from ${source}.

Grade Level: ${gradeLevel}
${gradeLevelGuidance[gradeLevel] || gradeLevelGuidance["High School"]}

Difficulty: ${difficulty}
${difficultyGuidance[difficulty] || difficultyGuidance["Medium"]}${curriculumInstruction}${customSection}

Return a JSON object with exactly this structure (no markdown fences, just raw JSON):
{
  "title": "A clear title for this study set",
  "description": "A brief 1-sentence description",
  "flashcards": [
    {"front": "Question or term", "back": "Detailed answer or definition"}
  ],
  "quizQuestions": [
    {
      "question": "A clear multiple-choice question",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why the correct answer is right and briefly why each wrong option is incorrect",
      "hint": "A clue that guides thinking without giving the answer away"
    }
  ],
  "notes": [
    {
      "title": "Section title",
      "content": "Detailed notes in markdown format with ## headings, ### subheadings, **bold** terms, and - bullet points"
    }
  ]
}

Requirements:
- Generate exactly ${counts.flashcards} flashcards covering the most important concepts
- Generate exactly ${counts.quiz} quiz questions (multiple choice with 4 options each)
- Each quiz question MUST include a "hint" field: a brief clue that helps the student think through the answer without giving it away
- Explanations must address why the correct answer is right AND briefly note why each wrong option is incorrect
- Generate exactly ${counts.notes} detailed note section(s) covering the key topics
- Make content accurate, educational, and exam-focused
- Notes should be comprehensive with proper markdown formatting`;

    const completion = await getDeepseek().chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content:
            "You are an expert educational content creator. Always respond with valid JSON only, no markdown code fences.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    });

    const responseText = completion.choices[0]?.message?.content || "";

    // Parse JSON from response, handling potential markdown fences
    let jsonStr = responseText.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const studySet = JSON.parse(jsonStr);

    return NextResponse.json(studySet);
  } catch (error: unknown) {
    console.error("Generate API error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to generate study materials";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
