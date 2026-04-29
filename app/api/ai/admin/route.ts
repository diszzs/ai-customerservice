import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { getSessionByToken } from "@/lib/session-store";
import {
  createOpenRouterChatCompletion,
  type OpenRouterMessage,
} from "@/lib/openrouter";

type AdminChatMessage = {
  sender: "assistant" | "user";
  text: string;
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
      messages?: AdminChatMessage[];
    };

    const messages = body.messages ?? [];

    if (messages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Pesan tidak boleh kosong",
        },
        { status: 400 },
      );
    }

    const openRouterMessages: OpenRouterMessage[] = [
      {
        role: "system",
        content:
          session.role === "admin"
            ? "Anda adalah asisten AI untuk administrator e-learning. Jawab dalam bahasa Indonesia dengan jelas, praktis, ringkas, dan siap pakai. Anda membantu topik seperti user management, dashboard, materi, skenario chatbot, evaluasi, rubrik, dan operasional sistem."
            : "Anda adalah asisten AI untuk dosen e-learning. Jawab dalam bahasa Indonesia dengan jelas, praktis, ringkas, dan siap pakai. Anda membantu topik seperti materi, tugas, kuis, evaluasi, rubric, dan aktivitas pembelajaran.",
      },
      ...messages.map<OpenRouterMessage>((message) => ({
          role: message.sender === "assistant" ? "assistant" : "user",
          content: message.text,
      })),
    ];

    const reply = await createOpenRouterChatCompletion({
      messages: openRouterMessages,
      temperature: 0.7,
      max_completion_tokens: 350,
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
    console.error("Admin AI chat error:", error);
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
