import { env } from "@/lib/env";

type InlineData = { mimeType: string; data: string };

export async function generateGeminiStructured<T>(input: {
  system: string;
  prompt: string;
  schema: Record<string, unknown>;
  inlineData?: InlineData;
  timeoutMs?: number;
}): Promise<T> {
  const apiKey = env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const parts: Array<Record<string, unknown>> = [{ text: input.prompt }];
  if (input.inlineData) parts.push({ inlineData: input.inlineData });

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.GEMINI_MODEL)}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: input.system }] },
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
        responseJsonSchema: input.schema,
      },
    }),
    signal: AbortSignal.timeout(input.timeoutMs ?? 150_000),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: { status?: string; message?: string } } | null;
    throw new Error(`Gemini request failed (${response.status}, ${body?.error?.status ?? "unknown_error"})`);
  }

  const body = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }> };
  const text = body.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
  if (!text) throw new Error(`Gemini returned no structured output (${body.candidates?.[0]?.finishReason ?? "unknown"})`);
  return JSON.parse(text) as T;
}
