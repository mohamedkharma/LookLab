import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { getBeautyStyle } from "@/lib/beauty-styles";

export const runtime = "nodejs";

type GeneratePayload = {
  imageDataUrl?: string;
  styleId?: string;
};

type CandidatePart = {
  text?: string;
  inlineData?: {
    mimeType?: string;
    data?: string;
  };
};

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

  if (!match) {
    return null;
  }

  return {
    mimeType: match[1],
    data: match[2],
  };
}

function hasInlineData(part: CandidatePart) {
  return Boolean(part.inlineData?.data && part.inlineData?.mimeType);
}

function hasText(part: CandidatePart) {
  return typeof part.text === "string" && part.text.trim().length > 0;
}

export async function POST(request: Request) {
  try {
    const { imageDataUrl, styleId } = (await request.json()) as GeneratePayload;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY. Add it to your .env.local file." },
        { status: 500 },
      );
    }

    if (!imageDataUrl || !styleId) {
      return NextResponse.json(
        { error: "Image and beauty style are required." },
        { status: 400 },
      );
    }

    const style = getBeautyStyle(styleId);

    if (!style) {
      return NextResponse.json({ error: "Unknown beauty style." }, { status: 400 });
    }

    const imagePart = parseDataUrl(imageDataUrl);

    if (!imagePart) {
      return NextResponse.json(
        { error: "Invalid image format. Please upload a JPG, PNG, or WebP photo." },
        { status: 400 },
      );
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const prompt = `
Create a single realistic beauty preview from the uploaded selfie.

Transformation to apply:
${style.prompt}

Requirements:
- Keep the exact same person and preserve recognizability.
- Preserve pose, framing, gaze direction, hairline, expression, and overall lighting.
- Make only the requested change. Do not add unrelated edits.
- Keep the result tasteful, photorealistic, and subtle but visible.
- Maintain believable skin texture and human detail.
- Return one edited portrait image only.
- No text, no split screen, no collage, no watermark, no extra objects, no background change.
`.trim();

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: [
        { text: prompt },
        {
          inlineData: {
            mimeType: imagePart.mimeType,
            data: imagePart.data,
          },
        },
      ],
      config: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    });

    const parts = (response.candidates?.[0]?.content?.parts ?? []) as CandidatePart[];
    const generatedImage = parts.find(hasInlineData);
    const modelNotes = parts
      .filter(hasText)
      .map((part) => part.text)
      .join("\n")
      .trim();

    if (!generatedImage || !generatedImage.inlineData?.data || !generatedImage.inlineData?.mimeType) {
      return NextResponse.json(
        {
          error:
            modelNotes ||
            "Gemini did not return an image for this request. Try a different photo or style.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      styleId,
      styleLabel: style.label,
      imageDataUrl: `data:${generatedImage.inlineData.mimeType};base64,${generatedImage.inlineData.data}`,
      modelNotes,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate preview.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
