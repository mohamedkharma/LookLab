import { NextResponse } from "next/server";
import { getBeautyStyle } from "@/lib/beauty-styles";

export const runtime = "nodejs";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-3.1-flash-image-preview";

type GeneratePayload = {
  imageDataUrl?: string;
  styleId?: string;
  intensity?: "subtle" | "balanced" | "dramatic";
};

type OpenRouterResponse = {
  error?: {
    message?: string;
  };
  choices?: Array<{
    message?: {
      content?: string;
      images?: Array<{
        image_url?: {
          url?: string;
        };
      }>;
    };
  }>;
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

export async function POST(request: Request) {
  try {
    const { imageDataUrl, styleId, intensity } = (await request.json()) as GeneratePayload;
    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENROUTER_API_KEY. Add it to your .env.local or .env file." },
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

    const safeIntensity =
      intensity === "subtle" || intensity === "balanced" || intensity === "dramatic"
        ? intensity
        : "balanced";

    const imagePart = parseDataUrl(imageDataUrl);

    if (!imagePart) {
      return NextResponse.json(
        { error: "Invalid image format. Please upload a JPG, PNG, or WebP photo." },
        { status: 400 },
      );
    }

    const prompt = `
Create a single realistic beauty preview from the uploaded selfie.

Transformation to apply:
${style.prompt}

Requested intensity:
${safeIntensity}

Requirements:
- Keep the exact same person and preserve recognizability.
- Preserve pose, framing, gaze direction, hairline, expression, and overall lighting.
- Do not mirror, flip, rotate, zoom, crop, or reframe the face.
- Keep the same left-right orientation and the same camera distance as the input image.
- Make only the requested change. Do not add unrelated edits.
- Keep the result tasteful, photorealistic, and aligned to the requested intensity.
- If intensity is subtle, make the change refined and conservative.
- If intensity is balanced, make the change clearly visible but still natural.
- If intensity is dramatic, make the change stronger while keeping the same person believable.
- Maintain believable skin texture and human detail.
- Keep this as a visual simulation only, not a medical or treatment claim.
- Return one edited portrait image only.
- No text, no split screen, no collage, no watermark, no extra objects, no background change.
`.trim();

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        modalities: ["image", "text"],
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${imagePart.mimeType};base64,${imagePart.data}`,
                },
              },
            ],
          },
        ],
      }),
    });

    const payload = (await response.json()) as OpenRouterResponse;
    const message = payload.choices?.[0]?.message;
    const generatedImage = message?.images?.[0]?.image_url?.url;
    const modelNotes =
      typeof message?.content === "string" ? message.content.trim() : "";

    if (!response.ok || !generatedImage) {
      return NextResponse.json(
        {
          error:
            payload.error?.message ||
            modelNotes ||
            "OpenRouter did not return an image for this request. Try a different photo or style.",
        },
        { status: response.ok ? 502 : response.status },
      );
    }

    return NextResponse.json({
      styleId,
      styleLabel: style.label,
      intensity: safeIntensity,
      imageDataUrl: generatedImage,
      modelNotes,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate preview.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
