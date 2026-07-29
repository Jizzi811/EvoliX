import OpenAI from "openai";
import { buildEvoliXPrompt, type EvoliXMode } from "@/lib/evolix-prompt";

export const runtime = "nodejs";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatRequest = {
  messages?: ChatMessage[];
  mode?: EvoliXMode;
};

const validModes = new Set<EvoliXMode>([
  "companion",
  "pokemon",
  "anime",
  "quest",
]);

function sanitizeMessages(messages: ChatMessage[] | undefined) {
  return (messages ?? [])
    .filter(
      (message) =>
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim(),
    )
    .slice(-16)
    .map((message) => ({
      role: message.role,
      content: message.content.trim().slice(0, 4_000),
    }));
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: "EvoliX' KI-Zugang ist noch nicht eingerichtet." },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as ChatRequest;
    const messages = sanitizeMessages(body.messages);
    const mode =
      body.mode && validModes.has(body.mode) ? body.mode : "companion";

    if (!messages.length || messages.at(-1)?.role !== "user") {
      return Response.json(
        { error: "Bitte sende EvoliX eine Nachricht." },
        { status: 400 },
      );
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      reasoning: { effort: mode === "pokemon" ? "medium" : "low" },
      instructions: buildEvoliXPrompt(mode),
      input: messages,
      max_output_tokens: 700,
    });

    const answer = response.output_text.trim();
    if (!answer) throw new Error("empty_response");

    return Response.json({ message: answer });
  } catch (error) {
    console.error("[EvoliX chat]", error);
    return Response.json(
      { error: "Die Verbindung zur Kristallbibliothek ist gerade gestört." },
      { status: 502 },
    );
  }
}
