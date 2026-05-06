"use client";
/* eslint-disable @next/next/no-img-element */

import type { ChangeEvent, PointerEvent as ReactPointerEvent, SVGProps } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { BEAUTY_STYLES } from "@/lib/beauty-styles";

type Intensity = "subtle" | "balanced" | "dramatic";
type StyleCategory = "All" | "Shape" | "Eyes" | "Skin" | "Finish";
type ThemeMode = "light" | "dark";

type GeneratedLook = {
  id: string;
  styleId: string;
  styleLabel: string;
  category: Exclude<StyleCategory, "All">;
  intensity: Intensity;
  imageDataUrl: string;
  createdAt: string;
};

const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const STYLE_CATEGORIES: StyleCategory[] = ["All", "Shape", "Eyes", "Skin", "Finish"];
const THEME_STORAGE_KEY = "looklab-theme";
const INTENSITY_OPTIONS: Array<{
  value: Intensity;
  label: string;
  description: string;
}> = [
  { value: "subtle", label: "Subtle", description: "A lighter, safer edit." },
  { value: "balanced", label: "Balanced", description: "Natural but clearly visible." },
  { value: "dramatic", label: "Dramatic", description: "Stronger while still believable." },
];

function LookLabLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 64 64" {...props}>
      <rect
        fill="url(#looklab-glow)"
        height="64"
        rx="22"
        width="64"
      />
      <path
        d="M19 19.5C24.4 14.4 31.1 13.2 36.3 14.4C41 15.5 44.2 18.2 46 20"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="3.25"
      />
      <path
        d="M18 44.5C22.5 49.8 29.8 51.7 36.2 49.9C42 48.2 46 44.2 48 39.8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="3.25"
      />
      <path
        d="M27.5 18V46"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="3.25"
      />
      <circle cx="41.5" cy="23.5" fill="currentColor" r="2.5" />
      <path
        d="M40.5 30.5C42.7 31.2 44.7 33 45.6 35.2C46.4 33 48.3 31.2 50.5 30.5C48.3 29.8 46.4 28 45.6 25.8C44.7 28 42.7 29.8 40.5 30.5Z"
        fill="currentColor"
      />
      <defs>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id="looklab-glow"
          x1="9"
          x2="58"
          y1="8"
          y2="57"
        >
          <stop stopColor="#f586a6" />
          <stop offset="0.52" stopColor="#f3c9d3" />
          <stop offset="1" stopColor="#87d4c7" />
        </linearGradient>
      </defs>
    </svg>
  );
}

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

function getBatchRecommendations(
  selectedStyleId: string,
  selectedCategory: StyleCategory,
  generatedLooks: GeneratedLook[],
) {
  const usedStyleIds = new Set(generatedLooks.map((look) => look.styleId));
  const categoryPool =
    selectedCategory === "All"
      ? BEAUTY_STYLES
      : BEAUTY_STYLES.filter((style) => style.category === selectedCategory);

  const primary = categoryPool.filter(
    (style) => style.id !== selectedStyleId && !usedStyleIds.has(style.id),
  );

  if (primary.length >= 4) {
    return primary.slice(0, 4);
  }

  const fallback = BEAUTY_STYLES.filter(
    (style) => style.id !== selectedStyleId && !usedStyleIds.has(style.id),
  );

  return [...primary, ...fallback].slice(0, 4);
}

function getThemeLabel(theme: ThemeMode) {
  return theme === "dark" ? "Dark" : "Light";
}

export function LookLabApp() {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [hasMounted, setHasMounted] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string>("");
  const [uploadedFilename, setUploadedFilename] = useState<string>("looklab-selfie");
  const [selectedStyleId, setSelectedStyleId] = useState<string>(BEAUTY_STYLES[0].id);
  const [selectedCategory, setSelectedCategory] = useState<StyleCategory>("All");
  const [selectedIntensity, setSelectedIntensity] = useState<Intensity>("balanced");
  const [generatedLooks, setGeneratedLooks] = useState<GeneratedLook[]>([]);
  const [favoriteLookIds, setFavoriteLookIds] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [compareLookId, setCompareLookId] = useState<string>("");
  const [comparePosition, setComparePosition] = useState(50);
  const [isGenerating, setIsGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ done: number; total: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const compareStageRef = useRef<HTMLDivElement | null>(null);
  const isDraggingCompareRef = useRef(false);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const preferredTheme =
      storedTheme === "light" || storedTheme === "dark"
        ? storedTheme
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "dark";

    const frameId = window.requestAnimationFrame(() => {
      setTheme(preferredTheme);
      setHasMounted(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (!hasMounted) {
      return;
    }

    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [hasMounted, theme]);

  const selectedStyle = useMemo(
    () => BEAUTY_STYLES.find((style) => style.id === selectedStyleId) ?? BEAUTY_STYLES[0],
    [selectedStyleId],
  );
  const visibleStyles = useMemo(
    () =>
      selectedCategory === "All"
        ? BEAUTY_STYLES
        : BEAUTY_STYLES.filter((style) => style.category === selectedCategory),
    [selectedCategory],
  );
  const compareLook = useMemo(
    () => generatedLooks.find((look) => look.id === compareLookId) ?? generatedLooks[0],
    [compareLookId, generatedLooks],
  );
  const visibleLooks = useMemo(() => {
    if (!showFavoritesOnly) {
      return generatedLooks;
    }

    const favoriteIds = new Set(favoriteLookIds);
    return generatedLooks.filter((look) => favoriteIds.has(look.id));
  }, [favoriteLookIds, generatedLooks, showFavoritesOnly]);
  const batchRecommendations = useMemo(
    () => getBatchRecommendations(selectedStyleId, selectedCategory, generatedLooks),
    [generatedLooks, selectedCategory, selectedStyleId],
  );

  async function requestGeneration(styleId: string, intensity: Intensity) {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageDataUrl: uploadedImage,
        styleId,
        intensity,
      }),
    });

    const payload = (await response.json()) as
      | {
          error?: string;
          imageDataUrl?: string;
          styleId?: string;
          styleLabel?: string;
          intensity?: Intensity;
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

    const style = BEAUTY_STYLES.find((item) => item.id === payload.styleId);

    if (!style) {
      throw new Error("The generated style could not be matched.");
    }

    return {
      id: crypto.randomUUID(),
      styleId: payload.styleId,
      styleLabel: payload.styleLabel,
      category: style.category,
      intensity: payload.intensity ?? intensity,
      imageDataUrl: payload.imageDataUrl,
      createdAt: new Date().toISOString(),
    } satisfies GeneratedLook;
  }

  function insertLook(nextLook: GeneratedLook) {
    setGeneratedLooks((current) => [nextLook, ...current]);
    setCompareLookId(nextLook.id);
  }

  function resetSession() {
    setUploadedImage("");
    setGeneratedLooks([]);
    setFavoriteLookIds([]);
    setCompareLookId("");
    setErrorMessage("");
    setBatchProgress(null);
    setShowFavoritesOnly(false);
  }

  function toggleFavorite(lookId: string) {
    setFavoriteLookIds((current) =>
      current.includes(lookId) ? current.filter((id) => id !== lookId) : [lookId, ...current],
    );
  }

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
      setFavoriteLookIds([]);
      setCompareLookId("");
      setShowFavoritesOnly(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not prepare the image.",
      );
    } finally {
      event.target.value = "";
    }
  }

  function handleCategoryChange(category: StyleCategory) {
    setSelectedCategory(category);

    if (category === "All") {
      return;
    }

    const nextVisibleStyles = BEAUTY_STYLES.filter((style) => style.category === category);
    const hasVisibleStyle = nextVisibleStyles.some((style) => style.id === selectedStyleId);

    if (!hasVisibleStyle && nextVisibleStyles[0]) {
      setSelectedStyleId(nextVisibleStyles[0].id);
    }
  }

  function updateComparePosition(clientX: number) {
    const compareStage = compareStageRef.current;

    if (!compareStage) {
      return;
    }

    const bounds = compareStage.getBoundingClientRect();
    const relativePosition = ((clientX - bounds.left) / bounds.width) * 100;
    const clampedPosition = Math.min(100, Math.max(0, relativePosition));

    setComparePosition(clampedPosition);
  }

  function handleComparePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    isDraggingCompareRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateComparePosition(event.clientX);
  }

  function handleComparePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isDraggingCompareRef.current) {
      return;
    }

    updateComparePosition(event.clientX);
  }

  function handleComparePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    isDraggingCompareRef.current = false;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
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
      const nextLook = await requestGeneration(selectedStyleId, selectedIntensity);
      insertLook(nextLook);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Generation failed. Please try again.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleBatchGenerate() {
    if (!uploadedImage) {
      setErrorMessage("Upload a face photo first.");
      return;
    }

    if (generatedLooks.length === 0) {
      setErrorMessage("Generate one preview first before creating a batch.");
      return;
    }

    if (batchRecommendations.length === 0) {
      setErrorMessage("No new recommended looks are available right now.");
      return;
    }

    setIsGenerating(true);
    setErrorMessage("");
    setBatchProgress({ done: 0, total: batchRecommendations.length });

    try {
      for (let index = 0; index < batchRecommendations.length; index += 1) {
        const style = batchRecommendations[index];
        const nextLook = await requestGeneration(style.id, selectedIntensity);
        insertLook(nextLook);
        setBatchProgress({ done: index + 1, total: batchRecommendations.length });
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Batch generation failed. Please try again.",
      );
    } finally {
      setIsGenerating(false);
      setBatchProgress(null);
    }
  }

  return (
    <main className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4">
        <header className="looklab-panel overflow-hidden px-5 py-5 sm:px-7">
          <div className="absolute inset-0 opacity-70">
            <div className="looklab-orb left-[-7%] top-[-20%] h-40 w-40" />
            <div className="looklab-orb looklab-orb-secondary right-[-3%] top-0 h-36 w-36" />
          </div>

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="looklab-brand-mark flex h-16 w-16 items-center justify-center rounded-[22px] text-[#141414] shadow-[0_16px_40px_rgba(241,122,157,0.28)]">
                <LookLabLogo className="h-12 w-12" />
              </div>
              <div className="max-w-2xl">
                <p className="looklab-kicker">LookLab Studio</p>
                <h1 className="looklab-display mt-2 text-3xl text-[color:var(--foreground)] sm:text-4xl">
                  Professional beauty previews with a calmer, more trusted feel.
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-[color:var(--muted)] sm:text-[15px]">
                  Upload one selfie, compare edits carefully, and save only the looks that feel
                  true to the person in the original photo.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:items-end">
              <button
                aria-label="Toggle light and dark mode"
                aria-pressed={theme === "dark"}
                className="looklab-button-ghost w-full justify-center sm:w-auto"
                onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
                type="button"
              >
                <span className="rounded-full border border-[color:var(--line-strong)] px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  {getThemeLabel(theme)}
                </span>
                <span>{theme === "dark" ? "Use light mode" : "Use dark mode"}</span>
              </button>

              <div className="flex flex-wrap gap-2">
                <span className="looklab-badge">Private session</span>
                <span className="looklab-badge">No account required</span>
                <span className="looklab-badge">Simulation only</span>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[390px_minmax(0,1fr)]">
          <aside className="looklab-panel px-4 py-4 sm:px-5">
            <div className="looklab-panel-soft rounded-[28px] px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="looklab-brand-mark flex h-12 w-12 items-center justify-center rounded-[18px] text-[#141414]">
                    <LookLabLogo className="h-9 w-9" />
                  </div>
                  <div>
                    <p className="looklab-kicker">LookLab</p>
                    <h2 className="looklab-display mt-1 text-2xl text-[color:var(--foreground)]">
                      Beauty preview studio
                    </h2>
                  </div>
                </div>
                <div className="flex flex-col gap-2 text-right">
                  <span className="looklab-badge">No saved history</span>
                  <span className="looklab-badge">Downloads only</span>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-[color:var(--muted)]">
                Designed to feel polished and private. The strongest results usually come from a
                front-facing selfie with soft, even light and no heavy filters.
              </p>
            </div>

            <div className="mt-4 space-y-4">
              <section className="looklab-panel-soft rounded-[28px] px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="looklab-kicker">Step 1</p>
                    <h3 className="mt-1 text-base font-semibold text-[color:var(--foreground)]">
                      Upload your photo
                    </h3>
                  </div>
                  {uploadedImage ? (
                    <button
                      className="looklab-button-ghost px-0 text-xs"
                      onClick={resetSession}
                      type="button"
                    >
                      Reset
                    </button>
                  ) : null}
                </div>

                <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[24px] border border-dashed border-[color:var(--line-strong)] bg-[color:var(--surface-strong)] px-4 py-7 text-center transition hover:border-[color:var(--accent)] hover:bg-[color:var(--accent-soft)]">
                  <span className="text-sm font-semibold text-[color:var(--foreground)]">
                    Choose a clear face photo
                  </span>
                  <span className="max-w-xs text-xs leading-5 text-[color:var(--muted)]">
                    JPG, PNG, or WebP. One face, natural lighting, and very little tilt works best.
                  </span>
                  <span className="looklab-button-primary px-5 py-2 text-xs">
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
                  <div className="mt-4 overflow-hidden rounded-[24px] border border-[color:var(--line)] bg-[color:var(--surface)]">
                    <div className="aspect-[4/5] bg-[color:var(--surface-strong)]">
                      <img
                        alt="Uploaded face preview"
                        className="h-full w-full object-contain"
                        src={uploadedImage}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3 px-4 py-3 text-xs text-[color:var(--muted)]">
                      <span className="truncate">{uploadedFilename}</span>
                      <span>Original</span>
                    </div>
                  </div>
                ) : null}
              </section>

              <section className="looklab-panel-soft rounded-[28px] px-4 py-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="looklab-kicker">Step 2</p>
                    <h3 className="mt-1 text-base font-semibold text-[color:var(--foreground)]">
                      Choose a beauty style
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-[color:var(--muted)]">
                      Filter by area first, then pick the exact preview you want to test.
                    </p>
                  </div>
                  <span className="looklab-badge">{selectedStyle.category}</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {STYLE_CATEGORIES.map((category) => {
                    const isActive = selectedCategory === category;

                    return (
                      <button
                        className={isActive ? "looklab-chip-active" : "looklab-chip"}
                        key={category}
                        onClick={() => handleCategoryChange(category)}
                        type="button"
                      >
                        {category}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {visibleStyles.map((style) => {
                    const isSelected = style.id === selectedStyleId;

                    return (
                      <button
                        className={`rounded-[22px] border px-3 py-3 text-left transition ${
                          isSelected
                            ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--foreground)] shadow-[0_14px_30px_var(--shadow)]"
                            : "border-[color:var(--line)] bg-[color:var(--surface)] text-[color:var(--foreground)] hover:border-[color:var(--line-strong)] hover:bg-[color:var(--surface-strong)]"
                        }`}
                        key={style.id}
                        onClick={() => setSelectedStyleId(style.id)}
                        type="button"
                      >
                        <span className="block text-sm font-semibold">{style.label}</span>
                        <span className="mt-1 block text-[11px] uppercase tracking-[0.12em] text-[color:var(--muted)]">
                          {style.category}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="looklab-panel-soft rounded-[28px] px-4 py-4">
                <div>
                  <p className="looklab-kicker">Step 3</p>
                  <h3 className="mt-1 text-base font-semibold text-[color:var(--foreground)]">
                    Set intensity
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-[color:var(--muted)]">
                    Keep it subtle for realism, balanced for everyday use, or dramatic for stronger
                    exploration.
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {INTENSITY_OPTIONS.map((option) => {
                    const isActive = selectedIntensity === option.value;

                    return (
                      <button
                        className={`rounded-[22px] border px-3 py-3 text-left transition ${
                          isActive
                            ? "border-[color:var(--secondary)] bg-[color:var(--secondary-soft)] text-[color:var(--foreground)]"
                            : "border-[color:var(--line)] bg-[color:var(--surface)] text-[color:var(--foreground)] hover:border-[color:var(--line-strong)] hover:bg-[color:var(--surface-strong)]"
                        }`}
                        key={option.value}
                        onClick={() => setSelectedIntensity(option.value)}
                        type="button"
                      >
                        <span className="block text-sm font-semibold">{option.label}</span>
                        <span className="mt-1 block text-[11px] leading-4 text-[color:var(--muted)]">
                          {option.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="looklab-panel-dark rounded-[30px] px-4 py-4 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-white/55">
                      Ready to generate
                    </p>
                    <h3 className="looklab-display mt-2 text-2xl text-white">
                      {selectedStyle.label}
                    </h3>
                    <p className="mt-2 text-sm text-white/65">
                      Intensity set to {selectedIntensity}. Previews are simulations, not treatment
                      outcomes.
                    </p>
                  </div>
                  <span className="rounded-full border border-white/14 bg-white/6 px-3 py-1 text-[11px] font-medium text-white/80">
                    AI Preview
                  </span>
                </div>

                <button
                  className="looklab-button-dark mt-5 w-full justify-center"
                  disabled={!uploadedImage || isGenerating}
                  onClick={handleGenerate}
                  type="button"
                >
                  {isGenerating
                    ? batchProgress
                      ? `Generating ${batchProgress.done}/${batchProgress.total}...`
                      : "Generating..."
                    : generatedLooks.length === 0
                      ? "Generate first preview"
                      : "Generate another variation"}
                </button>

                <button
                  className="looklab-button-dark-secondary mt-2 w-full justify-center"
                  disabled={!uploadedImage || isGenerating || generatedLooks.length === 0}
                  onClick={handleBatchGenerate}
                  type="button"
                >
                  Generate 4 more recommended looks
                </button>

                <div className="mt-4 rounded-[22px] border border-white/10 bg-white/6 px-4 py-3 text-xs leading-5 text-white/65">
                  Session only. Nothing is stored in an account, and favorites stay in this browser
                  session until refresh.
                </div>
              </section>

              {errorMessage ? (
                <div className="rounded-[24px] border border-[color:var(--danger-line)] bg-[color:var(--danger-soft)] px-4 py-3 text-sm text-[color:var(--danger-text)]">
                  {errorMessage}
                </div>
              ) : null}
            </div>
          </aside>

          <section className="looklab-panel px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-4 rounded-[28px] border border-[color:var(--line)] bg-[color:var(--surface)] px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="looklab-kicker">Generated gallery</p>
                  <h2 className="looklab-display mt-2 text-3xl text-[color:var(--foreground)] sm:text-[2.35rem]">
                    Your preview moodboard
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
                    Compare edits, favorite the strongest results, and keep the board focused on
                    looks that stay believable.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="looklab-badge">{generatedLooks.length} generated</span>
                  <span className="looklab-badge">{favoriteLookIds.length} favorites</span>
                  <span className="looklab-badge">Downloadable</span>
                </div>
              </div>

              {!uploadedImage ? (
                <div className="looklab-empty-state flex min-h-[620px] items-center justify-center rounded-[30px] border border-dashed border-[color:var(--line-strong)] text-center">
                  <div className="max-w-lg px-6">
                    <div className="mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[24px] bg-[color:var(--surface-strong)]">
                      <LookLabLogo className="h-11 w-11 text-[color:var(--foreground)]" />
                    </div>
                    <h3 className="looklab-display mt-5 text-3xl text-[color:var(--foreground)]">
                      Start with one clear selfie
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                      Your generated looks, comparisons, and favorites will appear here after the
                      first preview.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {compareLook ? (
                    <section className="looklab-panel-dark overflow-hidden rounded-[30px] p-4 text-white sm:p-5">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                        <div className="max-w-2xl">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-white/55">
                            Compare original and edit
                          </p>
                          <h3 className="looklab-display mt-2 text-3xl text-white">
                            {compareLook.styleLabel}
                          </h3>
                          <p className="mt-3 text-sm leading-6 text-white/68">
                            Drag the slider slowly and look for believable skin texture, alignment,
                            and a result that still feels like the same person.
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {generatedLooks.slice(0, 5).map((look) => (
                            <button
                              className={
                                compareLook.id === look.id
                                  ? "looklab-chip-on-dark-active"
                                  : "looklab-chip-on-dark"
                              }
                              key={look.id}
                              onClick={() => setCompareLookId(look.id)}
                              type="button"
                            >
                              {look.styleLabel}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mt-5 rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-3 sm:p-4">
                        <div
                          className="relative aspect-[16/10] cursor-ew-resize touch-none select-none overflow-hidden rounded-[24px] bg-[#090f1d]"
                          onPointerCancel={handleComparePointerUp}
                          onPointerDown={handleComparePointerDown}
                          onPointerMove={handleComparePointerMove}
                          onPointerUp={handleComparePointerUp}
                          ref={compareStageRef}
                        >
                          <img
                            alt="Original uploaded face"
                            className="absolute inset-0 h-full w-full object-contain"
                            src={uploadedImage}
                          />
                          <div
                            className="absolute inset-0 overflow-hidden"
                            style={{ clipPath: `inset(0 ${100 - comparePosition}% 0 0)` }}
                          >
                            <img
                              alt={`${compareLook.styleLabel} comparison preview`}
                              className="absolute inset-0 h-full w-full object-contain"
                              src={compareLook.imageDataUrl}
                            />
                          </div>
                          <div
                            className="absolute inset-y-0 z-10 w-px bg-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.14)]"
                            style={{ left: `calc(${comparePosition}% - 0.5px)` }}
                          />
                          <div
                            className="pointer-events-none absolute top-1/2 z-10 h-10 w-10 -translate-y-1/2 rounded-full border border-white/25 bg-white text-[#0d1322] shadow-[0_8px_24px_rgba(0,0,0,0.24)]"
                            style={{ left: `calc(${comparePosition}% - 1.25rem)` }}
                          >
                            <span className="flex h-full items-center justify-center text-lg">
                              ↔
                            </span>
                          </div>
                          <div className="absolute left-3 top-3 rounded-full bg-black/45 px-3 py-1 text-xs font-medium text-white">
                            Original
                          </div>
                          <div className="absolute right-3 top-3 rounded-full bg-black/45 px-3 py-1 text-xs font-medium text-white">
                            {compareLook.styleLabel}
                          </div>
                        </div>

                        <div className="mt-4 rounded-[20px] border border-white/10 bg-black/15 px-4 py-4">
                          <input
                            className="looklab-range"
                            max={100}
                            min={0}
                            onChange={(event) => setComparePosition(Number(event.target.value))}
                            type="range"
                            value={comparePosition}
                          />
                        </div>
                      </div>
                    </section>
                  ) : null}

                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap gap-2">
                      <button
                        className={!showFavoritesOnly ? "looklab-chip-active" : "looklab-chip"}
                        onClick={() => setShowFavoritesOnly(false)}
                        type="button"
                      >
                        All results
                      </button>
                      <button
                        className={showFavoritesOnly ? "looklab-chip-active" : "looklab-chip"}
                        onClick={() => setShowFavoritesOnly(true)}
                        type="button"
                      >
                        Favorites only
                      </button>
                    </div>

                    {batchRecommendations.length > 0 && generatedLooks.length > 0 ? (
                      <p className="text-xs leading-5 text-[color:var(--muted)]">
                        Suggested next batch:{" "}
                        {batchRecommendations.map((style) => style.shortLabel).join(", ")}
                      </p>
                    ) : null}
                  </div>

                  <div className="columns-1 gap-4 sm:columns-2 xl:columns-3">
                    <article className="looklab-gallery-card mb-4 break-inside-avoid overflow-hidden rounded-[26px]">
                      <div className="aspect-[4/5] bg-[color:var(--surface-strong)]">
                        <img
                          alt="Original uploaded face"
                          className="h-full w-full object-contain"
                          src={uploadedImage}
                        />
                      </div>
                      <div className="px-4 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="looklab-kicker">Original</p>
                            <p className="mt-2 text-sm font-semibold text-[color:var(--foreground)]">
                              Uploaded photo
                            </p>
                          </div>
                          <button
                            className="looklab-button-ghost"
                            onClick={() =>
                              downloadDataUrl(uploadedImage, `${uploadedFilename}-original.jpg`)
                            }
                            type="button"
                          >
                            Download
                          </button>
                        </div>
                      </div>
                    </article>

                    {visibleLooks.map((look) => {
                      const isFavorite = favoriteLookIds.includes(look.id);

                      return (
                        <article
                          className="looklab-gallery-card group mb-4 break-inside-avoid overflow-hidden rounded-[26px]"
                          key={look.id}
                        >
                          <div className="aspect-[4/5] bg-[color:var(--surface-strong)]">
                            <img
                              alt={`${look.styleLabel} preview`}
                              className="h-full w-full object-contain transition duration-500 group-hover:scale-[1.015]"
                              src={look.imageDataUrl}
                            />
                          </div>

                          <div className="px-4 py-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="looklab-kicker">Generated look</p>
                                <p className="mt-2 text-sm font-semibold text-[color:var(--foreground)]">
                                  {look.styleLabel}
                                </p>
                                <p className="mt-2 text-xs text-[color:var(--muted)]">
                                  {look.category} · {look.intensity}
                                </p>
                              </div>
                              <button
                                className={
                                  isFavorite
                                    ? "looklab-chip-active px-3 py-1.5"
                                    : "looklab-chip px-3 py-1.5"
                                }
                                onClick={() => toggleFavorite(look.id)}
                                type="button"
                              >
                                {isFavorite ? "Favorited" : "Favorite"}
                              </button>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <button
                                className="looklab-button-ghost"
                                onClick={() => setCompareLookId(look.id)}
                                type="button"
                              >
                                Compare
                              </button>
                              <button
                                className="looklab-button-ghost"
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
                          </div>
                        </article>
                      );
                    })}

                    {showFavoritesOnly && visibleLooks.length === 0 ? (
                      <article className="mb-4 break-inside-avoid rounded-[26px] border border-dashed border-[color:var(--line-strong)] bg-[color:var(--surface-strong)] px-6 py-8 text-center">
                        <p className="text-base font-semibold text-[color:var(--foreground)]">
                          No favorites yet
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                          Save the looks you trust most so the shortlist stays quick to scan.
                        </p>
                      </article>
                    ) : null}

                    {isGenerating ? (
                      <article className="looklab-gallery-card mb-4 break-inside-avoid overflow-hidden rounded-[26px] p-4">
                        <div className="aspect-[4/5] rounded-[22px] bg-[linear-gradient(180deg,var(--accent-soft),var(--surface-strong))]" />
                        <div className="mt-4">
                          <p className="looklab-kicker">In progress</p>
                          <p className="mt-2 text-sm font-semibold text-[color:var(--foreground)]">
                            {batchProgress
                              ? `Building batch ${batchProgress.done}/${batchProgress.total}`
                              : `Building ${selectedStyle.label}`}
                          </p>
                        </div>
                      </article>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
