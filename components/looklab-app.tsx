"use client";
/* eslint-disable @next/next/no-img-element */

import type { ChangeEvent } from "react";
import { useMemo, useState } from "react";
import { BEAUTY_STYLES } from "@/lib/beauty-styles";

type GeneratedLook = {
  id: string;
  styleId: string;
  styleLabel: string;
  imageDataUrl: string;
  createdAt: string;
};

const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Could not read the image."));
      }
    };

    reader.onerror = () => reject(new Error("Could not read the image."));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not process the image."));
    image.src = dataUrl;
  });
}

async function prepareImageForUpload(file: File) {
  const originalDataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(originalDataUrl);
  const maxDimension = 1400;
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const width = Math.round(image.width * scale);
  const height = Math.round(image.height * scale);
  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not prepare the image.");
  }

  context.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", 0.92);
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = filename;
  anchor.click();
}

export function LookLabApp() {
  const [uploadedImage, setUploadedImage] = useState<string>("");
  const [uploadedFilename, setUploadedFilename] = useState<string>("looklab-selfie");
  const [selectedStyleId, setSelectedStyleId] = useState<string>(BEAUTY_STYLES[0].id);
  const [generatedLooks, setGeneratedLooks] = useState<GeneratedLook[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const selectedStyle = useMemo(
    () => BEAUTY_STYLES.find((style) => style.id === selectedStyleId) ?? BEAUTY_STYLES[0],
    [selectedStyleId],
  );

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setErrorMessage("");

    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      setErrorMessage("Upload a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("Use an image smaller than 10MB.");
      return;
    }

    try {
      const preparedImage = await prepareImageForUpload(file);
      const safeName = file.name.replace(/\.[^.]+$/, "") || "looklab-selfie";

      setUploadedImage(preparedImage);
      setUploadedFilename(safeName);
      setGeneratedLooks([]);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not prepare the image.",
      );
    } finally {
      event.target.value = "";
    }
  }

  async function handleGenerate() {
    if (!uploadedImage) {
      setErrorMessage("Upload a face photo first.");
      return;
    }

    setIsGenerating(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageDataUrl: uploadedImage,
          styleId: selectedStyleId,
        }),
      });

      const payload = (await response.json()) as
        | {
            error?: string;
            imageDataUrl?: string;
            styleId?: string;
            styleLabel?: string;
          }
        | undefined;

      if (
        !response.ok ||
        typeof payload?.imageDataUrl !== "string" ||
        typeof payload.styleId !== "string" ||
        typeof payload.styleLabel !== "string"
      ) {
        throw new Error(payload?.error || "Generation failed. Try a different photo or style.");
      }

      const nextLook: GeneratedLook = {
        id: crypto.randomUUID(),
        styleId: payload.styleId,
        styleLabel: payload.styleLabel,
        imageDataUrl: payload.imageDataUrl,
        createdAt: new Date().toISOString(),
      };

      setGeneratedLooks((current) => [nextLook, ...current]);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Generation failed. Please try again.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-[1440px] px-4 py-4 sm:px-6 lg:px-8">
        <section className="grid gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="rounded-[8px] border border-black/8 bg-white/85 p-4 shadow-[0_20px_60px_rgba(20,20,20,0.06)] backdrop-blur">
            <div className="flex items-start justify-between gap-4 border-b border-black/8 pb-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-rose-600">
                  LookLab
                </p>
                <h1 className="mt-1 text-2xl font-semibold text-black">
                  Beauty preview studio
                </h1>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">
                  Upload a selfie, pick one beauty style, generate one preview, then build a gallery
                  of more looks.
                </p>
              </div>
              <div className="grid min-w-[108px] gap-2 text-right text-[11px] text-slate-500">
                <span className="rounded-full border border-black/8 px-3 py-1">No account</span>
                <span className="rounded-full border border-black/8 px-3 py-1">Download only</span>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <section>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-black">1. Upload your photo</h2>
                  {uploadedImage ? (
                    <button
                      className="text-xs font-medium text-slate-500 transition hover:text-black"
                      onClick={() => {
                        setUploadedImage("");
                        setGeneratedLooks([]);
                        setErrorMessage("");
                      }}
                      type="button"
                    >
                      Reset
                    </button>
                  ) : null}
                </div>

                <label className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[8px] border border-dashed border-black/15 bg-slate-50 px-4 py-5 text-center transition hover:border-rose-300 hover:bg-rose-50/40">
                  <span className="text-sm font-medium text-black">Choose a clear face photo</span>
                  <span className="text-xs leading-5 text-slate-500">
                    JPG, PNG, or WebP. Best results come from a front-facing selfie with even
                    lighting.
                  </span>
                  <span className="rounded-full bg-black px-4 py-2 text-xs font-medium text-white">
                    Select image
                  </span>
                  <input
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={handleFileChange}
                    type="file"
                  />
                </label>

                {uploadedImage ? (
                  <div className="mt-3 overflow-hidden rounded-[8px] border border-black/8 bg-white">
                    <div className="aspect-[4/5] bg-slate-100">
                      <img
                        alt="Uploaded face preview"
                        className="h-full w-full object-cover"
                        src={uploadedImage}
                      />
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 text-xs text-slate-500">
                      <span className="truncate">{uploadedFilename}</span>
                      <span>Original</span>
                    </div>
                  </div>
                ) : null}
              </section>

              <section>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-black">2. Choose a beauty style</h2>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Start with one look. Generate more after the first preview.
                    </p>
                  </div>
                  <div className="rounded-full bg-rose-100 px-3 py-1 text-[11px] font-medium text-rose-700">
                    {selectedStyle.category}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  {BEAUTY_STYLES.map((style) => {
                    const isSelected = style.id === selectedStyleId;

                    return (
                      <button
                        className={`min-h-[68px] rounded-[8px] border px-3 py-3 text-left transition ${
                          isSelected
                            ? "border-rose-500 bg-rose-50 text-black shadow-[0_10px_24px_rgba(201,95,124,0.14)]"
                            : "border-black/8 bg-white text-slate-700 hover:border-black/20 hover:bg-slate-50"
                        }`}
                        key={style.id}
                        onClick={() => setSelectedStyleId(style.id)}
                        type="button"
                      >
                        <span className="block text-sm font-semibold">{style.label}</span>
                        <span className="mt-1 block text-[11px] uppercase tracking-[0.08em] text-slate-500">
                          {style.category}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-[8px] border border-black/8 bg-slate-950 px-4 py-4 text-white">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-white/55">
                      Selected look
                    </p>
                    <p className="mt-1 text-lg font-semibold">{selectedStyle.label}</p>
                  </div>
                  <div className="rounded-full bg-white/10 px-3 py-1 text-[11px] text-white/80">
                    Gemini AI
                  </div>
                </div>

                <button
                  className="mt-4 flex w-full items-center justify-center rounded-[8px] bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/30 disabled:text-white/70"
                  disabled={!uploadedImage || isGenerating}
                  onClick={handleGenerate}
                  type="button"
                >
                  {isGenerating
                    ? "Generating..."
                    : generatedLooks.length === 0
                      ? "Generate first preview"
                      : "Generate another variation"}
                </button>

                <p className="mt-3 text-xs leading-5 text-white/65">
                  This MVP keeps everything session-based. No accounts. No saved history.
                </p>
              </section>

              {errorMessage ? (
                <div className="rounded-[8px] border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-700">
                  {errorMessage}
                </div>
              ) : null}
            </div>
          </aside>

          <section className="rounded-[8px] border border-black/8 bg-white/78 p-4 shadow-[0_20px_60px_rgba(20,20,20,0.05)] backdrop-blur">
            <div className="flex flex-col gap-3 border-b border-black/8 pb-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-teal-700">
                  Generated gallery
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-black">
                  Your preview moodboard
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Each tile is one edited variation from your uploaded face. Keep generating styles
                  to build the board.
                </p>
              </div>
              <div className="flex gap-2 text-xs text-slate-500">
                <span className="rounded-full border border-black/8 px-3 py-1">
                  {generatedLooks.length} generated
                </span>
                <span className="rounded-full border border-black/8 px-3 py-1">Downloadable</span>
              </div>
            </div>

            {!uploadedImage ? (
              <div className="flex min-h-[560px] items-center justify-center rounded-[8px] border border-dashed border-black/10 bg-slate-50 text-center">
                <div className="max-w-md px-6">
                  <h3 className="text-xl font-semibold text-black">Start with one clear selfie</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    After upload, your generated previews will appear here in a visual gallery.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-4 columns-1 gap-4 sm:columns-2 xl:columns-3">
                <article className="mb-4 break-inside-avoid overflow-hidden rounded-[8px] border border-black/8 bg-white">
                  <div className="bg-slate-100">
                    <img
                      alt="Original uploaded face"
                      className="h-auto w-full object-cover"
                      src={uploadedImage}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3 px-3 py-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Original</p>
                      <p className="mt-1 text-sm font-semibold text-black">Uploaded photo</p>
                    </div>
                    <button
                      className="rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-black/20 hover:text-black"
                      onClick={() => downloadDataUrl(uploadedImage, `${uploadedFilename}-original.jpg`)}
                      type="button"
                    >
                      Download
                    </button>
                  </div>
                </article>

                {generatedLooks.map((look) => (
                  <article
                    className="mb-4 break-inside-avoid overflow-hidden rounded-[8px] border border-black/8 bg-white"
                    key={look.id}
                  >
                    <div className="bg-slate-100">
                      <img
                        alt={`${look.styleLabel} preview`}
                        className="h-auto w-full object-cover"
                        src={look.imageDataUrl}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3 px-3 py-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.12em] text-slate-400">
                          Generated look
                        </p>
                        <p className="mt-1 text-sm font-semibold text-black">{look.styleLabel}</p>
                      </div>
                      <button
                        className="rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-black/20 hover:text-black"
                        onClick={() =>
                          downloadDataUrl(
                            look.imageDataUrl,
                            `${uploadedFilename}-${look.styleId}.png`,
                          )
                        }
                        type="button"
                      >
                        Download
                      </button>
                    </div>
                  </article>
                ))}

                {isGenerating ? (
                  <article className="mb-4 break-inside-avoid rounded-[8px] border border-black/8 bg-white p-4">
                    <div className="aspect-[4/5] rounded-[8px] bg-gradient-to-b from-rose-50 to-slate-100" />
                    <div className="mt-3">
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-400">
                        In progress
                      </p>
                      <p className="mt-1 text-sm font-semibold text-black">
                        Building {selectedStyle.label}
                      </p>
                    </div>
                  </article>
                ) : null}
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
