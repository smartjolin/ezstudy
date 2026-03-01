import { NextRequest, NextResponse } from "next/server";
import { getDeepseek } from "@/lib/deepseek";
import { rateLimit } from "@/lib/rate-limit";

export const maxDuration = 60; // Allow up to 60s for AI generation

export async function POST(req: NextRequest) {
  // Rate limit: 5 generations per minute per IP
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const rl = rateLimit(`generate:${ip}`, 5, 60000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment before generating again." },
      { status: 429 }
    );
  }

  try {
    const {
      topic,
      materialContent,
      gradeLevel = "High School",
      difficulty = "Medium",
      curriculum = "None",
      subject = "General",
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

    // Subject-specific generation guidance
    const subjectGuidance: Record<string, string> = {
      English: `Subject: English Language Arts
- Flashcards: Focus on vocabulary (word → definition + example sentence + part of speech), literary terms, and grammar rules
- Quiz questions: Include reading comprehension, grammar usage, vocabulary-in-context, and sentence completion questions
- Notes: Organize by themes, literary devices, grammar concepts, or vocabulary categories
- Include example sentences that are relatable to middle school students`,
      Science: `Subject: Science
- Flashcards: Focus on scientific terms (term → clear explanation), processes, and key concepts
- Quiz questions: Include experiment-based questions, cause-and-effect, diagram interpretation, and process-ordering questions
- Notes: Use clear structure with definitions, key processes, real-world applications, and "why it matters" sections
- Include descriptions of experiments or observable phenomena where relevant`,
      Maths: `Subject: Mathematics
- Flashcards: Focus on formulas, definitions, and key theorems (concept → formula + when to use it + example)
- Quiz questions: Include calculation problems, word problems, and conceptual understanding questions
- Notes: Include step-by-step worked examples, common mistakes to avoid, and practice problem setups
- Show problem-solving strategies and multiple approaches where applicable`,
      History: `Subject: History
- Flashcards: Focus on key events, dates, people, and cause-effect relationships
- Quiz questions: Include timeline ordering, cause-and-effect, primary source interpretation, and comparison questions
- Notes: Organize chronologically or thematically with context, significance, and connections between events
- Include perspective and significance — why events matter, not just what happened`,
    };

    const subjectSection =
      subject && subject !== "General" && subjectGuidance[subject]
        ? `\n${subjectGuidance[subject]}`
        : "";

    // Build custom instructions section
    const customSection = customInstructions
      ? `\nAdditional Instructions from the user: ${customInstructions}`
      : "";

    const source = materialContent
      ? `the following study material:\n\n${materialContent}`
      : `the topic: "${topic}"`;

    // Vocabulary builder: if subject is English and topic/content looks like a word list
    const isVocabMode =
      subject === "English" &&
      (topic?.toLowerCase().includes("vocab") ||
        topic?.toLowerCase().includes("word") ||
        customInstructions?.toLowerCase().includes("vocab"));

    const vocabInstruction = isVocabMode
      ? `\nVOCABULARY BUILDER MODE:
- Each flashcard MUST follow this format — Front: the word | Back: [Part of speech] Definition. Example sentence using the word in context. Synonyms: list 2-3 synonyms
- Quiz questions should focus on vocabulary-in-context: "Choose the correct word to fill the blank: ___"
- Also include definition matching and synonym/antonym questions
- Notes should organize words into categories (if applicable) with usage tips`
      : "";

    const prompt = `You are an expert educational content creator. Generate a complete study set from ${source}.

Grade Level: ${gradeLevel}
${gradeLevelGuidance[gradeLevel] || gradeLevelGuidance["High School"]}

Difficulty: ${difficulty}
${difficultyGuidance[difficulty] || difficultyGuidance["Medium"]}${curriculumInstruction}${subjectSection}${vocabInstruction}${customSection}

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

    // User-friendly error messages
    if (error instanceof Error) {
      if (error.name === "AbortError" || error.message.includes("timeout")) {
        return NextResponse.json(
          { error: "The AI is taking too long. Please try again with a shorter topic or less content." },
          { status: 504 }
        );
      }
      if (error.message.includes("JSON")) {
        return NextResponse.json(
          { error: "The AI returned an unexpected format. Please try again." },
          { status: 502 }
        );
      }
      if (error.message.includes("rate") || error.message.includes("429")) {
        return NextResponse.json(
          { error: "Too many requests. Please wait a moment and try again." },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to generate study materials. Please try again." },
      { status: 500 }
    );
  }
}
