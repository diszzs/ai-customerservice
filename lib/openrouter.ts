export type OpenRouterMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type OpenRouterChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
};

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";

export async function createOpenRouterChatCompletion(input: {
  messages: OpenRouterMessage[];
  temperature?: number;
  max_completion_tokens?: number;
}) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY belum dikonfigurasi");
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL ?? "http://localhost:3000",
      "X-Title": process.env.OPENROUTER_SITE_NAME ?? "AI Customer Service",
    },
    body: JSON.stringify({
      model: DEFAULT_OPENROUTER_MODEL,
      messages: input.messages,
      temperature: input.temperature ?? 0.7,
      max_completion_tokens: input.max_completion_tokens ?? 300,
    }),
  });

  const payload = (await response.json()) as OpenRouterChatResponse;

  if (!response.ok) {
    throw new Error(
      payload.error?.message ?? "Permintaan ke OpenRouter gagal",
    );
  }

  const content = payload.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("OpenRouter tidak mengembalikan jawaban");
  }

  return content;
}
