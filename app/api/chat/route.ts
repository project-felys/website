import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  return await fetch(
    `${process.env.OPENAI_SERVICE_PROVIDER}/v1/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages,
        stream: true,
        temperature: 0.5,
        top_p: 0.8,
        presence_penalty: 1.0,
        extra_body: { top_k: 20 },
      }),
    },
  );
}
