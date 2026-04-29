import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { getSessionByToken } from "@/lib/session-store";
import {
  createOpenRouterChatCompletion,
  type OpenRouterMessage,
} from "@/lib/openrouter";

type CustomerChatMessage = {
  sender: "bot" | "user";
  text: string;
};

type ScenarioPayload = {
  title: string;
  category: string;
  emotion: string;
  product: string;
  urgency: string;
  opening: string;
  goodResponseHint: string;
};

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Belum login",
        },
        { status: 401 },
      );
    }

    const session = await getSessionByToken(token);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Sesi tidak valid",
        },
        { status: 401 },
      );
    }

    const body = (await request.json()) as {
      scenario?: ScenarioPayload;
      messages?: CustomerChatMessage[];
    };

    if (!body.scenario || !body.messages || body.messages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Data percakapan tidak lengkap",
        },
        { status: 400 },
      );
    }

    const { scenario, messages } = body;

    const openRouterMessages: OpenRouterMessage[] = [
      {
        role: "system",
        content: `Anda berperan sebagai pelanggan yang sedang komplain dalam simulasi customer service. Tetap konsisten sebagai pelanggan, jangan berubah menjadi asisten, dosen, atau evaluator. Jawab dalam bahasa Indonesia. Tunjukkan emosi dan urgensi sesuai skenario, tetapi tetap masuk akal. Jangan beri solusi dari sisi customer service. Fokus Anda adalah menyampaikan keluhan, pertanyaan lanjutan, keraguan, atau tuntutan pelanggan.

Skenario:
- Judul: ${scenario.title}
- Kategori: ${scenario.category}
- Emosi: ${scenario.emotion}
- Produk: ${scenario.product}
- Urgensi: ${scenario.urgency}
- Pembuka awal: ${scenario.opening}
- Acuan respons ideal trainee: ${scenario.goodResponseHint}`,
      },
      ...messages.map<OpenRouterMessage>((message) => ({
        role: message.sender === "bot" ? "assistant" : "user",
        content: message.text,
      })),
    ];

    const reply = await createOpenRouterChatCompletion({
      messages: openRouterMessages,
      temperature: 0.9,
      max_completion_tokens: 220,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          reply,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Customer AI chat error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat menghubungi OpenRouter",
      },
      { status: 500 },
    );
  }
}
