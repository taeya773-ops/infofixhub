import { env } from "@/lib/env";

export async function generateGeminiGuideImage(input: {
  title: string;
  requiredScreen: string;
  caption: string;
  prompt?: string | null;
}) {
  const apiKey = env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const prompt = [
    "검색 가이드에 사용할 사실 기반의 편집용 참고 이미지를 만드세요.",
    "실제 웹사이트 캡처, 앱 UI, 공식 시간표, 공식 문서처럼 위장하지 마세요.",
    "존재하지 않는 버튼, 가격, 시간, 로고, 계정 정보, 개인정보를 넣지 마세요.",
    "사진처럼 단정할 수 없는 경우 깔끔한 여행 가이드 일러스트 또는 정보 도식으로 표현하세요.",
    "이미지 안에 'AI 생성 참고 이미지'라는 작은 한국어 표기를 넣으세요.",
    `글 제목: ${input.title}`,
    `필요한 장면: ${input.requiredScreen}`,
    `예정 캡션: ${input.caption}`,
    input.prompt ? `기존 보완 지시: ${input.prompt}` : "",
  ].filter(Boolean).join("\n");

  const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(env.GEMINI_IMAGE_MODEL)}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ["IMAGE"],
        responseFormat: { image: { aspectRatio: "16:9", imageSize: "1K" } },
      },
    }),
    signal: AbortSignal.timeout(180_000),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: { status?: string; message?: string } } | null;
    throw new Error(`Gemini image request failed (${response.status}, ${body?.error?.status ?? "unknown_error"}): ${body?.error?.message ?? "No error message returned"}`);
  }

  const body = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { mimeType?: string; data?: string } }> } }> };
  const image = body.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data)?.inlineData;
  if (!image?.data) throw new Error("Gemini image model returned no image");
  const bytes = new Uint8Array(Buffer.from(image.data, "base64"));
  if (bytes.byteLength > 8 * 1024 * 1024) throw new Error("Generated image exceeds 8MB");
  return { bytes, mimeType: image.mimeType || "image/png" };
}
