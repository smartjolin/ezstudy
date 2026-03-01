import { NextRequest, NextResponse } from "next/server";
import { deepseek } from "@/lib/deepseek";

type ChatMode = "normal" | "socratic" | "quiz_me" | "explain_simply";

interface QuizHistoryItem {
  question: string;
  isCorrect: boolean;
  topic: string;
}

interface FlashcardPerformance {
  totalCards: number;
  masteredCount: number;
  learningCount: number;
  newCount: number;
  weakCards: { front: string; back: string; easeFactor: number }[];
}

function buildSystemPrompt(
  studySetTitle: string,
  studySetDescription: string,
  mode: ChatMode,
  quizHistory?: QuizHistoryItem[],
  flashcardPerformance?: FlashcardPerformance
): string {
  let basePrompt = `You are Spark.E, an enthusiastic and knowledgeable AI tutor on the EzStudy platform. You are helping a student study "${studySetTitle}" (${studySetDescription}).

Your personality:
- Friendly, encouraging, and patient
- You use clear explanations with examples and analogies
- You break complex topics into digestible pieces
- You use markdown formatting: **bold** for key terms, bullet points for lists
- You ask follow-up questions to check understanding
- Keep responses concise but thorough (2-4 paragraphs max)
- When appropriate, suggest related topics the student should explore
- Periodically offer study strategy tips: spacing out review sessions, self-testing before re-reading, and explaining concepts in your own words
- When a student struggles with a concept, ask them to explain their thinking before giving help
- Suggest switching between flashcards and quizzes for variety when appropriate`;

  // Mode-specific instructions
  switch (mode) {
    case "socratic":
      basePrompt += `

IMPORTANT MODE: SOCRATIC METHOD
You must NEVER give direct answers. Instead:
- Ask leading questions to guide the student to discover the answer themselves
- Break complex problems into smaller sub-questions
- When the student answers correctly, acknowledge it and ask a deeper follow-up
- When the student is wrong, gently redirect with another guiding question
- Use the Socratic method throughout: question, probe, challenge assumptions
- Example: Instead of "The mitochondria produces ATP", ask "What organelle do you think is responsible for energy production? What clues from its structure might tell you its function?"`;
      break;

    case "quiz_me":
      basePrompt += `

IMPORTANT MODE: QUIZ ME
You must generate rapid-fire questions one at a time:
- Ask ONE question at a time about the study material
- Wait for the student's answer before asking the next question
- After the student answers, briefly evaluate whether they are correct or incorrect
- If incorrect, provide the correct answer with a short explanation
- Then immediately ask the next question
- Mix question types: multiple choice, fill-in-the-blank, true/false, short answer
- Increase difficulty gradually
- Keep track of how many the student gets right and encourage them`;
      break;

    case "explain_simply":
      basePrompt += `

IMPORTANT MODE: EXPLAIN SIMPLY
You must explain everything as if the student is 12 years old:
- Use very simple, everyday language
- Avoid jargon; if you must use a technical term, immediately explain it in simple words
- Use analogies, metaphors, and real-world examples the student can relate to
- Compare complex concepts to things like games, food, sports, or everyday objects
- Use short sentences and paragraphs
- Example: Instead of "Mitosis is a process of cell division resulting in two daughter cells", say "Imagine a cell is like a cookie recipe. Mitosis is when the cell makes a perfect copy of its recipe, then splits into two new cells - each one gets the same complete recipe!"`;
      break;

    default:
      // Normal mode - original behavior
      basePrompt += `

If the student asks you to quiz them, create a quick multiple-choice question about the topic.
If they seem confused, try explaining the concept a different way.`;
      break;
  }

  // Add quiz history context if available
  if (quizHistory && quizHistory.length > 0) {
    const totalQuestions = quizHistory.length;
    const correctCount = quizHistory.filter((q) => q.isCorrect).length;
    const incorrectQuestions = quizHistory.filter((q) => !q.isCorrect);
    const weakTopics = [...new Set(incorrectQuestions.map((q) => q.topic))];

    basePrompt += `

STUDENT QUIZ PERFORMANCE:
The student has answered ${totalQuestions} quiz questions so far, getting ${correctCount} correct (${Math.round((correctCount / totalQuestions) * 100)}%).`;

    if (weakTopics.length > 0) {
      basePrompt += `
The student struggled with these areas: ${weakTopics.join(", ")}.
When relevant, pay extra attention to these weak areas. Offer to review them. Provide additional explanation and practice for topics the student found difficult.`;
    }

    if (incorrectQuestions.length > 0) {
      basePrompt += `
Recent incorrect answers:`;
      incorrectQuestions.slice(-5).forEach((q) => {
        basePrompt += `
- "${q.question}"`;
      });
    }
  }

  // Add flashcard performance context if available
  if (flashcardPerformance && flashcardPerformance.totalCards > 0) {
    basePrompt += `

FLASHCARD PROGRESS:
The student has reviewed flashcards: ${flashcardPerformance.masteredCount} mastered, ${flashcardPerformance.learningCount} learning, ${flashcardPerformance.newCount} new out of ${flashcardPerformance.totalCards} total.`;

    if (flashcardPerformance.weakCards.length > 0) {
      basePrompt += `
Cards the student struggles with most:`;
      flashcardPerformance.weakCards.slice(0, 5).forEach((c) => {
        basePrompt += `
- "${c.front}" (ease: ${c.easeFactor.toFixed(1)})`;
      });
      basePrompt += `
When relevant, help the student understand these difficult concepts. Proactively offer to work on weak areas.`;
    }
  }

  return basePrompt;
}

export async function POST(req: NextRequest) {
  try {
    const {
      messages,
      studySetTitle,
      studySetDescription,
      mode = "normal",
      quizHistory,
      flashcardPerformance,
    } = await req.json();

    const systemPrompt = buildSystemPrompt(
      studySetTitle,
      studySetDescription,
      mode as ChatMode,
      quizHistory as QuizHistoryItem[] | undefined,
      flashcardPerformance as FlashcardPerformance | undefined
    );

    const completion = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 1024,
      stream: true,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
            );
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    console.error("Chat API error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to get AI response";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
